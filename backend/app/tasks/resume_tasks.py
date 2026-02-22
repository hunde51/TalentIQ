import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.services.resume_parser_service import parse_resume_file
from app.tasks.celery_app import celery_app


async def _process_resume_async(resume_id: str) -> dict[str, str]:
    async with AsyncSessionLocal() as session:
        resume = await session.scalar(select(Resume).where(Resume.id == resume_id))
        if not resume:
            return {"resume_id": resume_id, "status": "not_found"}

        try:
            resume.processing_status = "processing"
            await session.flush()

            parsed = parse_resume_file(resume.file_path)

            existing = await session.scalar(select(ResumeParseResult).where(ResumeParseResult.resume_id == resume.id))
            if existing:
                existing.skills = parsed["skills"]
                existing.experience = parsed["experience"]
                existing.education = parsed["education"]
                existing.entities = parsed["entities"]
                existing.parser_source = parsed["parser_source"]
            else:
                session.add(
                    ResumeParseResult(
                        resume_id=resume.id,
                        skills=parsed["skills"],
                        experience=parsed["experience"],
                        education=parsed["education"],
                        entities=parsed["entities"],
                        parser_source=parsed["parser_source"],
                    )
                )

            resume.processing_status = "parsed"
            await session.commit()
            return {"resume_id": resume_id, "status": "parsed"}
        except Exception as exc:
            resume.processing_status = "failed"
            await session.commit()
            return {"resume_id": resume_id, "status": "failed", "error": str(exc)}


@celery_app.task(name="app.tasks.resume_tasks.process_resume")
def process_resume(resume_id: str) -> dict[str, str]:
    return asyncio.run(_process_resume_async(resume_id))
