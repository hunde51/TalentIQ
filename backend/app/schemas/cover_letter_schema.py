from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CoverLetterGenerateRequest(BaseModel):
    resume_id: str
    job_description: str = Field(min_length=20, max_length=10000)


class CoverLetterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    resume_id: str
    job_description: str
    generated_text: str
    generator_source: str
    created_at: datetime
    updated_at: datetime
