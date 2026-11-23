from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.geography import Village
from backend.app.schemas.monitoring import WeatherQueryResponse
from backend.app.services.weather_service import WeatherService

router = APIRouter()

@router.get("/village/{village_id}", response_model=WeatherQueryResponse)
def get_village_weather(village_id: str, db: Session = Depends(get_db)):
    """
    Returns live weather observations and rolling 3d/7d averages for a village.
    """
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    weather_data = WeatherService.get_or_sync_village_weather(db, village)
    return weather_data
