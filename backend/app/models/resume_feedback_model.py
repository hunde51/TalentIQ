from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ResumeFeedback(Base):
    __tablename__ = "resume_feedbacks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    resume_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    skills_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    phrasing_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    formatting_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    overall_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    generator_source: Mapped[str] = mapped_column(String(60), nullable=False, default="heuristic", server_default="heuristic")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
