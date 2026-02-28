from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user_model import User
from app.schemas.job_match_schema import JobMatchRequest, JobMatchResponse
from app.schemas.job_schema import JobCreateRequest, JobListResponse, JobResponse, JobUpdateRequest
from app.services.job_matching_service import match_resume_to_jobs
from app.services.job_service import (
    create_job_posting,
    delete_job_posting,
    list_jobs,
    list_public_jobs,
    update_job_posting,
)


router = APIRouter(prefix="/job", tags=["job"])


@router.post("/create", response_model=JobResponse)
async def create_job(
    payload: JobCreateRequest,
    current_user: User = Depends(require_roles("recruiter", "admin")),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    return await create_job_posting(payload=payload, current_user=current_user, db=db)


@router.get("/list", response_model=JobListResponse)
async def get_job_list(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    skill: str | None = Query(default=None),
    location: str | None = Query(default=None),
    q: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JobListResponse:
    return await list_jobs(
        db=db,
        current_user=current_user,
        page=page,
        size=size,
        skill=skill,
        location=location,
        q=q,
    )


@router.get("/public-list", response_model=JobListResponse)
async def get_public_job_list(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    skill: str | None = Query(default=None),
    location: str | None = Query(default=None),
    q: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> JobListResponse:
    return await list_public_jobs(
        db=db,
        page=page,
        size=size,
        skill=skill,
        location=location,
        q=q,
    )


@router.post("/match", response_model=JobMatchResponse)
async def match_jobs(
    payload: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JobMatchResponse:
    return await match_resume_to_jobs(payload=payload, current_user=current_user, db=db)


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    payload: JobUpdateRequest,
    current_user: User = Depends(require_roles("recruiter", "admin")),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    return await update_job_posting(job_id=job_id, payload=payload, current_user=current_user, db=db)


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: User = Depends(require_roles("recruiter", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    return await delete_job_posting(job_id=job_id, current_user=current_user, db=db)
