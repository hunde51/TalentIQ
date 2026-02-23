from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter
from app.models.user_model import User
from app.schemas.settings_schema import (
    AccountSettingsPatch,
    AccountSettingsResponse,
    ActiveSessionsResponse,
    AiPreferencesPatch,
    AiPreferencesResponse,
    ChangePasswordRequest,
    MessageResponse,
    NotificationSettingsPatch,
    NotificationSettingsResponse,
    PrivacySettingsPatch,
    PrivacySettingsResponse,
    SecuritySettingsPatch,
    SecuritySettingsResponse,
)
from app.services.settings_service import (
    change_password,
    get_account_settings,
    get_ai_preferences,
    get_notification_settings,
    get_privacy_settings,
    get_security_settings,
    list_active_sessions,
    logout_all_sessions,
    patch_account_settings,
    patch_ai_preferences,
    patch_notification_settings,
    patch_privacy_settings,
    patch_security_settings,
    soft_delete_account,
)


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/account", response_model=AccountSettingsResponse)
async def get_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountSettingsResponse:
    return await get_account_settings(db, current_user)


@router.patch("/account", response_model=AccountSettingsResponse)
async def patch_account(
    payload: AccountSettingsPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountSettingsResponse:
    return await patch_account_settings(db, current_user, payload)


@router.delete("/account", response_model=MessageResponse)
@limiter.limit("3/hour")
async def delete_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await soft_delete_account(db, current_user)
    return MessageResponse(message="Account deactivated. Contact admin to reactivate.")


@router.get("/security", response_model=SecuritySettingsResponse)
async def get_security(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SecuritySettingsResponse:
    return await get_security_settings(db, current_user)


@router.patch("/security", response_model=SecuritySettingsResponse)
async def patch_security(
    payload: SecuritySettingsPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SecuritySettingsResponse:
    return await patch_security_settings(db, current_user, payload)


@router.patch("/security/change-password", response_model=MessageResponse)
@limiter.limit("5/hour")
async def patch_change_password(
    request: Request,
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await change_password(db, current_user, payload.current_password, payload.new_password)
    return MessageResponse(message="Password changed successfully")


@router.get("/security/sessions", response_model=ActiveSessionsResponse)
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_refresh_token: str | None = Header(default=None, alias="X-Refresh-Token"),
) -> ActiveSessionsResponse:
    items = await list_active_sessions(db, current_user, current_refresh_token=x_refresh_token)
    return ActiveSessionsResponse(items=items)


@router.post("/security/logout-all", response_model=MessageResponse)
@limiter.limit("10/hour")
async def post_logout_all(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await logout_all_sessions(db, current_user)
    return MessageResponse(message="Logged out from all devices")


@router.get("/ai-preferences", response_model=AiPreferencesResponse)
async def get_ai_prefs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AiPreferencesResponse:
    return await get_ai_preferences(db, current_user)


@router.patch("/ai-preferences", response_model=AiPreferencesResponse)
async def patch_ai_prefs(
    payload: AiPreferencesPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AiPreferencesResponse:
    return await patch_ai_preferences(db, current_user, payload)


@router.get("/notifications", response_model=NotificationSettingsResponse)
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationSettingsResponse:
    return await get_notification_settings(db, current_user)


@router.patch("/notifications", response_model=NotificationSettingsResponse)
async def patch_notifications(
    payload: NotificationSettingsPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationSettingsResponse:
    return await patch_notification_settings(db, current_user, payload)


@router.get("/privacy", response_model=PrivacySettingsResponse)
async def get_privacy(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrivacySettingsResponse:
    return await get_privacy_settings(db, current_user)


@router.patch("/privacy", response_model=PrivacySettingsResponse)
async def patch_privacy(
    payload: PrivacySettingsPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PrivacySettingsResponse:
    return await patch_privacy_settings(db, current_user, payload)
