from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserNotificationSettings(Base):
    __tablename__ = "user_notification_settings"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    email_job_matches: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    application_status_updates: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    recruiter_messages: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    weekly_job_digest: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    marketing_emails: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
