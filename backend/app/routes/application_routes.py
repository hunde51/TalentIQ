from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.application_schema import (
    ApplicationCreateRequest,
    ApplicationResponse,
    ApplicationStatus,
    ApplicationUpdateStatusRequest,
)
from app.services.application_service import create_application, list_applications, update_application_status


router = APIRouter(prefix="/application", tags=["application"])


@router.post("/create", response_model=ApplicationResponse)
async def create(
    payload: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    return await create_application(payload=payload, current_user=current_user, db=db)


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_status(
    application_id: str,
    payload: ApplicationUpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    return await update_application_status(
        application_id=application_id,
        status_value=payload.status,
        current_user=current_user,
        db=db,
    )


@router.get("/list", response_model=list[ApplicationResponse])
async def list_all(
    status: ApplicationStatus | None = Query(default=None),
    job_id: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationResponse]:
    return await list_applications(
        current_user=current_user,
        db=db,
        status_filter=status,
        job_id=job_id,
        user_id=user_id,
    )
