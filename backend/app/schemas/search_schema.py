from pydantic import BaseModel


class SearchJobItem(BaseModel):
    id: str
    title: str
    location: str
    skills: list[str]


class SearchResumeItem(BaseModel):
    resume_id: str
    user_id: str
    skills: list[str]
    experience: list[str]
    education: list[str]


class SearchJobsResponse(BaseModel):
    query: str
    semantic: bool
    page: int
    size: int
    total: int
    items: list[SearchJobItem]


class SearchResumesResponse(BaseModel):
    query: str
    semantic: bool
    page: int
    size: int
    total: int
    items: list[SearchResumeItem]
