from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, require_roles
from app.models.user_model import User
from app.schemas.auth_schema import MessageResponse, UserResponse


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.get("/recruiter-area", response_model=MessageResponse)
async def recruiter_area(
    _: User = Depends(require_roles("recruiter", "admin")),
) -> MessageResponse:
    return MessageResponse(message="Recruiter/Admin access granted")


@router.get("/admin-area", response_model=MessageResponse)
async def admin_3area(
    _: User = Depends(require_roles("admin")),
) -> MessageResponse:
    return MessageResponse(message="Admin access granted")
