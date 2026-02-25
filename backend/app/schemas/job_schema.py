from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=20, max_length=5000)
    skills: list[str] = Field(min_length=1, max_length=50)
    location: str = Field(min_length=2, max_length=255)


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recruiter_id: str
    recruiter_name: str | None = None
    recruiter_username: str | None = None
    title: str
    description: str
    skills: list[str]
    location: str
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    page: int
    size: int
    total: int
    items: list[JobResponse]
