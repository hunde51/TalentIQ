from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    professional_title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    years_of_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preferred_job_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    expected_salary_min: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    expected_salary_max: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
