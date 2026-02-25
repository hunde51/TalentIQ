from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    sender_id: str
    sender_name: str | None = None
    sender_username: str | None = None
    content: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class ChatRoomItem(BaseModel):
    application_id: str
    job_id: str
    job_title: str
    applicant_id: str
    applicant_name: str | None = None
    applicant_username: str | None = None
    recruiter_id: str
    recruiter_name: str | None = None
    recruiter_username: str | None = None


class ChatRoomListResponse(BaseModel):
    items: list[ChatRoomItem]
