from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DistrictResponse(BaseModel):
    id: str
    name: str
    state: str
    latitude: float
    longitude: float
    village_count: Optional[int] = 0

    class Config:
        from_attributes = True

class VillageResponse(BaseModel):
    id: str
    name: str
    code: str
    district_id: str
    district_name: Optional[str] = None
    latitude: float
    longitude: float
    elevation_m: Optional[float] = 320.0
    total_cultivated_area_ha: Optional[float] = 1200.0
    cotton_cultivated_area_ha: Optional[float] = 800.0
    
    # Current risk status
    current_risk_score: Optional[float] = 0.0 # 0-100%
    current_risk_category: Optional[str] = "Low" # Low, Moderate, High, Critical
    dominant_threat_disease: Optional[str] = "None"
    recent_alert_count: Optional[int] = 0
    monitored_farmers_count: Optional[int] = 0

    class Config:
        from_attributes = True

class VillageDetailResponse(VillageResponse):
    key_drivers: Optional[List[str]] = []
    recommended_action: Optional[str] = None
    weather_summary: Optional[Dict[str, Any]] = None
    historical_predictions: Optional[List[Dict[str, Any]]] = []
    recent_farmer_reports: Optional[List[Dict[str, Any]]] = []
