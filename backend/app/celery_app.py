import logging
from celery import Celery
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "agrishield_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
)

@celery_app.task(name="tasks.daily_village_risk_sync")
def daily_village_risk_sync():
    """
    Scheduled background task: Recomputes risk scores across all monitored Maharashtra villages.
    """
    from backend.app.database.session import SessionLocal
    from backend.app.models.geography import Village
    from backend.app.services.risk_engine import VillageRiskEngine
    
    db = SessionLocal()
    try:
        villages = db.query(Village).all()
        logger.info(f"[Celery] Starting batch risk assessment for {len(villages)} villages...")
        processed = 0
        for v in villages:
            VillageRiskEngine.evaluate_village_risk(
                db=db,
                village_id=v.id,
                target_crop_name="Cotton",
                target_disease_name="Pink Bollworm"
            )
            processed += 1
        logger.info(f"[Celery] Completed risk assessments for {processed} villages.")
        return {"processed": processed, "status": "SUCCESS"}
    finally:
        db.close()

@celery_app.task(name="tasks.fetch_live_weather_batch")
def fetch_live_weather_batch():
    """
    Scheduled background task: Queries Open-Meteo for all active village coordinates.
    """
    from backend.app.database.session import SessionLocal
    from backend.app.models.geography import Village
    from backend.app.services.weather_service import WeatherService
    
    db = SessionLocal()
    try:
        villages = db.query(Village).all()
        for v in villages:
            WeatherService.get_or_sync_village_weather(db, v)
        return {"status": "SUCCESS", "synced_villages": len(villages)}
    finally:
        db.close()
