from app.services.email_service import send_email_smtp
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.email_tasks.send_email_task")
def send_email_task(to_email: str, subject: str, body: str) -> dict[str, str]:
    try:
        send_email_smtp(to_email=to_email, subject=subject, body=body)
        return {"status": "sent", "to": to_email}
    except Exception as exc:
        return {"status": "failed", "error": str(exc), "to": to_email}
