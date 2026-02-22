from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ResumeParseResult(Base):
    __tablename__ = "resume_parse_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    resume_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    skills: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    experience: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    education: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    entities: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    parser_source: Mapped[str] = mapped_column(String(60), nullable=False, default="heuristic", server_default="heuristic")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
