from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.application_model import Application
from app.models.cover_letter_model import CoverLetter
from app.models.job_model import Job
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.models.user_model import User
from app.schemas.cover_letter_schema import CoverLetterGenerateRequest, CoverLetterResponse
from app.services.resume_parser_service import parse_resume_file

settings = get_settings()


async def generate_cover_letter(
    payload: CoverLetterGenerateRequest,
    current_user: User,
    db: AsyncSession,
) -> CoverLetterResponse:
    resume = await db.scalar(select(Resume).where(Resume.id == payload.resume_id, Resume.user_id == current_user.id))
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    parsed = await db.scalar(select(ResumeParseResult).where(ResumeParseResult.resume_id == resume.id))
    if not parsed:
        parsed = await _parse_resume_on_demand(resume=resume, db=db)

    generated_text, source = _generate_text(parsed, payload.job_description)

    entity = CoverLetter(
        user_id=current_user.id,
        resume_id=resume.id,
        job_description=payload.job_description.strip(),
        generated_text=generated_text,
        generator_source=source,
    )
    db.add(entity)
    await db.flush()

    return CoverLetterResponse.model_validate(entity)


async def upload_cover_letter(
    *,
    resume_id: str,
    job_description: str,
    file: UploadFile,
    current_user: User,
    db: AsyncSession,
) -> CoverLetterResponse:
    resume = await db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name is required")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".txt", ".md"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .txt or .md files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file is not allowed")

    if len(content) > 100_000:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Cover letter file too large")

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be UTF-8 text")

    cleaned = text.strip()
    if len(cleaned) < 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cover letter text is too short")

    entity = CoverLetter(
        user_id=current_user.id,
        resume_id=resume.id,
        job_description=job_description.strip() or "Uploaded by applicant",
        generated_text=cleaned,
        generator_source="uploaded",
    )
    db.add(entity)
    await db.flush()
    return CoverLetterResponse.model_validate(entity)


async def get_cover_letter(
    *,
    cover_letter_id: str,
    current_user: User,
    db: AsyncSession,
) -> CoverLetterResponse:
    cover_letter = await db.scalar(select(CoverLetter).where(CoverLetter.id == cover_letter_id))
    if not cover_letter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cover letter not found")

    allowed = await _can_access_cover_letter(cover_letter_id=cover_letter_id, owner_id=cover_letter.user_id, current_user=current_user, db=db)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this cover letter")

    return CoverLetterResponse.model_validate(cover_letter)


async def _parse_resume_on_demand(resume: Resume, db: AsyncSession) -> ResumeParseResult:
    existing = await db.scalar(select(ResumeParseResult).where(ResumeParseResult.resume_id == resume.id))
    if existing:
        return existing

    try:
        parsed_payload = parse_resume_file(resume.file_path)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to parse resume")

    entity = ResumeParseResult(
        resume_id=resume.id,
        skills=parsed_payload["skills"],
        experience=parsed_payload["experience"],
        education=parsed_payload["education"],
        entities=parsed_payload["entities"],
        parser_source=parsed_payload["parser_source"],
    )
    db.add(entity)
    resume.processing_status = "parsed"
    resume.processing_task_id = None
    await db.flush()
    return entity


def _generate_text(parsed: ResumeParseResult, job_description: str) -> tuple[str, str]:
    hf_text = _generate_with_hf(parsed, job_description)
    if hf_text:
        return hf_text, "huggingface"

    skills = ", ".join(parsed.skills[:8]) if parsed.skills else "relevant technical skills"
    experience = "; ".join(parsed.experience[:3]) if parsed.experience else "hands-on project experience"

    letter = (
        "Dear Hiring Manager,\n\n"
        "I am excited to apply for this role. My background aligns well with your requirements, "
        f"especially in {skills}. Through my work, I have developed {experience}.\n\n"
        "I am particularly interested in this opportunity because it emphasizes practical impact and "
        "continuous learning. I would value the chance to contribute my problem-solving skills and "
        "collaborative approach to your team.\n\n"
        "Thank you for your time and consideration. I look forward to the opportunity to discuss how "
        "I can contribute.\n\n"
        "Sincerely,\n"
        "Candidate"
    )
    return letter, "heuristic"


def _generate_with_hf(parsed: ResumeParseResult, job_description: str) -> str | None:
    if not settings.ai_api_key:
        return None

    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(token=settings.ai_api_key)
        prompt = (
            "Write a concise professional cover letter based on resume summary and job description.\n"
            f"Resume skills: {parsed.skills}\n"
            f"Resume experience: {parsed.experience}\n"
            f"Resume education: {parsed.education}\n"
            f"Job description: {job_description}\n"
            "Output only the letter body in plain text."
        )
        output = client.text_generation(
            prompt=prompt,
            model="google/flan-t5-large",
            max_new_tokens=350,
            temperature=0.4,
        )
        return output.strip() if output else None
    except Exception:
        return None


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
