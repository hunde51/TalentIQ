from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class UserRole(str, Enum):
    job_seeker = "job_seeker"
    recruiter = "recruiter"
    admin = "admin"


class SexType(str, Enum):
    male = "male"
    female = "female"


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    name: str = Field(min_length=2, max_length=120)
    sex: SexType
    age: int = Field(ge=13, le=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.job_seeker


class LoginRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_identifier(self) -> "LoginRequest":
        if not self.username and not self.email:
            raise ValueError("Either username or email is required")
        return self


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    name: str
    sex: str
    age: int
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
