from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine
from app.routes.auth_routes import router as auth_router
from app.routes.resume_routes import router as resume_router
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

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(resume_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
