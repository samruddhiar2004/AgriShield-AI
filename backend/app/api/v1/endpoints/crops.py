from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.agriculture import Crop, Disease, CropGrowthStage
from backend.app.schemas.agriculture import CropResponse, DiseaseResponse

router = APIRouter()

@router.get("", response_model=List[CropResponse])
def get_monitored_crops(db: Session = Depends(get_db)):
    """
    Returns crops under surveillance along with their phenological growth stages and associated pathogens.
    """
    crops = db.query(Crop).all()
    return crops

@router.get("/diseases", response_model=List[DiseaseResponse])
def get_tracked_diseases(db: Session = Depends(get_db)):
    """
    Returns all agricultural disease profiles with bio-climatic thresholds.
    """
    diseases = db.query(Disease).all()
    return diseases
