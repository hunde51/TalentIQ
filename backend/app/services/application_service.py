from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application_model import Application
from app.models.cover_letter_model import CoverLetter
from app.models.job_model import Job
from app.models.resume_model import Resume
from app.models.user_model import User
from app.schemas.application_schema import (
    ApplicationCreateRequest,
    ApplicationResponse,
    ApplicationStatus,
)
from app.tasks import enqueue_email_notification


async def create_application(payload: ApplicationCreateRequest, current_user: User, db: AsyncSession) -> ApplicationResponse:
    if payload.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create application for another user")

    job = await db.scalar(select(Job).where(Job.id == payload.job_id))
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    existing = await db.scalar(
        select(Application).where(Application.job_id == payload.job_id, Application.user_id == payload.user_id)
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Application already exists for this job")

    if payload.resume_id:
        resume = await db.scalar(select(Resume).where(Resume.id == payload.resume_id, Resume.user_id == payload.user_id))
        if not resume:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resume_id for this user")

    if payload.cover_letter_id:
        cover_letter = await db.scalar(
            select(CoverLetter).where(CoverLetter.id == payload.cover_letter_id, CoverLetter.user_id == payload.user_id)
        )
        if not cover_letter:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cover_letter_id for this user")
        if payload.resume_id and cover_letter.resume_id != payload.resume_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cover_letter_id does not match resume_id",
            )

    app_entity = Application(
        job_id=payload.job_id,
        user_id=payload.user_id,
        resume_id=payload.resume_id,
        cover_letter_id=payload.cover_letter_id,
        status=payload.status.value,
    )
    db.add(app_entity)
    await db.flush()
    _enqueue_application_email(
        to_email=current_user.email,
        subject="Application submitted",
        body=f"Your application for job {payload.job_id} was created with status {payload.status.value}.",
    )
    applicant_user = current_user
    if payload.user_id != current_user.id:
        found_user = await db.scalar(select(User).where(User.id == payload.user_id))
        if found_user:
            applicant_user = found_user

    return ApplicationResponse(
        id=app_entity.id,
        job_id=app_entity.job_id,
        job_title=job.title,
        user_id=app_entity.user_id,
        applicant_name=applicant_user.name,
        applicant_username=applicant_user.username,
        resume_id=app_entity.resume_id,
        cover_letter_id=app_entity.cover_letter_id,
        status=ApplicationStatus(app_entity.status),
        created_at=app_entity.created_at,
        updated_at=app_entity.updated_at,
    )


async def update_application_status(
    application_id: str,
    status_value: ApplicationStatus,
    current_user: User,
    db: AsyncSession,
) -> ApplicationResponse:
    app_entity = await db.scalar(select(Application).where(Application.id == application_id))
    if not app_entity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role == "recruiter":
        owner_job = await db.scalar(
            select(Job.id).where(Job.id == app_entity.job_id, Job.recruiter_id == current_user.id)
        )
        if not owner_job:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this application")
    elif current_user.role != "admin" and app_entity.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this application")

    app_entity.status = status_value.value
    applicant = await db.scalar(select(User).where(User.id == app_entity.user_id))
    await db.flush()
    if applicant:
        _enqueue_application_email(
            to_email=applicant.email,
            subject="Application status updated",
            body=f"Your application {app_entity.id} status is now: {status_value.value}.",
        )
    job = await db.scalar(select(Job).where(Job.id == app_entity.job_id))
    return ApplicationResponse(
        id=app_entity.id,
        job_id=app_entity.job_id,
        job_title=job.title if job else None,
        user_id=app_entity.user_id,
        applicant_name=applicant.name if applicant else None,
        applicant_username=applicant.username if applicant else None,
        resume_id=app_entity.resume_id,
        cover_letter_id=app_entity.cover_letter_id,
        status=ApplicationStatus(app_entity.status),
        created_at=app_entity.created_at,
        updated_at=app_entity.updated_at,
    )


async def list_applications(
    current_user: User,
    db: AsyncSession,
    status_filter: ApplicationStatus | None = None,
    job_id: str | None = None,
    user_id: str | None = None,
) -> list[ApplicationResponse]:
    stmt = (
        select(Application, Job.title, User.name, User.username)
        .join(Job, Job.id == Application.job_id)
        .join(User, User.id == Application.user_id)
    )

    if current_user.role == "job_seeker":
        stmt = stmt.where(Application.user_id == current_user.id)
    elif current_user.role == "recruiter":
        stmt = stmt.where(Job.recruiter_id == current_user.id)
        if user_id:
            stmt = stmt.where(Application.user_id == user_id)
    else:
        if user_id:
            stmt = stmt.where(Application.user_id == user_id)

    if status_filter:
        stmt = stmt.where(Application.status == status_filter.value)
    if job_id:
        stmt = stmt.where(Application.job_id == job_id)

    rows = (await db.execute(stmt.order_by(Application.created_at.desc()))).all()
    return [
        ApplicationResponse(
            id=app_entity.id,
            job_id=app_entity.job_id,
            job_title=job_title,
            user_id=app_entity.user_id,
            applicant_name=applicant_name,
            applicant_username=applicant_username,
            resume_id=app_entity.resume_id,
            cover_letter_id=app_entity.cover_letter_id,
            status=ApplicationStatus(app_entity.status),
            created_at=app_entity.created_at,
            updated_at=app_entity.updated_at,
        )
        for app_entity, job_title, applicant_name, applicant_username in rows
    ]


def _enqueue_application_email(to_email: str, subject: str, body: str) -> None:
    enqueue_email_notification(to_email=to_email, subject=subject, body=body)
