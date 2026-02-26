from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User
from app.schemas.analytics_schema import AnalyticsResponse
from app.services.analytics_service import get_analytics


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsResponse)
async def analytics(
    top_skills: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(require_roles("recruiter", "admin")),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsResponse:
    return await get_analytics(db=db, current_user=current_user, top_skills=top_skills)
