from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.cover_letter_schema import CoverLetterGenerateRequest, CoverLetterResponse
from app.services.cover_letter_service import generate_cover_letter, get_cover_letter, upload_cover_letter


router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])


@router.post("/generate", response_model=CoverLetterResponse)
async def generate(
    payload: CoverLetterGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoverLetterResponse:
    return await generate_cover_letter(payload=payload, current_user=current_user, db=db)


@router.post("/upload", response_model=CoverLetterResponse)
async def upload(
    resume_id: str = Form(...),
    job_description: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoverLetterResponse:
    return await upload_cover_letter(
        resume_id=resume_id,
        job_description=job_description,
        file=file,
        current_user=current_user,
        db=db,
    )


@router.get("/{cover_letter_id}", response_model=CoverLetterResponse)
async def get_by_id(
    cover_letter_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoverLetterResponse:
    return await get_cover_letter(cover_letter_id=cover_letter_id, current_user=current_user, db=db)
