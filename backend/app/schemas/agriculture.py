from typing import Optional, List
from pydantic import BaseModel

class CropGrowthStageResponse(BaseModel):
    id: str
    stage_name: str
    stage_order: int
    duration_days: int
    description: Optional[str]
    susceptibility_multiplier: float

    class Config:
        from_attributes = True

class DiseaseResponse(BaseModel):
    id: str
    name: str
    pathogen_type: str
    optimal_temp_min: Optional[float]
    optimal_temp_max: Optional[float]
    optimal_humidity_min: Optional[float]
    description: Optional[str]
    symptoms: Optional[str]

    class Config:
        from_attributes = True

class CropResponse(BaseModel):
    id: str
    name: str
    scientific_name: Optional[str]
    category: str
    description: Optional[str]
    growth_stages: List[CropGrowthStageResponse] = []
    diseases: List[DiseaseResponse] = []

    class Config:
        from_attributes = True

class FarmResponse(BaseModel):
    id: str
    farmer_id: str
    farmer_name: Optional[str] = None
    village_id: str
    village_name: Optional[str] = None
    crop_name: Optional[str] = "Cotton"
    survey_number: Optional[str]
    area_hectares: float
    soil_type: str
    current_growth_stage: str
    latitude: float
    longitude: float

    class Config:
        from_attributes = True

class FarmerResponse(BaseModel):
    id: str
    farmer_id_code: str
    name: str
    contact_number: str
    village_id: str
    village_name: Optional[str] = None
    district_name: Optional[str] = None
    total_land_area_ha: float
    farms_count: Optional[int] = 1

    class Config:
        from_attributes = True

class FarmerCreate(BaseModel):
    farmer_id_code: str
    name: str
    contact_number: str
    village_id: str
    total_land_area_ha: float = 2.0
