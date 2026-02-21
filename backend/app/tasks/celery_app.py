from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "talent_intelligence",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

# Fail fast when broker is unavailable (common in local dev without Redis)
celery_app.conf.update(
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=0,
    task_ignore_result=True,
)
