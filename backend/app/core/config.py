from typing import List
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/family_tasks"

    # Security (legacy local JWT; will be unused after Supabase Auth migration)
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Supabase
    supabase_project_ref: str = os.getenv("SUPABASE_PROJECT_REF", "kevbwlrkjcbxrflmmybm")
    supabase_audience: str = os.getenv("SUPABASE_AUDIENCE", "authenticated")
    admin_emails: str = os.getenv("ADMIN_EMAILS", "")  # comma-separated list

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    # App
    debug: bool = True

    class Config:
        env_file = ".env"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def supabase_jwks_url(self) -> str:
        return f"https://{self.supabase_project_ref}.supabase.co/auth/v1/keys"


settings = Settings()
