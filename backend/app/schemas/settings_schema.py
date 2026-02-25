from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, HttpUrl, model_validator


class PreferredJobType(str, Enum):
    remote = "remote"
    hybrid = "hybrid"
    onsite = "onsite"


class ResumeTone(str, Enum):
    professional = "professional"
    creative = "creative"
    technical = "technical"


class AiFeedbackLevel(str, Enum):
    basic = "basic"
    detailed = "detailed"
    advanced = "advanced"


class ResumeVisibility(str, Enum):
    private = "private"
    recruiters_only = "recruiters_only"
    public = "public"


class AccountSettingsResponse(BaseModel):
    full_name: str
    phone_number: str | None = None
    location: str | None = None
    profile_picture_url: HttpUrl | None = None
    professional_title: str | None = None
    years_of_experience: int | None = None
    preferred_job_type: PreferredJobType | None = None
    expected_salary_min: float | None = None
    expected_salary_max: float | None = None


class AccountSettingsPatch(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone_number: str | None = Field(default=None, min_length=7, max_length=30)
    location: str | None = Field(default=None, max_length=120)
    profile_picture_url: HttpUrl | None = None
    professional_title: str | None = Field(default=None, max_length=120)
    years_of_experience: int | None = Field(default=None, ge=0, le=80)
    preferred_job_type: PreferredJobType | None = None
    expected_salary_min: float | None = Field(default=None, ge=0)
    expected_salary_max: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_salary(self) -> "AccountSettingsPatch":
        if self.expected_salary_min is not None and self.expected_salary_max is not None:
            if self.expected_salary_max < self.expected_salary_min:
                raise ValueError("expected_salary_max must be greater than or equal to expected_salary_min")
        return self


class SecuritySettingsResponse(BaseModel):
    two_factor_enabled: bool
    active_sessions: int
    password_changed_at: datetime | None = None


class SecuritySettingsPatch(BaseModel):
    two_factor_enabled: bool


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class SessionItem(BaseModel):
    id: str
    issued_at: datetime
    expires_at: datetime
    user_agent: str | None = None
    ip_address: str | None = None
    is_current: bool


class ActiveSessionsResponse(BaseModel):
    items: list[SessionItem]


class AiPreferencesResponse(BaseModel):
    resume_tone: ResumeTone
    auto_cover_letter_generation: bool
    ai_feedback_level: AiFeedbackLevel
    preferred_skill_emphasis: list[str]


class AiPreferencesPatch(BaseModel):
    resume_tone: ResumeTone | None = None
    auto_cover_letter_generation: bool | None = None
    ai_feedback_level: AiFeedbackLevel | None = None
    preferred_skill_emphasis: list[str] | None = None


class NotificationSettingsResponse(BaseModel):
    email_job_matches: bool
    application_status_updates: bool
    recruiter_messages: bool
    weekly_job_digest: bool
    marketing_emails: bool


class NotificationSettingsPatch(BaseModel):
    email_job_matches: bool | None = None
    application_status_updates: bool | None = None
    recruiter_messages: bool | None = None
    weekly_job_digest: bool | None = None
    marketing_emails: bool | None = None


class PrivacySettingsResponse(BaseModel):
    resume_visibility: ResumeVisibility
    allow_resume_download: bool
    default_resume_id: str | None = None
    auto_embedding_refresh: bool


class PrivacySettingsPatch(BaseModel):
    resume_visibility: ResumeVisibility | None = None
    allow_resume_download: bool | None = None
    default_resume_id: str | None = None
    auto_embedding_refresh: bool | None = None


class MessageResponse(BaseModel):
    message: str
