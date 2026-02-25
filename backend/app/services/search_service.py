from __future__ import annotations

from sqlalchemy import String, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_model import Job
from app.models.resume_model import Resume
from app.models.resume_parse_model import ResumeParseResult
from app.schemas.search_schema import (
    SearchJobItem,
    SearchJobsResponse,
    SearchResumeItem,
    SearchResumesResponse,
)
from app.services.embedding_service import generate_embeddings

_NUMPY = None


def _get_numpy():
    global _NUMPY
    if _NUMPY is None:
        import numpy as np

        _NUMPY = np
    return _NUMPY


def _sim(a, b) -> float:
    np = _get_numpy()
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


async def search_jobs(
    db: AsyncSession,
    query: str,
    page: int = 1,
    size: int = 10,
    semantic: bool = False,
) -> SearchJobsResponse:
    query = query.strip()
    if not query:
        return SearchJobsResponse(query=query, semantic=semantic, page=page, size=size, total=0, items=[])

    if semantic:
        jobs = (await db.scalars(select(Job).order_by(Job.created_at.desc()).limit(300))).all()
        if not jobs:
            return SearchJobsResponse(query=query, semantic=True, page=page, size=size, total=0, items=[])

        np = _get_numpy()
        texts = [f"{j.title} {j.description} {' '.join(j.skills)} {j.location}" for j in jobs]
        vectors = await generate_embeddings([query, *texts])
        qv = np.array(vectors[0], dtype=np.float32)
        vecs = np.array(vectors[1:], dtype=np.float32)

        scored = sorted(
            ((job, _sim(qv, v)) for job, v in zip(jobs, vecs, strict=False)),
            key=lambda x: x[1],
            reverse=True,
        )
        total = len(scored)
        chunk = scored[(page - 1) * size : (page - 1) * size + size]
        items = [
            SearchJobItem(id=job.id, title=job.title, location=job.location, skills=job.skills)
            for job, _ in chunk
        ]
        return SearchJobsResponse(query=query, semantic=True, page=page, size=size, total=total, items=items)

    tsv = func.to_tsvector(
        "simple",
        func.concat_ws(" ", Job.title, Job.description, Job.location, cast(Job.skills, String)),
    )
    tsq = func.plainto_tsquery("simple", query)

    stmt = select(Job).where(tsv.op("@@")(tsq)).order_by(func.ts_rank(tsv, tsq).desc(), Job.created_at.desc())
    total = len((await db.scalars(stmt)).all())
    rows = (await db.scalars(stmt.offset((page - 1) * size).limit(size))).all()

    return SearchJobsResponse(
        query=query,
        semantic=False,
        page=page,
        size=size,
        total=total,
        items=[SearchJobItem(id=j.id, title=j.title, location=j.location, skills=j.skills) for j in rows],
    )


async def search_resumes(
    db: AsyncSession,
    query: str,
    page: int = 1,
    size: int = 10,
    semantic: bool = False,
) -> SearchResumesResponse:
    query = query.strip()
    if not query:
        return SearchResumesResponse(query=query, semantic=semantic, page=page, size=size, total=0, items=[])

    joined = (
        select(Resume, ResumeParseResult)
        .join(ResumeParseResult, ResumeParseResult.resume_id == Resume.id)
        .order_by(Resume.created_at.desc())
    )

    rows = (await db.execute(joined)).all()
    if not rows:
        return SearchResumesResponse(query=query, semantic=semantic, page=page, size=size, total=0, items=[])

    if semantic:
        np = _get_numpy()
        texts = [
            f"skills: {' '.join((p.skills or []))}; experience: {' '.join((p.experience or []))}; education: {' '.join((p.education or []))}"
            for _, p in rows
        ]
        vectors = await generate_embeddings([query, *texts])
        qv = np.array(vectors[0], dtype=np.float32)
        vecs = np.array(vectors[1:], dtype=np.float32)
        scored = sorted(
            ((pair, _sim(qv, v)) for pair, v in zip(rows, vecs, strict=False)),
            key=lambda x: x[1],
            reverse=True,
        )
        total = len(scored)
        chunk = scored[(page - 1) * size : (page - 1) * size + size]
        items = [
            SearchResumeItem(
                resume_id=r.id,
                user_id=r.user_id,
                skills=p.skills or [],
                experience=p.experience or [],
                education=p.education or [],
            )
            for (r, p), _ in chunk
        ]
        return SearchResumesResponse(query=query, semantic=True, page=page, size=size, total=total, items=items)

    filtered = []
    ql = query.lower()
    for r, p in rows:
        blob = " ".join((p.skills or []) + (p.experience or []) + (p.education or [])).lower()
        if ql in blob:
            filtered.append((r, p))

    total = len(filtered)
    chunk = filtered[(page - 1) * size : (page - 1) * size + size]
    items = [
        SearchResumeItem(
            resume_id=r.id,
            user_id=r.user_id,
            skills=p.skills or [],
            experience=p.experience or [],
            education=p.education or [],
        )
        for r, p in chunk
    ]

    return SearchResumesResponse(query=query, semantic=False, page=page, size=size, total=total, items=items)
