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
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        self.ai_api_key = os.getenv("AI_API_KEY", "")


@lru_cache
def get_settings() -> Settings:
    return Settings()
