from app.routes.admin_routes import router as admin_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.application_routes import router as application_router
from app.routes.auth_routes import router as auth_router
from app.routes.cover_letter_routes import router as cover_letter_router
from app.routes.chat_routes import router as chat_router
from app.routes.file_routes import router as file_router
from app.routes.job_routes import router as job_router
from app.routes.resume_routes import router as resume_router
from app.routes.search_routes import router as search_router
from app.routes.settings_routes import router as settings_router
from app.routes.task_routes import router as task_router
from app.routes.user_routes import router as user_router

__all__ = [
    "auth_router",
    "user_router",
    "resume_router",
    "job_router",
    "cover_letter_router",
    "chat_router",
    "application_router",
    "task_router",
    "admin_router",
    "analytics_router",
    "search_router",
    "settings_router",
    "file_router",
]
