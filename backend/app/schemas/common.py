from typing import Optional, Dict, Any
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    version: str
    database: Dict[str, Any]
    redis: Dict[str, Any]
    ml_models: Dict[str, Any]
    environment: str

class MessageResponse(BaseModel):
    message: str
    success: bool = True
    details: Optional[Dict[str, Any]] = None
