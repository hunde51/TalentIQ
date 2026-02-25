from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class ApplicationStatus(str, Enum):
    applied = "applied"
    interview = "interview"
    rejected = "rejected"


class ApplicationCreateRequest(BaseModel):
    job_id: str
    user_id: str
    status: ApplicationStatus = ApplicationStatus.applied


class ApplicationUpdateStatusRequest(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    job_title: str | None = None
    user_id: str
    applicant_name: str | None = None
    applicant_username: str | None = None
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
