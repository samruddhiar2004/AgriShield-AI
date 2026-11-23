from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db, check_db_health
from backend.app.core.config import settings

router = APIRouter()

SYSTEM_CONFIG = {
    "risk_thresholds": {
        "low_max": 25,
        "moderate_max": 50,
        "high_max": 75,
        "critical_max": 100
    },
    "alert_notifications": {
        "in_app_enabled": True,
        "sms_gateway_enabled": False,
        "email_digest_enabled": False,
        "min_alert_level": "High"
    },
    "weather_integration": {
        "provider": "Open-Meteo REST API",
        "update_interval_hours": 6,
        "rolling_window_days": 7
    },
    "geospatial": {
        "default_state": "Maharashtra",
        "primary_crop": "Cotton",
        "spatial_decay_km": 15.0
    }
}

@router.get("")
def get_system_settings(db: Session = Depends(get_db)):
    """
    Returns platform settings and thresholds.
    """
    db_health = check_db_health()
    return {
        "config": SYSTEM_CONFIG,
        "database": db_health,
        "version": settings.VERSION,
        "project_name": settings.PROJECT_NAME
    }

@router.post("")
def update_system_settings(new_config: Dict[str, Any]):
    """
    Updates platform thresholds and parameters.
    """
    if "risk_thresholds" in new_config:
        SYSTEM_CONFIG["risk_thresholds"].update(new_config["risk_thresholds"])
    if "alert_notifications" in new_config:
        SYSTEM_CONFIG["alert_notifications"].update(new_config["alert_notifications"])
    return {"status": "SUCCESS", "message": "Settings updated", "config": SYSTEM_CONFIG}
