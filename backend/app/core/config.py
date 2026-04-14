from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

# Root of the repo (VitalAI/), regardless of where uvicorn is invoked from
_ROOT_ENV = Path(__file__).resolve().parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    # Database — local PostgreSQL for dev, Supabase for prod
    DATABASE_URL: str = "postgresql+asyncpg://postgres:changeme@localhost:5432/trialflow"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # JWT
    JWT_SECRET: str = "dev-secret-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 480

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

    model_config = {"env_file": str(_ROOT_ENV), "case_sensitive": True, "extra": "ignore"}


settings = Settings()
