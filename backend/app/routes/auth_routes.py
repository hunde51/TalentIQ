from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth_schema import (
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.services.user_service import login_user, refresh_access_token, signup_user, verify_email


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest, request: Request, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await signup_user(
        payload,
        db,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await login_user(
        payload,
        db,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await refresh_access_token(
        payload,
        db,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify(payload: VerifyEmailRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    message = await verify_email(payload, db)
    return MessageResponse(message=message)
