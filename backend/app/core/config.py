from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HireMind AI"
    environment: Literal["local", "development", "staging", "production"] = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = Field(
        default="postgresql+psycopg2://hiremind:hiremind@db:5432/hiremind",
        description="SQLAlchemy database URL.",
    )
    create_tables_on_startup: bool = True

    jwt_secret_key: str = Field(
        default="change-me-in-production",
        min_length=16,
        description="Secret key used to sign JWT access tokens.",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    password_bcrypt_rounds: int = 12
    seed_demo_user: bool = True
    demo_user_email: str = "demo@hiremind.ai"
    demo_user_password: str = "DemoPass123!"

    backend_cors_origins: list[AnyHttpUrl | str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        case_sensitive=False,
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | list[str]) -> list[str] | str:
        if isinstance(value, str) and value:
            return [origin.strip() for origin in value.split(",")]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
