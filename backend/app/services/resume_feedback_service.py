from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.resume_feedback_model import ResumeFeedback
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.models.user_model import User
from app.schemas.resume_feedback_schema import ResumeFeedbackResponse
from app.services.resume_parser_service import parse_resume_file

settings = get_settings()


async def generate_resume_feedback(
    resume_id: str,
    current_user: User,
    db: AsyncSession,
) -> ResumeFeedbackResponse:
    resume = await db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    parsed = await db.scalar(select(ResumeParseResult).where(ResumeParseResult.resume_id == resume.id))
    if not parsed:
        parsed = await _parse_resume_on_demand(resume=resume, db=db)

    generated = _generate_feedback(parsed)

    existing = await db.scalar(select(ResumeFeedback).where(ResumeFeedback.resume_id == resume.id))
    if existing:
        existing.skills_feedback = generated["skills_feedback"]
        existing.phrasing_feedback = generated["phrasing_feedback"]
        existing.formatting_feedback = generated["formatting_feedback"]
        existing.overall_feedback = generated["overall_feedback"]
        existing.generator_source = generated["generator_source"]
        await db.flush()
        return ResumeFeedbackResponse.model_validate(existing)

    feedback = ResumeFeedback(
        resume_id=resume.id,
        skills_feedback=generated["skills_feedback"],
        phrasing_feedback=generated["phrasing_feedback"],
        formatting_feedback=generated["formatting_feedback"],
        overall_feedback=generated["overall_feedback"],
        generator_source=generated["generator_source"],
    )
    db.add(feedback)
    await db.flush()
    return ResumeFeedbackResponse.model_validate(feedback)


def _generate_feedback(parsed: ResumeParseResult) -> dict[str, str]:
    payload = {
        "skills": parsed.skills or [],
        "experience": parsed.experience or [],
        "education": parsed.education or [],
    }

    generated = _generate_with_huggingface(payload)
    if generated:
        return generated

    return _generate_heuristic(payload)


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


def _generate_with_huggingface(payload: dict) -> dict[str, str] | None:
    if not settings.ai_api_key:
        return None

    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(token=settings.ai_api_key)
        prompt = (
            "You are a resume reviewer. Provide concise feedback with these exact sections: "
            "SKILLS:, PHRASING:, FORMATTING:, OVERALL:.\n"
            f"Extracted resume data: {payload}"
        )
        text = client.text_generation(
            prompt=prompt,
            model="google/flan-t5-large",
            max_new_tokens=300,
            temperature=0.3,
        )

        skills = _extract_section(text, "SKILLS")
        phrasing = _extract_section(text, "PHRASING")
        formatting = _extract_section(text, "FORMATTING")
        overall = _extract_section(text, "OVERALL")

        if not any([skills, phrasing, formatting, overall]):
            return None

        return {
            "skills_feedback": skills or "Add more role-specific and measurable skills.",
            "phrasing_feedback": phrasing or "Use stronger action verbs and quantified outcomes.",
            "formatting_feedback": formatting or "Keep formatting consistent and easy to scan.",
            "overall_feedback": overall or "Resume is a good base; improve detail and clarity.",
            "generator_source": "huggingface",
        }
    except Exception:
        return None


def _extract_section(text: str, section: str) -> str:
    marker = f"{section}:"
    start = text.find(marker)
    if start == -1:
        return ""

    start += len(marker)
    remaining = text[start:]
    next_positions = [
        remaining.find("SKILLS:"),
        remaining.find("PHRASING:"),
        remaining.find("FORMATTING:"),
        remaining.find("OVERALL:"),
    ]
    next_positions = [pos for pos in next_positions if pos > 0]

    end = min(next_positions) if next_positions else len(remaining)
    return remaining[:end].strip()


def _generate_heuristic(payload: dict) -> dict[str, str]:
    skills = payload.get("skills", [])
    experience = payload.get("experience", [])
    education = payload.get("education", [])

    skills_feedback = (
        "Detected skills: " + ", ".join(skills[:8]) + ". Add missing tools/frameworks for your target role."
        if skills
        else "Add a dedicated Technical Skills section with role-relevant tools and proficiency."
    )

    phrasing_feedback = (
        "Convert experience points into impact statements with metrics (%, $, time saved)."
        if experience
        else "Add clear experience bullet points using action verbs and measurable outcomes."
    )

    formatting_feedback = (
        "Education entries found. Keep section order: Summary, Skills, Experience, Education."
        if education
        else "Add an Education section and keep headings, bullet styles, and dates consistent."
    )

    overall_feedback = (
        "Strong start. Focus on quantifiable achievements, tailored keywords, and concise formatting."
    )

    return {
        "skills_feedback": skills_feedback,
        "phrasing_feedback": phrasing_feedback,
        "formatting_feedback": formatting_feedback,
        "overall_feedback": overall_feedback,
        "generator_source": "heuristic",
    }
