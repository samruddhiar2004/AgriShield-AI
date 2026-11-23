from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class WeatherObservationResponse(BaseModel):
    id: str
    village_id: str
    village_name: Optional[str] = None
    observation_date: date
    temperature_c: float
    relative_humidity_pct: float
    rainfall_mm: float
    wind_speed_kmh: float
    temp_avg_3d: Optional[float]
    temp_avg_7d: Optional[float]
    humidity_avg_3d: Optional[float]
    humidity_avg_7d: Optional[float]
    cumulative_rainfall_7d: Optional[float]
    conducive_weather_index: Optional[float]

    class Config:
        from_attributes = True

class WeatherQueryResponse(BaseModel):
    village_id: str
    village_name: str
    current_temperature_c: float
    current_humidity_pct: float
    current_rainfall_mm: float
    temp_avg_3d: float
    temp_avg_7d: float
    humidity_avg_3d: float
    humidity_avg_7d: float
    cumulative_rainfall_7d: float
    conducive_index: float
    risk_assessment: str
    observations_history: List[WeatherObservationResponse] = []

class FarmerReportCreate(BaseModel):
    farmer_name: str
    farmer_id_code: Optional[str] = None
    village_id: str
    crop_name: str = "Cotton"
    suspected_disease_name: Optional[str] = None
    crop_growth_stage: str
    observation_date: Optional[date] = None
    symptoms: str
    affected_plants_pct: float = 5.0
    severity: str = "Moderate" # Low, Moderate, High, Severe
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class FarmerReportReview(BaseModel):
    status: str # VERIFIED, REJECTED
    officer_review_notes: str

class FarmerReportResponse(BaseModel):
    id: str
    farmer_id: Optional[str]
    farmer_name: Optional[str]
    farmer_id_code: Optional[str]
    village_id: str
    village_name: Optional[str]
    crop_name: str
    suspected_disease_id: Optional[str]
    suspected_disease_name: Optional[str]
    crop_growth_stage: str
    observation_date: date
    symptoms: str
    affected_plants_pct: float
    severity: str
    image_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    officer_review_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
