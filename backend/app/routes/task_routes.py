from fastapi import APIRouter

from app.tasks import get_task_status


router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/{task_id}/status")
def task_status(task_id: str) -> dict:
    return get_task_status(task_id)
