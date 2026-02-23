from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.cover_letter_schema import CoverLetterGenerateRequest, CoverLetterResponse
from app.services.cover_letter_service import generate_cover_letter


router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])


@router.post("/generate", response_model=CoverLetterResponse)
async def generate(
    payload: CoverLetterGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoverLetterResponse:
    return await generate_cover_letter(payload=payload, current_user=current_user, db=db)
