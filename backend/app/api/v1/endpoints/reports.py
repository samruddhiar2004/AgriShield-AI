from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.monitoring import FarmerReport
from backend.app.models.agriculture import Farmer, Disease, AgriculturalOfficer
from backend.app.models.geography import Village
from backend.app.schemas.monitoring import FarmerReportCreate, FarmerReportResponse, FarmerReportReview

router = APIRouter()

@router.get("", response_model=List[FarmerReportResponse])
def get_farmer_reports(
    status: Optional[str] = None,
    village_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all farmer observation reports. Supports status filtering (PENDING, VERIFIED, REJECTED).
    """
    query = db.query(FarmerReport).order_by(FarmerReport.created_at.desc())
    if status and status.upper() != "ALL":
        query = query.filter(FarmerReport.status == status.upper())
    if village_id:
        query = query.filter(FarmerReport.village_id == village_id)

    reports = query.all()
    results = []
    for r in reports:
        results.append(FarmerReportResponse(
            id=r.id,
            farmer_id=r.farmer_id,
            farmer_name=r.farmer.name if r.farmer else "Farmer",
            farmer_id_code=r.farmer.farmer_id_code if r.farmer else "N/A",
            village_id=r.village_id,
            village_name=r.village.name if r.village else "Unknown",
            crop_name=r.crop_name,
            suspected_disease_id=r.suspected_disease_id,
            suspected_disease_name=r.disease.name if r.disease else (r.suspected_disease_id or "Unclassified"),
            crop_growth_stage=r.crop_growth_stage,
            observation_date=r.observation_date,
            symptoms=r.symptoms,
            affected_plants_pct=r.affected_plants_pct,
            severity=r.severity,
            image_url=r.image_url,
            latitude=r.latitude,
            longitude=r.longitude,
            status=r.status,
            officer_review_notes=r.officer_review_notes,
            created_at=r.created_at
        ))
    return results

@router.post("", response_model=FarmerReportResponse)
def submit_farmer_report(report_in: FarmerReportCreate, db: Session = Depends(get_db)):
    """
    Submit a field disease observation from a farmer or field extension scout.
    """
    village = db.query(Village).filter(Village.id == report_in.village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    # Match farmer or create anonymous/quick farmer record
    farmer = None
    if report_in.farmer_id_code:
        farmer = db.query(Farmer).filter(Farmer.farmer_id_code == report_in.farmer_id_code).first()
    if not farmer:
        # Check existing or create
        farmer = db.query(Farmer).filter(Farmer.village_id == village.id).first()
        if not farmer:
            farmer = Farmer(
                farmer_id_code=f"FMR-AUTO-{len(db.query(Farmer).all()) + 1:03d}",
                name=report_in.farmer_name,
                contact_number="+91-9999999999",
                village_id=village.id,
                total_land_area_ha=2.5
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)

    # Match suspected disease if provided
    disease_obj = None
    if report_in.suspected_disease_name:
        disease_obj = db.query(Disease).filter(Disease.name.ilike(f"%{report_in.suspected_disease_name}%")).first()

    report = FarmerReport(
        farmer_id=farmer.id,
        village_id=village.id,
        crop_name=report_in.crop_name,
        suspected_disease_id=disease_obj.id if disease_obj else None,
        crop_growth_stage=report_in.crop_growth_stage,
        observation_date=report_in.observation_date or date.today(),
        symptoms=report_in.symptoms,
        affected_plants_pct=report_in.affected_plants_pct,
        severity=report_in.severity,
        image_url=report_in.image_url,
        latitude=report_in.latitude or village.latitude,
        longitude=report_in.longitude or village.longitude,
        status="PENDING"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return FarmerReportResponse(
        id=report.id,
        farmer_id=farmer.id,
        farmer_name=farmer.name,
        farmer_id_code=farmer.farmer_id_code,
        village_id=village.id,
        village_name=village.name,
        crop_name=report.crop_name,
        suspected_disease_id=disease_obj.id if disease_obj else None,
        suspected_disease_name=disease_obj.name if disease_obj else report_in.suspected_disease_name,
        crop_growth_stage=report.crop_growth_stage,
        observation_date=report.observation_date,
        symptoms=report.symptoms,
        affected_plants_pct=report.affected_plants_pct,
        severity=report.severity,
        image_url=report.image_url,
        latitude=report.latitude,
        longitude=report.longitude,
        status=report.status,
        officer_review_notes=None,
        created_at=report.created_at
    )

@router.put("/{report_id}/review", response_model=FarmerReportResponse)
def review_farmer_report(
    report_id: str, 
    review_in: FarmerReportReview, 
    db: Session = Depends(get_db)
):
    """
    Agricultural Officer review endpoint to verify or reject field reports.
    """
    report = db.query(FarmerReport).filter(FarmerReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    officer = db.query(AgriculturalOfficer).first()
    report.status = review_in.status.upper()
    report.officer_review_notes = review_in.officer_review_notes
    if officer:
        report.reviewed_by_id = officer.id

    db.commit()
    db.refresh(report)

    return FarmerReportResponse(
        id=report.id,
        farmer_id=report.farmer_id,
        farmer_name=report.farmer.name if report.farmer else "Farmer",
        farmer_id_code=report.farmer.farmer_id_code if report.farmer else "N/A",
        village_id=report.village_id,
        village_name=report.village.name if report.village else "Unknown",
        crop_name=report.crop_name,
        suspected_disease_id=report.suspected_disease_id,
        suspected_disease_name=report.disease.name if report.disease else "Unclassified",
        crop_growth_stage=report.crop_growth_stage,
        observation_date=report.observation_date,
        symptoms=report.symptoms,
        affected_plants_pct=report.affected_plants_pct,
        severity=report.severity,
        image_url=report.image_url,
        latitude=report.latitude,
        longitude=report.longitude,
        status=report.status,
        officer_review_notes=report.officer_review_notes,
        created_at=report.created_at
    )
