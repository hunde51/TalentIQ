from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ResumeParseResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    skills: list[str]
    experience: list[str]
    education: list[str]
    entities: list[dict]
    parser_source: str
    created_at: datetime
    updated_at: datetime
