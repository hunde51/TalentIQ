def enqueue_resume_processing(resume_id: str) -> str | None:
    try:
        from app.tasks.resume_tasks import process_resume

        task = process_resume.delay(resume_id)
        return task.id
    except Exception:
        return None
