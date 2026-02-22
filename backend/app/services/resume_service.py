from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.models.user_model import User
from app.schemas.resume_parse_schema import ResumeParseResultResponse
from app.schemas.resume_schema import ResumeUploadResponse
from app.tasks import enqueue_resume_processing

settings = get_settings()


async def upload_resume(file: UploadFile, current_user: User, db: AsyncSession) -> ResumeUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name is required")

    content_type = (file.content_type or "").lower()
    if content_type not in settings.allowed_resume_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed: PDF, DOC, DOCX",
        )

    content = await file.read()
    file_size = len(content)
    if file_size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file is not allowed")

    if file_size > settings.max_resume_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max allowed is {settings.max_resume_file_size} bytes",
        )

    suffix = Path(file.filename).suffix.lower()
    stored_filename = f"{uuid4()}{suffix}"

    if settings.storage_backend == "s3":
        file_path = _store_on_s3(stored_filename, content, content_type)
    else:
        file_path = _store_locally(stored_filename, content)

    resume = Resume(
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        storage_backend=settings.storage_backend,
        content_type=content_type,
        file_size=file_size,
    )
    db.add(resume)
    await db.flush()

    task_id = enqueue_resume_processing(resume.id)
    if task_id:
        resume.processing_status = "queued"
        resume.processing_task_id = task_id

    await db.flush()

    return ResumeUploadResponse(
        id=resume.id,
        original_filename=resume.original_filename,
        file_path=resume.file_path,
        storage_backend=resume.storage_backend,
        content_type=resume.content_type,
        file_size=resume.file_size,
        processing_status=resume.processing_status,
        processing_task_id=resume.processing_task_id,
    )


async def get_my_resume_parse_result(
    resume_id: str,
    current_user: User,
    db: AsyncSession,
) -> ResumeParseResultResponse:
    resume = await db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    parsed = await db.scalar(select(ResumeParseResult).where(ResumeParseResult.resume_id == resume.id))
    if not parsed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume parse result not found yet")

    # Normalize persisted JSON to avoid validation/runtime issues from legacy rows.
    skills = [str(item) for item in (parsed.skills or []) if item is not None]
    experience = [str(item) for item in (parsed.experience or []) if item is not None]
    education = [str(item) for item in (parsed.education or []) if item is not None]
    entities = [item for item in (parsed.entities or []) if isinstance(item, dict)]

    return ResumeParseResultResponse(
        id=parsed.id,
        resume_id=parsed.resume_id,
        skills=skills,
        experience=experience,
        education=education,
        entities=entities,
        parser_source=parsed.parser_source,
        created_at=parsed.created_at,
        updated_at=parsed.updated_at,
    )


def _store_locally(stored_filename: str, content: bytes) -> str:
    upload_dir = Path(settings.resume_upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / stored_filename
    file_path.write_bytes(content)
    return str(file_path)


def _store_on_s3(stored_filename: str, content: bytes, content_type: str) -> str:
    import boto3

    from botocore.exceptions import BotoCoreError, ClientError

    if not settings.s3_bucket_name:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="S3 bucket is not configured")

    try:
        client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        key = f"resumes/{stored_filename}"
        client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return f"s3://{settings.s3_bucket_name}/{key}"
    except (BotoCoreError, ClientError):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload file to S3")
