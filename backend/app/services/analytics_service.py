from collections import Counter

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application_model import Application
from app.models.job_model import Job
from app.models.user_model import User
from app.schemas.analytics_schema import AnalyticsResponse, ApplicationsPerJobItem, PopularSkillItem


async def get_analytics(db: AsyncSession, current_user: User, top_skills: int = 10) -> AnalyticsResponse:
    applications_stmt = (
        select(
            Job.id,
            Job.title,
            func.count(Application.id).label("application_count"),
        )
        .outerjoin(Application, Application.job_id == Job.id)
    )
    if current_user.role == "recruiter":
        applications_stmt = applications_stmt.where(Job.recruiter_id == current_user.id)
    applications_stmt = applications_stmt.group_by(Job.id, Job.title).order_by(
        func.count(Application.id).desc(), Job.created_at.desc()
    )

    application_rows = (await db.execute(applications_stmt)).all()
    applications_per_job = [
        ApplicationsPerJobItem(
            job_id=row.id,
            title=row.title,
            application_count=int(row.application_count or 0),
        )
        for row in application_rows
    ]

    jobs_stmt = select(Job.skills)
    if current_user.role == "recruiter":
        jobs_stmt = jobs_stmt.where(Job.recruiter_id == current_user.id)
    jobs = (await db.scalars(jobs_stmt)).all()
    counter: Counter[str] = Counter()
    for skills in jobs:
        for skill in skills or []:
            normalized = skill.strip().lower()
            if normalized:
                counter[normalized] += 1

    popular_skills = [
        PopularSkillItem(skill=skill, count=count)
        for skill, count in counter.most_common(top_skills)
    ]

    return AnalyticsResponse(
        applications_per_job=applications_per_job,
        popular_skills=popular_skills,
    )
