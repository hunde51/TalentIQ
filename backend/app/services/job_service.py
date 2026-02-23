from fastapi import HTTPException, status
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_model import Job
from app.models.user_model import User
from app.schemas.job_schema import JobCreateRequest, JobListResponse, JobResponse


async def create_job_posting(payload: JobCreateRequest, current_user: User, db: AsyncSession) -> JobResponse:
    normalized_title = payload.title.strip()
    normalized_location = payload.location.strip()
    normalized_description = payload.description.strip()
    normalized_skills = _normalize_skills(payload.skills)

    duplicate = await db.scalar(
        select(Job).where(
            Job.recruiter_id == current_user.id,
            func.lower(Job.title) == normalized_title.lower(),
            func.lower(Job.location) == normalized_location.lower(),
        )
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate job posting for same title and location",
        )

    job = Job(
        recruiter_id=current_user.id,
        title=normalized_title,
        description=normalized_description,
        skills=normalized_skills,
        location=normalized_location,
    )
    db.add(job)
    await db.flush()

    return JobResponse(
        id=job.id,
        recruiter_id=job.recruiter_id,
        recruiter_name=current_user.name,
        recruiter_username=current_user.username,
        title=job.title,
        description=job.description,
        skills=job.skills,
        location=job.location,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


def _normalize_skills(skills: list[str]) -> list[str]:
    cleaned = [skill.strip() for skill in skills if skill and skill.strip()]
    unique: list[str] = []
    seen: set[str] = set()

    for skill in cleaned:
        key = skill.lower()
        if key not in seen:
            seen.add(key)
            unique.append(skill)

    if not unique:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one non-empty skill is required")

    return unique


async def list_jobs(
    db: AsyncSession,
    current_user: User,
    page: int = 1,
    size: int = 10,
    skill: str | None = None,
    location: str | None = None,
    q: str | None = None,
) -> JobListResponse:
    filters = []
    if current_user.role == "recruiter":
        filters.append(Job.recruiter_id == current_user.id)

    if location:
        filters.append(func.lower(Job.location).contains(location.strip().lower()))
    if skill:
        # JSONB text search fallback to keep implementation simple.
        filters.append(cast(Job.skills, String).ilike(f"%{skill.strip()}%"))
    if q:
        needle = f"%{q.strip()}%"
        filters.append(
            or_(
                Job.title.ilike(needle),
                Job.description.ilike(needle),
                Job.location.ilike(needle),
                cast(Job.skills, String).ilike(needle),
            )
        )

    base = select(Job)
    if filters:
        for condition in filters:
            base = base.where(condition)

    total_stmt = select(func.count()).select_from(base.subquery())
    total = int((await db.scalar(total_stmt)) or 0)

    offset = (page - 1) * size
    rows = (
        await db.execute(
            base.join(User, User.id == Job.recruiter_id)
            .add_columns(User.name, User.username)
            .order_by(Job.created_at.desc())
            .offset(offset)
            .limit(size)
        )
    ).all()

    return JobListResponse(
        page=page,
        size=size,
        total=total,
        items=[
            JobResponse(
                id=job.id,
                recruiter_id=job.recruiter_id,
                recruiter_name=recruiter_name,
                recruiter_username=recruiter_username,
                title=job.title,
                description=job.description,
                skills=job.skills,
                location=job.location,
                created_at=job.created_at,
                updated_at=job.updated_at,
            )
            for job, recruiter_name, recruiter_username in rows
        ],
    )
