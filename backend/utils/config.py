import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ─── Server ──────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # ─── Mode ────────────────────────────────────────────────────────────────
    demo_mode: bool = True  # Set False for production with real AI models

    # ─── Security ────────────────────────────────────────────────────────────
    secret_key: str = "veridoc-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_hours: int = 8

    # ─── CORS ────────────────────────────────────────────────────────────────
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # ─── Database ────────────────────────────────────────────────────────────
    database_url: str = ""  # e.g. postgresql+asyncpg://user:pass@localhost/veridoc

    # ─── AI Service Keys (optional — demo works without these) ───────────────
    openai_api_key: str = ""          # For GPT-based OCR enhancement
    deepface_model: str = "VGG-Face"  # DeepFace model for face verification
    tesseract_path: str = ""          # Path to tesseract binary (if not in PATH)

    # ─── File Upload ─────────────────────────────────────────────────────────
    max_upload_mb: int = 10
    allowed_extensions: List[str] = [".jpg", ".jpeg", ".png", ".pdf", ".webp"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
