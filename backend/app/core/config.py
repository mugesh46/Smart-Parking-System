from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Smart Parking API"
    environment: str = "development"
    secret_key: str = Field(default="change-this-secret", min_length=16)
    access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./smartparking.db"
    redis_url: str = "redis://localhost:6379/0"
    yolo_model_path: str = "../ai/models/yolo-parking.pt"
    detection_confidence: float = 0.45
    cors_origins: str = "http://localhost:5173"
    google_maps_api_key: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
