import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.resume_feedback_model import ResumeFeedback
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.services.resume_feedback_service import _generate_feedback
from app.tasks.celery_app import celery_app


async def _generate_resume_feedback_async(resume_id: str, user_id: str) -> dict[str, str]:
    async with AsyncSessionLocal() as session:
        resume = await session.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id))
        if not resume:
            return {"status": "not_found", "detail": "Resume not found"}

        parsed = await session.scalar(select(ResumeParseResult).where(ResumeParseResult.resume_id == resume.id))
        if not parsed:
            return {"status": "not_ready", "detail": "Resume parse result not found yet"}

        generated = _generate_feedback(parsed)

        existing = await session.scalar(select(ResumeFeedback).where(ResumeFeedback.resume_id == resume.id))
        if existing:
            existing.skills_feedback = generated["skills_feedback"]
            existing.phrasing_feedback = generated["phrasing_feedback"]
            existing.formatting_feedback = generated["formatting_feedback"]
            existing.overall_feedback = generated["overall_feedback"]
            existing.generator_source = generated["generator_source"]
        else:
            session.add(
                ResumeFeedback(
                    resume_id=resume.id,
                    skills_feedback=generated["skills_feedback"],
                    phrasing_feedback=generated["phrasing_feedback"],
                    formatting_feedback=generated["formatting_feedback"],
                    overall_feedback=generated["overall_feedback"],
                    generator_source=generated["generator_source"],
                )
            )

        await session.commit()
        return {"status": "completed", "resume_id": resume_id}


@celery_app.task(name="app.tasks.feedback_tasks.generate_resume_feedback_task")
def generate_resume_feedback_task(resume_id: str, user_id: str) -> dict[str, str]:
    return asyncio.run(_generate_resume_feedback_async(resume_id=resume_id, user_id=user_id))
