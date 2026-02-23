from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user_model import User
from app.schemas.audit_log_schema import AuditLogListResponse
from app.schemas.user_admin_schema import UserListResponse, UserUpdateRequest, UserUpdateResponse
from app.services.audit_log_service import list_audit_logs
from app.services.user_admin_service import list_users, update_user


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    q: str | None = Query(default=None),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListResponse:
    return await list_users(db=db, page=page, size=size, role=role, is_active=is_active, q=q)


@router.patch("/users/{user_id}", response_model=UserUpdateResponse)
async def patch_user(
    user_id: str,
    payload: UserUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserUpdateResponse:
    return await update_user(user_id=user_id, payload=payload, current_admin_id=current_admin.id, db=db)


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Query(default=None),
    method: str | None = Query(default=None),
    status_code: int | None = Query(default=None),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AuditLogListResponse:
    return await list_audit_logs(
        db=db,
        page=page,
        size=size,
        user_id=user_id,
        method=method,
        status_code=status_code,
    )
