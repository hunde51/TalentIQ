from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth_schema import UserRole


class UserAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    name: str
    sex: str
    age: int
    email: str
    role: UserRole
    is_active: bool
    is_verified: bool


class UserListResponse(BaseModel):
    page: int
    size: int
    total: int
    items: list[UserAdminResponse]


class UserUpdateRequest(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class UserUpdateResponse(BaseModel):
    user: UserAdminResponse
    message: str = Field(default="User updated")
