from datetime import datetime

from pydantic import BaseModel, Field


class JobMatchRequest(BaseModel):
    resume_id: str
    top_k: int = Field(default=5, ge=1, le=20)


class JobMatchItem(BaseModel):
    job_id: str
    title: str
    location: str
    skills: list[str]
    similarity_score: float
    rank: int


class JobMatchResponse(BaseModel):
    resume_id: str
    model_name: str
    generated_at: datetime
    matches: list[JobMatchItem]
