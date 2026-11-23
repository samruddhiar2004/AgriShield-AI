import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agrishield-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Default to PostgreSQL with PostGIS, fallback to local SQLite for portable dev
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/agrishield_db"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./agrishield_local.db"
    
    # Redis & Background Tasks
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # External APIs
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    
    # Risk Thresholds
    RISK_THRESHOLDS: Dict[str, float] = {
        "LOW_MAX": 0.25,
        "MODERATE_MAX": 0.50,
        "HIGH_MAX": 0.75,
        "CRITICAL_MAX": 1.00
    }
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "*"
    ]
    
    # Model Artifacts
    ML_MODEL_DIR: str = os.getenv("ML_MODEL_DIR", "./backend/app/ml/saved_models")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
