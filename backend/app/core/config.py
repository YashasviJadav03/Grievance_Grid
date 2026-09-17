from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Grievance Grid"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./grievance_grid.db"
    SECRET_KEY: str = "grievance_grid_super_secret_dev_key"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
