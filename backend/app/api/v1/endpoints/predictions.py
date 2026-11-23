from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.geography import Village
from backend.app.models.intelligence import PredictionRecord
from backend.app.schemas.intelligence import PredictionRequest, PredictionResponse
from backend.app.services.risk_engine import VillageRiskEngine

router = APIRouter()

@router.post("/assess", response_model=PredictionResponse)
def run_prediction_assessment(pred_req: PredictionRequest, db: Session = Depends(get_db)):
    """
    On-demand risk prediction for a village with SHAP explainability and agronomic guidance.
    """
    try:
        result = VillageRiskEngine.evaluate_village_risk(
            db=db,
            village_id=pred_req.village_id,
            target_crop_name=pred_req.crop_name,
            target_disease_name=pred_req.target_disease or "Pink Bollworm"
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/history")
def get_prediction_history(village_id: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieve historical prediction records with contributing factors.
    """
    query = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc())
    if village_id:
        query = query.filter(PredictionRecord.village_id == village_id)

    records = query.limit(limit).all()
    results = []
    for r in records:
        v = db.query(Village).filter(Village.id == r.village_id).first()
        results.append({
            "id": r.id,
            "village_id": r.village_id,
            "village_name": v.name if v else "Unknown",
            "district_name": v.district.name if v and v.district else "Maharashtra",
            "crop": r.crop_name,
            "disease": r.disease_name,
            "outbreak_probability": r.prediction_probability,
            "risk_percentage": round(r.prediction_probability * 100, 1),
            "risk_category": r.risk_category,
            "confidence_low": r.confidence_interval_low,
            "confidence_high": r.confidence_interval_high,
            "prediction_date": str(r.prediction_date),
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "contributing_factors": r.contributing_factors or []
        })
    return results

@router.post("/batch-run")
def run_batch_risk_assessment(db: Session = Depends(get_db)):
    """
    Runs automated batch risk assessment across all monitored villages.
    """
    villages = db.query(Village).all()
    summary = []
    for v in villages:
        res = VillageRiskEngine.evaluate_village_risk(
            db=db,
            village_id=v.id,
            target_crop_name="Cotton",
            target_disease_name="Pink Bollworm"
        )
        summary.append({
            "village_id": v.id,
            "village_name": v.name,
            "risk_percentage": res["risk_percentage"],
            "risk_category": res["risk_category"]
        })
    return {
        "status": "SUCCESS",
        "assessed_villages_count": len(summary),
        "assessments": summary
    }
