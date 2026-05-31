from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from the .env file.

    Attributes:
        OLLAMA_BASE_URL: Base URL of the running Ollama server.
        OLLAMA_MODEL: Chat model to use for all LLM agent calls.
        OLLAMA_EMBEDDING_MODEL: Model to use for ChromaDB embeddings.
        GITHUB_TOKEN: Optional GitHub PAT for higher API rate limits.
        CHROMA_PERSIST_DIR: Directory where ChromaDB persists its data.
        MAX_CODE_CHARS: Maximum allowed code size (characters).
        CORS_ORIGINS: Allowed CORS origins for the FastAPI app.
    """

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    GITHUB_TOKEN: str | None = None
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    MAX_CODE_CHARS: int = 20000
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


import asyncio

settings = Settings()
ollama_lock = asyncio.Lock()
