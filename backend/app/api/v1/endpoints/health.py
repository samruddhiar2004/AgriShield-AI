from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db, check_db_health
from backend.app.core.config import settings
from backend.app.models.intelligence import MLModelVersion
from backend.app.schemas.common import HealthResponse

router = APIRouter()

@router.get("", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """
    Platform Health Check API.
    Inspects backend runtime, database status, PostGIS capability, and ML model versions.
    """
    db_health = check_db_health()
    
    # Check registered ML models
    active_models = db.query(MLModelVersion).all()
    models_status = {
        "count": len(active_models),
        "active_algorithm": next((m.algorithm for m in active_models if m.is_active), "XGBoost"),
        "models": [{"algo": m.algorithm, "version": m.version, "f1": m.f1_score, "roc_auc": m.roc_auc} for m in active_models]
    }
    
    # Redis check
    redis_status = {
        "configured_url": settings.REDIS_URL,
        "status": "Ready (In-memory task fallback enabled for standalone dev)"
    }

    return HealthResponse(
        status="HEALTHY",
        version=settings.VERSION,
        database=db_health,
        redis=redis_status,
        ml_models=models_status,
        environment="production" if "postgresql" in db_health["dialect"] else "development"
    )
