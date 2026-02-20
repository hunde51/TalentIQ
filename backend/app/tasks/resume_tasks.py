from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.resume_tasks.process_resume")
def process_resume(resume_id: str) -> dict[str, str]:
    # Placeholder for Part 5 parsing pipeline.
    return {"resume_id": resume_id, "status": "queued"}
