from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.job_match_model import JobMatchResult
from app.models.job_model import Job
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.models.user_model import User
from app.schemas.job_match_schema import JobMatchItem, JobMatchRequest, JobMatchResponse
from app.services.embedding_service import generate_embeddings
from app.tasks import enqueue_email_notification

_NUMPY = None


def _get_numpy():
    global _NUMPY
    if _NUMPY is None:
        import numpy as np

        _NUMPY = np
    return _NUMPY


def _cosine_similarity(a, b) -> float:
    np = _get_numpy()
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


async def match_resume_to_jobs(payload: JobMatchRequest, current_user: User, db: AsyncSession) -> JobMatchResponse:
    resume = await db.scalar(select(Resume).where(Resume.id == payload.resume_id, Resume.user_id == current_user.id))
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    parsed = await db.scalar(select(ResumeParseResult).where(ResumeParseResult.resume_id == resume.id))
    if not parsed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume parse result not found yet")

    jobs = (await db.scalars(select(Job).order_by(Job.created_at.desc()))).all()
    if not jobs:
        return JobMatchResponse(
            resume_id=resume.id,
            model_name=get_settings().embedding_model,
            generated_at=datetime.now(timezone.utc),
            matches=[],
        )

    resume_text = _build_resume_text(parsed)
    job_texts = [_build_job_text(job) for job in jobs]

    np = _get_numpy()
    vectors = await generate_embeddings([resume_text, *job_texts])
    resume_vec = np.array(vectors[0], dtype=np.float32)
    job_vecs = np.array(vectors[1:], dtype=np.float32)

    scored: list[tuple[Job, float]] = []
    for job, vec in zip(jobs, job_vecs, strict=False):
        score = _cosine_similarity(resume_vec, vec)
        scored.append((job, score))

    scored.sort(key=lambda item: item[1], reverse=True)
    top = scored[: payload.top_k]

    await db.execute(delete(JobMatchResult).where(JobMatchResult.resume_id == resume.id))

    matches: list[JobMatchItem] = []
    for idx, (job, score) in enumerate(top, start=1):
        db.add(
            JobMatchResult(
                resume_id=resume.id,
                job_id=job.id,
                similarity_score=score,
                rank=idx,
            )
        )
        matches.append(
            JobMatchItem(
                job_id=job.id,
                title=job.title,
                location=job.location,
                skills=job.skills,
                similarity_score=round(score, 4),
                rank=idx,
            )
        )

    await db.flush()
    _enqueue_match_email(current_user=current_user, matches=matches)

    return JobMatchResponse(
        resume_id=resume.id,
        model_name=get_settings().embedding_model,
        generated_at=datetime.now(timezone.utc),
        matches=matches,
    )


def _build_resume_text(parsed: ResumeParseResult) -> str:
    skills = ", ".join(parsed.skills or [])
    experience = "; ".join(parsed.experience or [])
    education = "; ".join(parsed.education or [])
    return f"Skills: {skills}\nExperience: {experience}\nEducation: {education}"


def _build_job_text(job: Job) -> str:
    skills = ", ".join(job.skills or [])
    return f"Title: {job.title}\nDescription: {job.description}\nSkills: {skills}\nLocation: {job.location}"


def _enqueue_match_email(current_user: User, matches: list[JobMatchItem]) -> None:
    if not matches:
        return
    top = matches[0]
    subject = "Your latest job match results are ready"
    body = (
        f"Hi,\n\nYour resume has been matched to current job postings.\n"
        f"Top match: {top.title} ({top.location}) with score {top.similarity_score}.\n\n"
        "Check your dashboard for full ranked matches.\n"
    )
    enqueue_email_notification(to_email=current_user.email, subject=subject, body=body)
