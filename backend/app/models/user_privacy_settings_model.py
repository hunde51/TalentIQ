from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserPrivacySettings(Base):
    __tablename__ = "user_privacy_settings"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    resume_visibility: Mapped[str] = mapped_column(String(20), nullable=False, default="recruiters_only", server_default="recruiters_only")
    allow_resume_download: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    default_resume_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    auto_embedding_refresh: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
