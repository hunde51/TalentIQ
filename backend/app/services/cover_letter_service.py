from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.cover_letter_model import CoverLetter
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.models.user_model import User
from app.schemas.cover_letter_schema import CoverLetterGenerateRequest, CoverLetterResponse

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume parse result not found yet")

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
