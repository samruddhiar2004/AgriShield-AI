from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.intelligence import Alert
from backend.app.schemas.intelligence import AlertResponse, AlertStatusUpdate
from backend.app.services.alert_service import AlertService

router = APIRouter()

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[str] = None,
    risk_category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List early warning disease outbreak alerts with optional status and risk filters.
    """
    query = db.query(Alert).order_by(Alert.alert_timestamp.desc())
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if risk_category and risk_category.capitalize() != "All":
        query = query.filter(Alert.risk_category == risk_category.capitalize())

    alerts = query.all()
    results = []
    for a in alerts:
        results.append(AlertResponse(
            id=a.id,
            village_id=a.village_id,
            village_name=a.village.name if a.village else "Unknown Village",
            district_name=a.village.district.name if a.village and a.village.district else "Maharashtra",
            crop=a.crop,
            suspected_disease=a.suspected_disease,
            risk_probability=a.risk_probability,
            risk_category=a.risk_category,
            contributing_factors=a.contributing_factors or [],
            recommended_inspection=a.recommended_inspection,
            preventive_actions=a.preventive_actions,
            status=a.status,
            alert_timestamp=a.alert_timestamp,
            resolved_at=a.resolved_at
        ))
    return results

@router.put("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(
    alert_id: str, 
    status_update: AlertStatusUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update alert status to ACKNOWLEDGED or RESOLVED.
    """
    updated_alert = AlertService.update_alert_status(
        db=db,
        alert_id=alert_id,
        new_status=status_update.status.upper()
    )
    if not updated_alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return AlertResponse(
        id=updated_alert.id,
        village_id=updated_alert.village_id,
        village_name=updated_alert.village.name if updated_alert.village else "Unknown",
        district_name=updated_alert.village.district.name if updated_alert.village and updated_alert.village.district else "Maharashtra",
        crop=updated_alert.crop,
        suspected_disease=updated_alert.suspected_disease,
        risk_probability=updated_alert.risk_probability,
        risk_category=updated_alert.risk_category,
        contributing_factors=updated_alert.contributing_factors or [],
        recommended_inspection=updated_alert.recommended_inspection,
        preventive_actions=updated_alert.preventive_actions,
        status=updated_alert.status,
        alert_timestamp=updated_alert.alert_timestamp,
        resolved_at=updated_alert.resolved_at
    )
