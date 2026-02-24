from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None
    action: str
    method: str
    path: str
    status_code: int
    ip_address: str | None
    user_agent: str | None
    details: dict | None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    page: int
    size: int
    total: int
    items: list[AuditLogResponse]
