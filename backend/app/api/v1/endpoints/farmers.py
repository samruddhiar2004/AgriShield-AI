from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.agriculture import Farmer, Farm
from backend.app.models.geography import Village
from backend.app.schemas.agriculture import FarmerResponse, FarmResponse, FarmerCreate

router = APIRouter()

@router.get("", response_model=List[FarmerResponse])
def get_farmers(db: Session = Depends(get_db)):
    """
    List all registered farmers with village and monitored acreage details.
    """
    farmers = db.query(Farmer).all()
    results = []
    for f in farmers:
        v_name = f.village.name if f.village else None
        d_name = f.village.district.name if f.village and f.village.district else "Maharashtra"
        results.append(FarmerResponse(
            id=f.id,
            farmer_id_code=f.farmer_id_code,
            name=f.name,
            contact_number=f.contact_number,
            village_id=f.village_id,
            village_name=v_name,
            district_name=d_name,
            total_land_area_ha=f.total_land_area_ha,
            farms_count=len(f.farms) if f.farms else 1
        ))
    return results

@router.post("", response_model=FarmerResponse)
def create_farmer(farmer_in: FarmerCreate, db: Session = Depends(get_db)):
    """
    Register a new farmer in the AgriShield monitoring network.
    """
    village = db.query(Village).filter(Village.id == farmer_in.village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
        
    farmer = Farmer(
        farmer_id_code=farmer_in.farmer_id_code,
        name=farmer_in.name,
        contact_number=farmer_in.contact_number,
        village_id=farmer_in.village_id,
        total_land_area_ha=farmer_in.total_land_area_ha,
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    
    # Create default farm plot for this farmer
    farm = Farm(
        farmer_id=farmer.id,
        village_id=village.id,
        crop_id=db.query(Farm).first().crop_id if db.query(Farm).first() else None,
        survey_number=f"Gat-{farmer.farmer_id_code}",
        area_hectares=farmer.total_land_area_ha * 0.85,
        soil_type="Black Cotton Soil",
        current_growth_stage="Flowering",
        latitude=village.latitude + 0.002,
        longitude=village.longitude + 0.002,
    )
    db.add(farm)
    db.commit()

    return FarmerResponse(
        id=farmer.id,
        farmer_id_code=farmer.farmer_id_code,
        name=farmer.name,
        contact_number=farmer.contact_number,
        village_id=farmer.village_id,
        village_name=village.name,
        district_name=village.district.name if village.district else "Maharashtra",
        total_land_area_ha=farmer.total_land_area_ha,
        farms_count=1
    )

@router.get("/farms", response_model=List[FarmResponse])
def get_farms(db: Session = Depends(get_db)):
    """
    List all monitored farm plots with crop stages and GIS coordinates.
    """
    farms = db.query(Farm).all()
    results = []
    for fm in farms:
        results.append(FarmResponse(
            id=fm.id,
            farmer_id=fm.farmer_id,
            farmer_name=fm.farmer.name if fm.farmer else "Unknown Farmer",
            village_id=fm.village_id,
            village_name=fm.village.name if fm.village else "Unknown Village",
            crop_name=fm.crop.name if fm.crop else "Cotton",
            survey_number=fm.survey_number,
            area_hectares=fm.area_hectares,
            soil_type=fm.soil_type,
            current_growth_stage=fm.current_growth_stage,
            latitude=fm.latitude,
            longitude=fm.longitude
        ))
    return results

@router.get("/{farmer_id}/portal")
def get_farmer_portal_data(farmer_id: str, db: Session = Depends(get_db)):
    """
    Personalized portal endpoint for an individual farmer.
    Returns plot risk, stage-specific advisories, local weather, and past observation status.
    """
    from backend.app.models.intelligence import VillageRiskAssessment, Alert
    from backend.app.models.monitoring import FarmerReport
    from backend.app.services.weather_service import WeatherService
    from backend.app.services.recommendation_service import RecommendationService

    farmer = db.query(Farmer).filter((Farmer.id == farmer_id) | (Farmer.farmer_id_code == farmer_id)).first()
    if not farmer:
        # Fallback to first farmer
        farmer = db.query(Farmer).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")

    village = farmer.village
    primary_farm = farmer.farms[0] if farmer.farms else None

    # Village risk assessment
    latest_assessment = (
        db.query(VillageRiskAssessment)
        .filter(VillageRiskAssessment.village_id == village.id)
        .order_by(VillageRiskAssessment.assessment_date.desc())
        .first()
    )

    risk_score = latest_assessment.overall_risk_score if latest_assessment else 25.0
    risk_cat = latest_assessment.risk_category if latest_assessment else "Low"
    threat = latest_assessment.dominant_threat_disease if latest_assessment else "Pink Bollworm"

    # Action recommendations tailored to farmer's crop stage
    growth_stage = primary_farm.current_growth_stage if primary_farm else "Flowering"
    guidance = RecommendationService.get_summary_guidance(threat, risk_cat)
    action_protocol = [
        {"step": 1, "action": guidance["inspection"], "priority": "High" if risk_cat in ["High", "Critical"] else "Routine"},
        {"step": 2, "action": guidance["preventive"], "priority": "High" if risk_cat in ["High", "Critical"] else "Recommended"},
        {"step": 3, "action": f"Avoid excessive nitrogenous fertilizer application during {growth_stage} stage in black cotton soil.", "priority": "Advisory"}
    ]

    # Hyperlocal Weather
    weather = WeatherService.get_or_sync_village_weather(db, village)

    # Active alerts in farmer's village
    village_alerts = (
        db.query(Alert)
        .filter(Alert.village_id == village.id, Alert.status == "ACTIVE")
        .all()
    )

    # Farmer's personal reports
    reports = (
        db.query(FarmerReport)
        .filter(FarmerReport.farmer_id == farmer.id)
        .order_by(FarmerReport.created_at.desc())
        .all()
    )
    formatted_reports = [
        {
            "id": r.id,
            "crop": r.crop_name,
            "stage": r.crop_growth_stage,
            "symptoms": r.symptoms,
            "affected_pct": r.affected_plants_pct,
            "severity": r.severity,
            "status": r.status,
            "officer_notes": r.officer_review_notes,
            "date": str(r.observation_date)
        }
        for r in reports
    ]

    return {
        "farmer": {
            "id": farmer.id,
            "farmer_id_code": farmer.farmer_id_code,
            "name": farmer.name,
            "contact_number": farmer.contact_number,
            "village_id": village.id,
            "village_name": village.name,
            "district_name": village.district.name if village.district else "Maharashtra",
            "total_land_area_ha": farmer.total_land_area_ha,
        },
        "primary_plot": {
            "survey_number": primary_farm.survey_number if primary_farm else "Gat-001",
            "area_hectares": primary_farm.area_hectares if primary_farm else farmer.total_land_area_ha,
            "soil_type": primary_farm.soil_type if primary_farm else "Black Cotton Soil",
            "current_growth_stage": growth_stage,
            "crop_name": "Cotton (Bt Cotton)",
            "latitude": primary_farm.latitude if primary_farm else village.latitude,
            "longitude": primary_farm.longitude if primary_farm else village.longitude
        },
        "plot_risk": {
            "risk_score": round(risk_score, 1),
            "risk_category": risk_cat,
            "dominant_threat": threat,
            "key_drivers": latest_assessment.key_drivers if latest_assessment else ["Normal seasonal weather conditions."],
            "active_alerts_count": len(village_alerts)
        },
        "action_protocol": action_protocol,
        "local_weather": {
            "temp_c": weather["current_temperature_c"],
            "temp_7d_avg": weather["temp_avg_7d"],
            "humidity_pct": weather["current_humidity_pct"],
            "rainfall_7d_mm": weather["cumulative_rainfall_7d"],
            "conducive_index": weather["conducive_index"],
            "summary": weather["risk_assessment"]
        },
        "my_reports": formatted_reports
    }
