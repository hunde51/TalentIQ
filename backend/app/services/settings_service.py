from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_refresh_token, decode_token, hash_password, verify_password
from app.models.resume_model import Resume
from app.models.user_ai_preferences_model import UserAiPreferences
from app.models.user_model import User
from app.models.user_notification_settings_model import UserNotificationSettings
from app.models.user_privacy_settings_model import UserPrivacySettings
from app.models.user_profile_model import UserProfile
from app.models.user_security_settings_model import UserSecuritySettings
from app.models.user_session_model import UserSession
from app.schemas.settings_schema import (
    AccountSettingsPatch,
    AccountSettingsResponse,
    AiPreferencesPatch,
    AiPreferencesResponse,
    NotificationSettingsPatch,
    NotificationSettingsResponse,
    PrivacySettingsPatch,
    PrivacySettingsResponse,
    SecuritySettingsPatch,
    SecuritySettingsResponse,
    SessionItem,
)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def create_user_session(
    db: AsyncSession,
    user: User,
    refresh_token: str,
    user_agent: str | None,
    ip_address: str | None,
) -> None:
    claims = decode_token(refresh_token)
    exp_ts = claims.get("exp")
    if not exp_ts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid refresh token")
    expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc).replace(tzinfo=None)

    db.add(
        UserSession(
            user_id=user.id,
            refresh_token_hash=_hash_token(refresh_token),
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
        )
    )


async def rotate_user_session(
    db: AsyncSession,
    user: User,
    old_refresh_token: str,
    user_agent: str | None,
    ip_address: str | None,
) -> str:
    old_hash = _hash_token(old_refresh_token)
    old_session = await db.scalar(
        select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.refresh_token_hash == old_hash,
            UserSession.revoked_at.is_(None),
        )
    )
    if not old_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session invalid")

    old_session.revoked_at = datetime.utcnow()
    new_refresh_token = create_refresh_token(user.id, extra={"token_version": user.token_version})
    await create_user_session(db, user, new_refresh_token, user_agent=user_agent, ip_address=ip_address)
    return new_refresh_token


async def get_account_settings(db: AsyncSession, user: User) -> AccountSettingsResponse:
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if not profile:
        profile = UserProfile(user_id=user.id, full_name=user.name)
        db.add(profile)
        await db.flush()

    return AccountSettingsResponse(
        full_name=profile.full_name,
        phone_number=profile.phone_number,
        location=profile.location,
        profile_picture_url=profile.profile_picture_url,
        professional_title=profile.professional_title,
        years_of_experience=profile.years_of_experience,
        preferred_job_type=profile.preferred_job_type,
        expected_salary_min=float(profile.expected_salary_min) if profile.expected_salary_min is not None else None,
        expected_salary_max=float(profile.expected_salary_max) if profile.expected_salary_max is not None else None,
    )


async def patch_account_settings(db: AsyncSession, user: User, payload: AccountSettingsPatch) -> AccountSettingsResponse:
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if not profile:
        profile = UserProfile(user_id=user.id, full_name=user.name)
        db.add(profile)

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(profile, key, value)

    if payload.full_name is not None:
        user.name = payload.full_name

    await db.flush()
    return await get_account_settings(db, user)


async def get_security_settings(db: AsyncSession, user: User) -> SecuritySettingsResponse:
    sec = await db.scalar(select(UserSecuritySettings).where(UserSecuritySettings.user_id == user.id))
    if not sec:
        sec = UserSecuritySettings(user_id=user.id)
        db.add(sec)
        await db.flush()

    active_sessions = int(
        (await db.scalar(
            select(func.count()).select_from(UserSession).where(
                UserSession.user_id == user.id,
                UserSession.revoked_at.is_(None),
            )
        )) or 0
    )

    return SecuritySettingsResponse(
        two_factor_enabled=sec.two_factor_enabled,
        active_sessions=active_sessions,
        password_changed_at=sec.password_changed_at,
    )


async def patch_security_settings(db: AsyncSession, user: User, payload: SecuritySettingsPatch) -> SecuritySettingsResponse:
    sec = await db.scalar(select(UserSecuritySettings).where(UserSecuritySettings.user_id == user.id))
    if not sec:
        sec = UserSecuritySettings(user_id=user.id)
        db.add(sec)

    sec.two_factor_enabled = payload.two_factor_enabled
    await db.flush()
    return await get_security_settings(db, user)


async def change_password(db: AsyncSession, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.hashed_password = hash_password(new_password)
    sec = await db.scalar(select(UserSecuritySettings).where(UserSecuritySettings.user_id == user.id))
    if not sec:
        sec = UserSecuritySettings(user_id=user.id)
        db.add(sec)
    sec.password_changed_at = datetime.utcnow()
    user.token_version += 1

    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
        .values(revoked_at=datetime.utcnow())
    )
    await db.flush()


async def list_active_sessions(db: AsyncSession, user: User, current_refresh_token: str | None = None) -> list[SessionItem]:
    current_hash = _hash_token(current_refresh_token) if current_refresh_token else None
    rows = (
        await db.scalars(
            select(UserSession)
            .where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
            .order_by(UserSession.issued_at.desc())
        )
    ).all()
    return [
        SessionItem(
            id=item.id,
            issued_at=item.issued_at,
            expires_at=item.expires_at,
            user_agent=item.user_agent,
            ip_address=item.ip_address,
            is_current=(item.refresh_token_hash == current_hash) if current_hash else False,
        )
        for item in rows
    ]


async def logout_all_sessions(db: AsyncSession, user: User) -> None:
    user.token_version += 1
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
        .values(revoked_at=datetime.utcnow())
    )
    await db.flush()


async def get_ai_preferences(db: AsyncSession, user: User) -> AiPreferencesResponse:
    prefs = await db.scalar(select(UserAiPreferences).where(UserAiPreferences.user_id == user.id))
    if not prefs:
        prefs = UserAiPreferences(user_id=user.id)
        db.add(prefs)
        await db.flush()
    return AiPreferencesResponse(
        resume_tone=prefs.resume_tone,
        auto_cover_letter_generation=prefs.auto_cover_letter_generation,
        ai_feedback_level=prefs.ai_feedback_level,
        preferred_skill_emphasis=prefs.preferred_skill_emphasis or [],
    )


async def patch_ai_preferences(db: AsyncSession, user: User, payload: AiPreferencesPatch) -> AiPreferencesResponse:
    prefs = await db.scalar(select(UserAiPreferences).where(UserAiPreferences.user_id == user.id))
    if not prefs:
        prefs = UserAiPreferences(user_id=user.id)
        db.add(prefs)

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, key, value)
    await db.flush()
    return await get_ai_preferences(db, user)


async def get_notification_settings(db: AsyncSession, user: User) -> NotificationSettingsResponse:
    settings = await db.scalar(select(UserNotificationSettings).where(UserNotificationSettings.user_id == user.id))
    if not settings:
        settings = UserNotificationSettings(user_id=user.id)
        db.add(settings)
        await db.flush()

    return NotificationSettingsResponse(
        email_job_matches=settings.email_job_matches,
        application_status_updates=settings.application_status_updates,
        recruiter_messages=settings.recruiter_messages,
        weekly_job_digest=settings.weekly_job_digest,
        marketing_emails=settings.marketing_emails,
    )


async def patch_notification_settings(
    db: AsyncSession, user: User, payload: NotificationSettingsPatch
) -> NotificationSettingsResponse:
    settings = await db.scalar(select(UserNotificationSettings).where(UserNotificationSettings.user_id == user.id))
    if not settings:
        settings = UserNotificationSettings(user_id=user.id)
        db.add(settings)

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    await db.flush()
    return await get_notification_settings(db, user)


async def get_privacy_settings(db: AsyncSession, user: User) -> PrivacySettingsResponse:
    settings = await db.scalar(select(UserPrivacySettings).where(UserPrivacySettings.user_id == user.id))
    if not settings:
        settings = UserPrivacySettings(user_id=user.id)
        db.add(settings)
        await db.flush()

    return PrivacySettingsResponse(
        resume_visibility=settings.resume_visibility,
        allow_resume_download=settings.allow_resume_download,
        default_resume_id=settings.default_resume_id,
        auto_embedding_refresh=settings.auto_embedding_refresh,
    )


async def patch_privacy_settings(db: AsyncSession, user: User, payload: PrivacySettingsPatch) -> PrivacySettingsResponse:
    settings = await db.scalar(select(UserPrivacySettings).where(UserPrivacySettings.user_id == user.id))
    if not settings:
        settings = UserPrivacySettings(user_id=user.id)
        db.add(settings)

    updates = payload.model_dump(exclude_unset=True)
    if "default_resume_id" in updates and updates["default_resume_id"]:
        resume = await db.scalar(select(Resume).where(Resume.id == updates["default_resume_id"], Resume.user_id == user.id))
        if not resume:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid default_resume_id")

    for key, value in updates.items():
        setattr(settings, key, value)
    await db.flush()
    return await get_privacy_settings(db, user)


async def soft_delete_account(db: AsyncSession, user: User) -> None:
    user.is_active = False
    user.token_version += 1
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
        .values(revoked_at=datetime.utcnow())
    )
    await db.flush()
