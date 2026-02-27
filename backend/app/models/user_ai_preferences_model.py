from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserAiPreferences(Base):
    __tablename__ = "user_ai_preferences"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    resume_tone: Mapped[str] = mapped_column(String(20), nullable=False, default="professional", server_default="professional")
    auto_cover_letter_generation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    ai_feedback_level: Mapped[str] = mapped_column(String(20), nullable=False, default="basic", server_default="basic")
    preferred_skill_emphasis: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
