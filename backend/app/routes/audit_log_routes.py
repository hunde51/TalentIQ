from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User
from app.schemas.audit_log_schema import AuditLogListResponse
from app.services.audit_log_service import list_audit_logs


router = APIRouter(prefix="/audit-log", tags=["audit-log"])


@router.get("", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Query(default=None),
    method: str | None = Query(default=None),
    status_code: int | None = Query(default=None),
    _: User = Depends(require_roles("admin")),
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
