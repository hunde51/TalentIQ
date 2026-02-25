import secrets

import jwt
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.config import get_settings
from app.models.user_model import User
from app.schemas.auth_schema import LoginRequest, RefreshRequest, SignupRequest, TokenResponse, VerifyEmailRequest
from app.services.settings_service import create_user_session, rotate_user_session

settings = get_settings()


def _access_ttl_for_role(role: str) -> int:
    return settings.admin_access_token_expire_minutes if role == "admin" else settings.access_token_expire_minutes


async def _issue_tokens(
    user: User,
    db: AsyncSession,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> TokenResponse:
    refresh_token = create_refresh_token(user.id, extra={"token_version": user.token_version})
    await create_user_session(db, user, refresh_token, user_agent=user_agent, ip_address=ip_address)
    return TokenResponse(
        access_token=create_access_token(
            user.id,
            extra={"role": user.role, "token_version": user.token_version},
            expires_minutes=_access_ttl_for_role(user.role),
        ),
        refresh_token=refresh_token,
    )


async def signup_user(
    payload: SignupRequest,
    db: AsyncSession,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> TokenResponse:
    normalized_username = payload.username.strip().lower()
    normalized_name = payload.name.strip()
    normalized_sex = payload.sex.value

    existing_username = await db.scalar(select(User).where(func.lower(User.username) == normalized_username))
    if existing_username:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")

    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if payload.role == "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin signup is not allowed")

    user = User(
        username=normalized_username,
        name=normalized_name,
        sex=normalized_sex,
        age=payload.age,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=payload.role.value if hasattr(payload.role, "value") else str(payload.role),
        is_active=payload.role != "recruiter",
        verification_token=secrets.token_urlsafe(32),
    )
    db.add(user)
    await db.flush()

    return await _issue_tokens(user, db, user_agent=user_agent, ip_address=ip_address)


async def login_user(
    payload: LoginRequest,
    db: AsyncSession,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> TokenResponse:
    stmt = select(User)
    if payload.username:
        stmt = stmt.where(func.lower(User.username) == payload.username.strip().lower())
    elif payload.email:
        stmt = stmt.where(User.email == payload.email.lower())
    user = await db.scalar(stmt)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account inactive. Waiting for admin approval.")

    return await _issue_tokens(user, db, user_agent=user_agent, ip_address=ip_address)


async def refresh_access_token(
    payload: RefreshRequest,
    db: AsyncSession,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> TokenResponse:
    try:
        claims = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if claims.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    token_version = claims.get("token_version")
    if token_version is not None and int(token_version) != int(user.token_version):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    refresh_token = await rotate_user_session(
        db=db,
        user=user,
        old_refresh_token=payload.refresh_token,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    return TokenResponse(
        access_token=create_access_token(
            user.id,
            extra={"role": user.role, "token_version": user.token_version},
            expires_minutes=_access_ttl_for_role(user.role),
        ),
        refresh_token=refresh_token,
    )


async def verify_email(payload: VerifyEmailRequest, db: AsyncSession) -> str:
    user = await db.scalar(select(User).where(User.verification_token == payload.token))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid verification token")

    user.is_verified = True
    user.verification_token = None
    await db.flush()
    return "Email verified successfully"
