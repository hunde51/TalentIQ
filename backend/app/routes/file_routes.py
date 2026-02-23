from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user_model import User
from app.services.file_service import download_cover_letter_file, download_resume_file


router = APIRouter(prefix="/file", tags=["file"])


@router.get("/resume/{resume_id}/download", response_class=FileResponse)
async def download_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    return await download_resume_file(resume_id=resume_id, current_user=current_user, db=db)


@router.get("/cover-letter/{cover_letter_id}/download", response_class=FileResponse)
async def download_cover_letter(
    cover_letter_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    return await download_cover_letter_file(cover_letter_id=cover_letter_id, current_user=current_user, db=db)
