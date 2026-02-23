from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    sender_id: str
    content: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class ChatRoomItem(BaseModel):
    application_id: str
    job_id: str
    job_title: str
    applicant_id: str
    recruiter_id: str


class ChatRoomListResponse(BaseModel):
    items: list[ChatRoomItem]
