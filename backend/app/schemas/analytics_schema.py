from pydantic import BaseModel


class ApplicationsPerJobItem(BaseModel):
    job_id: str
    title: str
    application_count: int


class PopularSkillItem(BaseModel):
    skill: str
    count: int


class AnalyticsResponse(BaseModel):
    applications_per_job: list[ApplicationsPerJobItem]
    popular_skills: list[PopularSkillItem]
