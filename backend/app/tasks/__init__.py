def enqueue_resume_processing(resume_id: str) -> str | None:
    try:
        from app.tasks.resume_tasks import process_resume

        task = process_resume.delay(resume_id)
        return task.id
    except Exception:
        return None


def enqueue_resume_feedback_generation(resume_id: str, user_id: str) -> str | None:
    try:
        from app.tasks.feedback_tasks import generate_resume_feedback_task

        task = generate_resume_feedback_task.delay(resume_id, user_id)
        return task.id
    except Exception:
        return None


def enqueue_email_notification(to_email: str, subject: str, body: str) -> str | None:
    try:
        from app.tasks.email_tasks import send_email_task

        task = send_email_task.delay(to_email, subject, body)
        return task.id
    except Exception:
        return None


def get_task_status(task_id: str) -> dict:
    from app.tasks.celery_app import celery_app

    result = celery_app.AsyncResult(task_id)
    payload = {
        "task_id": task_id,
        "status": result.status,
        "successful": result.successful() if result.ready() else False,
    }
    if result.ready():
        payload["result"] = result.result if not isinstance(result.result, Exception) else str(result.result)
    return payload
