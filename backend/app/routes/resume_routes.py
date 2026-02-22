from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.resume_parse_schema import ResumeParseResultResponse
from app.schemas.resume_schema import ResumeUploadResponse
from app.services.resume_service import get_my_resume_parse_result, upload_resume


router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeUploadResponse:
    return await upload_resume(file=file, current_user=current_user, db=db)


@router.get("/{resume_id}/parsed", response_model=ResumeParseResultResponse)
async def get_parsed_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeParseResultResponse:
    return await get_my_resume_parse_result(resume_id=resume_id, current_user=current_user, db=db)
