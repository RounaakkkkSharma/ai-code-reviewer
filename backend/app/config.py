from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    GITHUB_TOKEN: str | None = None
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    MAX_CODE_CHARS: int = 20000
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
