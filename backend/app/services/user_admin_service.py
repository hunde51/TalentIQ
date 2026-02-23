from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user_model import User
from app.schemas.user_admin_schema import UserListResponse, UserUpdateRequest, UserUpdateResponse


async def list_users(
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
    role: str | None = None,
    is_active: bool | None = None,
    q: str | None = None,
) -> UserListResponse:
    filters = []
    if role:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)
    if q:
        pattern = f"%{q.strip()}%"
        filters.append(or_(User.email.ilike(pattern), User.id.ilike(pattern)))

    total_stmt = select(func.count()).select_from(User)
    if filters:
        total_stmt = total_stmt.where(*filters)
    total = (await db.execute(total_stmt)).scalar_one()

    stmt = select(User)
    if filters:
        stmt = stmt.where(*filters)
    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size)

    users = (await db.scalars(stmt)).all()
    return UserListResponse(page=page, size=size, total=total, items=users)


async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    current_admin_id: str,
    db: AsyncSession,
) -> UserUpdateResponse:
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.role is None and payload.is_active is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update fields provided")

    if payload.role is not None:
        user.role = payload.role.value

    if payload.is_active is not None:
        if user.id == current_admin_id and payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin cannot deactivate own account",
            )
        user.is_active = payload.is_active

    await db.commit()
    await db.refresh(user)
    return UserUpdateResponse(user=user)
