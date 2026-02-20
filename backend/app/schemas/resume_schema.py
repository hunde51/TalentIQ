from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ResumeUploadResponse(BaseModel):
    id: str
    original_filename: str
    file_path: str
    storage_backend: str
    content_type: str
    file_size: int
    processing_status: str
    processing_task_id: str | None = None


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    original_filename: str
    stored_filename: str
    file_path: str
    storage_backend: str
    content_type: str
    file_size: int
    processing_status: str
    processing_task_id: str | None
    created_at: datetime
    updated_at: datetime
