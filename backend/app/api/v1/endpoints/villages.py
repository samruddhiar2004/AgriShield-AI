from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.geography import Village, District
from backend.app.models.intelligence import VillageRiskAssessment, PredictionRecord, Alert
from backend.app.models.monitoring import FarmerReport, WeatherObservation
from backend.app.schemas.geography import VillageResponse, VillageDetailResponse
from backend.app.services.risk_engine import VillageRiskEngine
from backend.app.services.weather_service import WeatherService

router = APIRouter()

@router.get("", response_model=List[VillageResponse])
def get_villages(
    district: Optional[str] = None,
    risk_category: Optional[str] = None,
    disease: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all monitored villages with GIS coordinates and latest risk assessments.
    Supports filtering by district, risk category, and dominant disease threat.
    """
    query = db.query(Village)
    if district:
        query = query.join(District).filter(District.name.ilike(f"%{district}%"))

    villages = query.all()
    results = []

    for v in villages:
        latest_assessment = (
            db.query(VillageRiskAssessment)
            .filter(VillageRiskAssessment.village_id == v.id)
            .order_by(VillageRiskAssessment.assessment_date.desc())
            .first()
        )
        
        risk_score = latest_assessment.overall_risk_score if latest_assessment else 15.0
        risk_cat = latest_assessment.risk_category if latest_assessment else "Low"
        dominant_threat = latest_assessment.dominant_threat_disease if latest_assessment else "None"

        # Apply filters
        if risk_category and risk_category.lower() != "all":
            if risk_cat.lower() != risk_category.lower():
                continue
        if disease and disease.lower() != "all":
            if disease.lower() not in dominant_threat.lower():
                continue

        alerts_count = db.query(Alert).filter(Alert.village_id == v.id, Alert.status == "ACTIVE").count()
        farmers_count = len(v.farmers) if v.farmers else 0

        results.append(VillageResponse(
            id=v.id,
            name=v.name,
            code=v.code,
            district_id=v.district_id,
            district_name=v.district.name if v.district else "Maharashtra",
            latitude=v.latitude,
            longitude=v.longitude,
            elevation_m=v.elevation_m,
            total_cultivated_area_ha=v.total_cultivated_area_ha,
            cotton_cultivated_area_ha=v.cotton_cultivated_area_ha,
            current_risk_score=round(risk_score, 1),
            current_risk_category=risk_cat,
            dominant_threat_disease=dominant_threat,
            recent_alert_count=alerts_count,
            monitored_farmers_count=farmers_count
        ))

    return results

@router.get("/{village_id}", response_model=VillageDetailResponse)
def get_village_details(village_id: str, db: Session = Depends(get_db)):
    """
    Detailed GIS and intelligence profile for a single village.
    """
    v = db.query(Village).filter(Village.id == village_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Village not found")

    latest_assessment = (
        db.query(VillageRiskAssessment)
        .filter(VillageRiskAssessment.village_id == v.id)
        .order_by(VillageRiskAssessment.assessment_date.desc())
        .first()
    )
    
    # Weather summary
    weather_info = WeatherService.get_or_sync_village_weather(db, v)
    
    # Historical predictions
    past_preds = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.village_id == v.id)
        .order_by(PredictionRecord.created_at.desc())
        .limit(10)
        .all()
    )
    history = [
        {
            "id": p.id,
            "date": str(p.prediction_date),
            "disease": p.disease_name,
            "probability": p.prediction_probability,
            "risk_percentage": round(p.prediction_probability * 100, 1),
            "category": p.risk_category
        }
        for p in past_preds
    ]

    # Recent farmer reports
    reports = (
        db.query(FarmerReport)
        .filter(FarmerReport.village_id == v.id)
        .order_by(FarmerReport.observation_date.desc())
        .limit(5)
        .all()
    )
    formatted_reports = [
        {
            "id": r.id,
            "farmer_name": r.farmer.name if r.farmer else "Farmer",
            "crop": r.crop_name,
            "stage": r.crop_growth_stage,
            "symptoms": r.symptoms,
            "status": r.status,
            "date": str(r.observation_date)
        }
        for r in reports
    ]

    alerts_count = db.query(Alert).filter(Alert.village_id == v.id, Alert.status == "ACTIVE").count()

    return VillageDetailResponse(
        id=v.id,
        name=v.name,
        code=v.code,
        district_id=v.district_id,
        district_name=v.district.name if v.district else "Maharashtra",
        latitude=v.latitude,
        longitude=v.longitude,
        elevation_m=v.elevation_m,
        total_cultivated_area_ha=v.total_cultivated_area_ha,
        cotton_cultivated_area_ha=v.cotton_cultivated_area_ha,
        current_risk_score=latest_assessment.overall_risk_score if latest_assessment else 20.0,
        current_risk_category=latest_assessment.risk_category if latest_assessment else "Low",
        dominant_threat_disease=latest_assessment.dominant_threat_disease if latest_assessment else "Pink Bollworm",
        recent_alert_count=alerts_count,
        monitored_farmers_count=len(v.farmers) if v.farmers else 0,
        key_drivers=latest_assessment.key_drivers if latest_assessment else [],
        recommended_action=latest_assessment.recommended_action if latest_assessment else "Routine bi-weekly field scouting.",
        weather_summary=weather_info,
        historical_predictions=history,
        recent_farmer_reports=formatted_reports
    )

@router.post("/{village_id}/assess")
def trigger_village_assessment(
    village_id: str, 
    crop_name: str = "Cotton", 
    disease_name: str = "Pink Bollworm", 
    db: Session = Depends(get_db)
):
    """
    Triggers an immediate 10-step risk evaluation for this village.
    """
    res = VillageRiskEngine.evaluate_village_risk(
        db=db,
        village_id=village_id,
        target_crop_name=crop_name,
        target_disease_name=disease_name
    )
    return res
