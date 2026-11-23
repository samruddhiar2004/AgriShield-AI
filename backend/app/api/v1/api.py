from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    health,
    auth,
    dashboard,
    villages,
    weather,
    crops,
    farmers,
    reports,
    predictions,
    alerts,
    analytics,
    settings,
    ingest,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(villages.router, prefix="/villages", tags=["Villages & GIS"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather Intelligence"])
api_router.include_router(crops.router, prefix="/crops", tags=["Crops"])
api_router.include_router(farmers.router, prefix="/farmers", tags=["Farmers & Farms"])
api_router.include_router(reports.router, prefix="/reports", tags=["Farmer Reports"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions & Risk Engine"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Early Warning Alerts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & ML Benchmarks"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings & Configuration"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["Data Ingestion Engine"])
