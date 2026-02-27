from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ResumeFeedbackRequest(BaseModel):
    resume_id: str


class ResumeFeedbackTaskResponse(BaseModel):
    task_id: str
    status: str = "queued"


class ResumeFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    skills_feedback: str
    phrasing_feedback: str
    formatting_feedback: str
    overall_feedback: str
    generator_source: str
    created_at: datetime
    updated_at: datetime
