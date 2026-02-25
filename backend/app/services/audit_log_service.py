from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log_model import AuditLog
from app.schemas.audit_log_schema import AuditLogListResponse


async def list_audit_logs(
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
    user_id: str | None = None,
    method: str | None = None,
    status_code: int | None = None,
) -> AuditLogListResponse:
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if method:
        filters.append(AuditLog.method == method.upper())
    if status_code is not None:
        filters.append(AuditLog.status_code == status_code)

    total_stmt = select(func.count()).select_from(AuditLog)
    if filters:
        total_stmt = total_stmt.where(and_(*filters))
    total = (await db.execute(total_stmt)).scalar_one()

    stmt = select(AuditLog)
    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size)

    logs = (await db.scalars(stmt)).all()
    return AuditLogListResponse(page=page, size=size, total=total, items=logs)
