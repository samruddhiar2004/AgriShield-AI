import logging
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.intelligence import Alert
from backend.app.models.geography import Village
from backend.app.services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)

class AlertService:
    @staticmethod
    def create_or_update_alert(
        db: Session,
        village_id: str,
        crop: str,
        disease_name: str,
        risk_probability: float,
        risk_category: str,
        contributing_factors: List[str]
    ) -> Optional[Alert]:
        """
        Generates or updates early warning alerts when risk threshold is crossed (High or Critical).
        Deduplicates active alerts to avoid spamming extension officers.
        """
        if risk_category not in ["High", "Critical"]:
            return None

        village = db.query(Village).filter(Village.id == village_id).first()
        if not village:
            return None

        # Check existing active alert for this village and disease
        existing = (
            db.query(Alert)
            .filter(
                Alert.village_id == village_id,
                Alert.suspected_disease == disease_name,
                Alert.status == "ACTIVE"
            )
            .first()
        )

        guidance = RecommendationService.get_summary_guidance(disease_name, risk_category)

        if existing:
            # Update risk score and timestamp
            existing.risk_probability = round(risk_probability, 2)
            existing.risk_category = risk_category
            existing.contributing_factors = contributing_factors
            existing.alert_timestamp = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

        # Create new early warning alert
        new_alert = Alert(
            village_id=village_id,
            crop=crop,
            suspected_disease=disease_name,
            risk_probability=round(risk_probability, 2),
            risk_category=risk_category,
            contributing_factors=contributing_factors,
            recommended_inspection=guidance["inspection"],
            preventive_actions=guidance["preventive"],
            status="ACTIVE",
            alert_timestamp=datetime.utcnow()
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        logger.info(f"Generated {risk_category} Alert for {village.name} - Disease: {disease_name}")
        return new_alert

    @staticmethod
    def update_alert_status(db: Session, alert_id: str, new_status: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = new_status
        if new_status == "RESOLVED":
            alert.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(alert)
        return alert
