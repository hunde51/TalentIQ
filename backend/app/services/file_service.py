from pathlib import Path

from fastapi import HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.application_model import Application
from app.models.cover_letter_model import CoverLetter
from app.models.job_model import Job
from app.models.resume_model import Resume
from app.models.user_model import User

settings = get_settings()


async def download_resume_file(resume_id: str, current_user: User, db: AsyncSession) -> FileResponse:
    resume = await db.scalar(select(Resume).where(Resume.id == resume_id))
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if current_user.role not in {"recruiter", "admin"} and resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to download this resume")

    if resume.storage_backend != "local":
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="S3 download not implemented yet")

    requested_path = Path(resume.file_path).resolve()
    upload_root = Path(settings.resume_upload_dir).resolve()

    # Ensure path is inside configured upload directory.
    if upload_root not in requested_path.parents and requested_path != upload_root:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid file path")

    if not requested_path.exists() or not requested_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file missing")

    return FileResponse(
        path=str(requested_path),
        media_type=resume.content_type or "application/octet-stream",
        filename=resume.original_filename,
    )


async def download_cover_letter_file(cover_letter_id: str, current_user: User, db: AsyncSession) -> FileResponse:
    cover_letter = await db.scalar(select(CoverLetter).where(CoverLetter.id == cover_letter_id))
    if not cover_letter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cover letter not found")

    allowed = await _can_access_cover_letter(
        cover_letter_id=cover_letter.id,
        owner_id=cover_letter.user_id,
        current_user=current_user,
        db=db,
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to download this cover letter")

    output_dir = Path(settings.resume_upload_dir).resolve().parent / "cover_letters"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"cover_letter_{cover_letter.id}.txt"
    output_path.write_text(cover_letter.generated_text, encoding="utf-8")

    return FileResponse(
        path=str(output_path),
        media_type="text/plain",
        filename=f"cover_letter_{cover_letter.id}.txt",
    )


async def _can_access_cover_letter(
    *,
    cover_letter_id: str,
    owner_id: str,
    current_user: User,
    db: AsyncSession,
) -> bool:
    if current_user.role == "admin" or owner_id == current_user.id:
        return True

    if current_user.role != "recruiter":
        return False

    linked = await db.scalar(
        select(Application.id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Application.cover_letter_id == cover_letter_id,
            Job.recruiter_id == current_user.id,
        )
    )
    return bool(linked)
