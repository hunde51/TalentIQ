from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus
import os

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings:
    def __init__(self) -> None:
        self.database_host = os.getenv("DATABASE_HOST", "localhost")
        self.database_port = int(os.getenv("DATABASE_PORT", "5432"))
        self.database_user = os.getenv("DATABASE_USER", "postgres")
        self.database_password = os.getenv("DATABASE_PASSWORD", "")
        self.database_name = os.getenv("DATABASE_NAME", "talent_intelligence_db")

        provided_url = os.getenv("DATABASE_URL")
        if provided_url:
            self.database_url = provided_url
        else:
            encoded_password = quote_plus(self.database_password)
            self.database_url = (
                f"postgresql+asyncpg://{self.database_user}:{encoded_password}"
                f"@{self.database_host}:{self.database_port}/{self.database_name}"
            )

        if not self.database_url.startswith("postgresql+asyncpg://"):
            raise ValueError("DATABASE_URL must start with 'postgresql+asyncpg://'")

        self.jwt_secret_key = os.getenv("JWT_SECRET_KEY", "change_me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.admin_access_token_expire_minutes = int(os.getenv("ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES", "10"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        self.ai_api_key = os.getenv("AI_API_KEY", "")
        self.storage_backend = os.getenv("STORAGE_BACKEND", "local").lower()
        self.resume_upload_dir = os.getenv("RESUME_UPLOAD_DIR", str(BASE_DIR / "storage" / "resumes"))
        self.max_resume_file_size = int(os.getenv("MAX_RESUME_FILE_SIZE", str(5 * 1024 * 1024)))
        self.allowed_resume_content_types = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        self.s3_bucket_name = os.getenv("S3_BUCKET_NAME", "")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "")
        self.aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
        self.celery_broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
        self.celery_result_backend = os.getenv("CELERY_RESULT_BACKEND", self.celery_broker_url)
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        self.rate_limit_default = os.getenv("RATE_LIMIT_DEFAULT", "120/minute")
        raw_cors = os.getenv(
            "CORS_ALLOW_ORIGINS",
            "http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081,http://localhost:5173,http://127.0.0.1:5173",
        )
        self.cors_allow_origins = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

        if self.storage_backend not in {"local", "s3"}:
            raise ValueError("STORAGE_BACKEND must be either 'local' or 's3'")


@lru_cache
def get_settings() -> Settings:
    return Settings()
