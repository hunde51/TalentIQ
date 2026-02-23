from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User
from app.schemas.search_schema import SearchJobsResponse, SearchResumesResponse
from app.services.search_service import search_jobs, search_resumes


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/jobs", response_model=SearchJobsResponse)
async def search_jobs_endpoint(
    q: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    semantic: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
) -> SearchJobsResponse:
    return await search_jobs(db=db, query=q, page=page, size=size, semantic=semantic)


@router.get("/resumes", response_model=SearchResumesResponse)
async def search_resumes_endpoint(
    q: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    semantic: bool = Query(default=False),
    _: User = Depends(require_roles("recruiter", "admin")),
    db: AsyncSession = Depends(get_db),
) -> SearchResumesResponse:
    return await search_resumes(db=db, query=q, page=page, size=size, semantic=semantic)
