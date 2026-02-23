from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.resume_feedback_schema import ResumeFeedbackRequest, ResumeFeedbackResponse, ResumeFeedbackTaskResponse
from app.schemas.resume_parse_schema import ResumeParseResultResponse
from app.schemas.resume_schema import ResumeUploadResponse
from app.services.resume_feedback_service import generate_resume_feedback
from app.services.resume_service import get_my_resume_parse_result, upload_resume
from app.tasks import enqueue_resume_feedback_generation


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


@router.post("/feedback", response_model=ResumeFeedbackResponse)
async def create_resume_feedback(
    payload: ResumeFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeFeedbackResponse:
    return await generate_resume_feedback(resume_id=payload.resume_id, current_user=current_user, db=db)


@router.post("/feedback/async", response_model=ResumeFeedbackTaskResponse)
async def create_resume_feedback_async(
    payload: ResumeFeedbackRequest,
    current_user: User = Depends(get_current_user),
) -> ResumeFeedbackTaskResponse:
    task_id = enqueue_resume_feedback_generation(resume_id=payload.resume_id, user_id=current_user.id)
    if not task_id:
        return ResumeFeedbackTaskResponse(task_id="unavailable", status="queue_unavailable")
    return ResumeFeedbackTaskResponse(task_id=task_id, status="queued")
