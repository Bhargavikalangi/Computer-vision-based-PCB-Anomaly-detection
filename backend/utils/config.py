from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://pcb_user:pcb_secure_pass@localhost:5432/pcb_detection"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    MODEL_PATH: str = "./models/pcb_detector.pt"
    UPLOAD_DIR: str = "./uploads"
    RESULTS_DIR: str = "./results"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list = ["jpg", "jpeg", "png", "bmp", "tiff", "tif"]

    DEFAULT_CONFIDENCE: float = 0.5
    DEFAULT_IOU: float = 0.45
    MAX_DETECTIONS: int = 100
    GROQ_API_KEY: str = ""  # ADD THIS LINE


    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
