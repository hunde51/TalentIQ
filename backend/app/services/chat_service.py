from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application_model import Application
from app.models.chat_message_model import ChatMessage
from app.models.job_model import Job
from app.models.user_model import User
from app.schemas.chat_schema import ChatRoomItem


def _is_admin(user: User) -> bool:
    return user.role == "admin"


async def ensure_chat_access(
    db: AsyncSession,
    current_user: User,
    application_id: str,
) -> tuple[Application, Job]:
    application = await db.scalar(select(Application).where(Application.id == application_id))
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    job = await db.scalar(select(Job).where(Job.id == application.job_id))
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    is_participant = current_user.id in {application.user_id, job.recruiter_id}
    if not is_participant and not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this chat")

    return application, job


async def list_chat_rooms(db: AsyncSession, current_user: User) -> list[ChatRoomItem]:
    applicant = User.__table__.alias("applicant")
    recruiter = User.__table__.alias("recruiter")

    if _is_admin(current_user):
        stmt = (
            select(
                Application.id,
                Application.job_id,
                Application.user_id,
                Job.recruiter_id,
                Job.title,
                applicant.c.name.label("applicant_name"),
                applicant.c.username.label("applicant_username"),
                recruiter.c.name.label("recruiter_name"),
                recruiter.c.username.label("recruiter_username"),
            )
            .join(Job, Job.id == Application.job_id)
            .join(applicant, applicant.c.id == Application.user_id)
            .join(recruiter, recruiter.c.id == Job.recruiter_id)
            .order_by(Application.created_at.desc())
        )
    else:
        stmt = (
            select(
                Application.id,
                Application.job_id,
                Application.user_id,
                Job.recruiter_id,
                Job.title,
                applicant.c.name.label("applicant_name"),
                applicant.c.username.label("applicant_username"),
                recruiter.c.name.label("recruiter_name"),
                recruiter.c.username.label("recruiter_username"),
            )
            .join(Job, Job.id == Application.job_id)
            .join(applicant, applicant.c.id == Application.user_id)
            .join(recruiter, recruiter.c.id == Job.recruiter_id)
            .where(or_(Application.user_id == current_user.id, Job.recruiter_id == current_user.id))
            .order_by(Application.created_at.desc())
        )

    rows = (await db.execute(stmt)).all()
    return [
        ChatRoomItem(
            application_id=row.id,
            job_id=row.job_id,
            job_title=row.title,
            applicant_id=row.user_id,
            applicant_name=row.applicant_name,
            applicant_username=row.applicant_username,
            recruiter_id=row.recruiter_id,
            recruiter_name=row.recruiter_name,
            recruiter_username=row.recruiter_username,
        )
        for row in rows
    ]


async def list_messages(db: AsyncSession, application_id: str, limit: int = 200) -> list[ChatMessage]:
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.application_id == application_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    return (await db.scalars(stmt)).all()


async def create_message(db: AsyncSession, application_id: str, sender_id: str, content: str) -> ChatMessage:
    message = ChatMessage(application_id=application_id, sender_id=sender_id, content=content.strip())
    db.add(message)
    await db.flush()
    return message
