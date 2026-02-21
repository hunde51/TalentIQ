from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(str, Enum):
    job_seeker = "job_seeker"
    recruiter = "recruiter"
    admin = "admin"


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


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
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
