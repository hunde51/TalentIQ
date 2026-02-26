from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text

from app.core.audit_middleware import AuditLogMiddleware
from app.core.config import get_settings
from app.core.database import engine
from app.core.rate_limit import limiter
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


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Validate DB connectivity on startup and close engine on shutdown.
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))
    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(
    title="Talent Intelligence API",
    version="1.0.0",
    lifespan=lifespan,
)
settings = get_settings()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(AuditLogMiddleware)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(resume_router)
app.include_router(job_router)
app.include_router(cover_letter_router)
app.include_router(chat_router)
app.include_router(application_router)
app.include_router(task_router)
app.include_router(analytics_router)
app.include_router(search_router)
app.include_router(settings_router)
app.include_router(file_router)
app.include_router(admin_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
