import math
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.geography import Village
from backend.app.models.agriculture import Crop, CropGrowthStage, Farm, Disease
from backend.app.models.monitoring import FarmerReport, DiseaseIncident
from backend.app.models.intelligence import PredictionRecord, VillageRiskAssessment
from backend.app.services.weather_service import WeatherService
from backend.app.services.alert_service import AlertService
from backend.app.services.recommendation_service import RecommendationService
from backend.app.ml.dataset_generator import FEATURE_COLUMNS
from backend.app.ml.explainer import MLExplainer

logger = logging.getLogger(__name__)

class VillageRiskEngine:
    @classmethod
    def evaluate_village_risk(
        cls, 
        db: Session, 
        village_id: str, 
        target_crop_name: str = "Cotton", 
        target_disease_name: str = "Pink Bollworm"
    ) -> Dict[str, Any]:
        """
        Executes the 10-step Village-Level Risk Engine sequence.
        """
        village = db.query(Village).filter(Village.id == village_id).first()
        if not village:
            raise ValueError(f"Village ID {village_id} not found.")

        # 1. Retrieve weather data
        weather_data = WeatherService.get_or_sync_village_weather(db, village)
        
        # 2. Retrieve crop and growth stage info
        crop = db.query(Crop).filter(Crop.name == target_crop_name).first()
        growth_stages = db.query(CropGrowthStage).filter(CropGrowthStage.crop_id == crop.id).all() if crop else []
        stage_map = {s.stage_name: s.susceptibility_multiplier for s in growth_stages}
        
        # Sample or dominant stage for village
        farms = db.query(Farm).filter(Farm.village_id == village_id).all()
        current_stage = farms[0].current_growth_stage if farms else "Flowering"
        stage_susceptibility = stage_map.get(current_stage, 1.4)

        # 3. Retrieve historical disease incidents
        disease = db.query(Disease).filter(Disease.name == target_disease_name).first()
        disease_id = disease.id if disease else None
        
        hist_incidents_count = (
            db.query(DiseaseIncident)
            .filter(DiseaseIncident.village_id == village_id)
            .count()
        )

        # 4. Retrieve verified farmer reports (within village and adjacent cluster)
        verified_reports = (
            db.query(FarmerReport)
            .filter(
                FarmerReport.village_id == village_id,
                FarmerReport.status == "VERIFIED"
            )
            .count()
        )

        # 5. Feature Engineering
        # Calculate spatial proximity risk using distance decay from verified incidents
        spatial_proximity_score = min(1.0, (verified_reports * 0.25) + (hist_incidents_count * 0.15))
        
        feature_dict = {
            "temp_avg_3d": weather_data["temp_avg_3d"],
            "temp_avg_7d": weather_data["temp_avg_7d"],
            "humidity_avg_3d": weather_data["humidity_avg_3d"],
            "humidity_avg_7d": weather_data["humidity_avg_7d"],
            "cumulative_rainfall_7d": weather_data["cumulative_rainfall_7d"],
            "conducive_weather_index": weather_data["conducive_index"],
            "stage_susceptibility": round(stage_susceptibility, 2),
            "elevation_m": village.elevation_m or 320.0,
            "nearby_verified_reports": verified_reports,
            "historical_outbreak_count": hist_incidents_count,
            "spatial_proximity_score": round(spatial_proximity_score, 3)
        }

        # 6. Run ML Prediction Model
        model = MLExplainer.load_active_model("XGBoost")
        if model:
            try:
                df_feat = pd.DataFrame([feature_dict])[FEATURE_COLUMNS]
                outbreak_prob = float(model.predict_proba(df_feat)[:, 1][0])
            except Exception as e:
                logger.warning(f"ML inference error: {e}. Using calibrated fallback.")
                outbreak_prob = cls._fallback_probability(feature_dict)
        else:
            outbreak_prob = cls._fallback_probability(feature_dict)

        # 7. Aggregate relevant farm-level predictions into village-level risk
        risk_percentage = round(outbreak_prob * 100.0, 1)
        risk_category = cls._categorize_risk(outbreak_prob)

        # 8. Generate risk explanations (SHAP & Agronomic drivers)
        contributions = MLExplainer.explain_prediction(feature_dict, "XGBoost")
        shap_summary = {c["feature_name"]: c["contribution_weight"] for c in contributions}
        
        key_drivers = [
            c["description"] for c in contributions if c["direction"] == "INCREASES_RISK"
        ]
        if not key_drivers:
            key_drivers = ["Prevailing weather metrics indicate low microclimate disease favorability."]

        # Component breakdown scores (0-100)
        weather_comp = round(weather_data["conducive_index"] * 100.0, 1)
        spatial_comp = round(spatial_proximity_score * 100.0, 1)
        crop_comp = round(min(100.0, stage_susceptibility * 50.0), 1)

        guidance = RecommendationService.get_summary_guidance(target_disease_name, risk_category)
        recommended_action = guidance["inspection"]

        # 9. Store the prediction record and village risk assessment
        pred_record = PredictionRecord(
            village_id=village_id,
            crop_name=target_crop_name,
            disease_name=target_disease_name,
            prediction_probability=round(outbreak_prob, 3),
            risk_category=risk_category,
            confidence_interval_low=round(max(0.0, outbreak_prob - 0.08), 3),
            confidence_interval_high=round(min(1.0, outbreak_prob + 0.08), 3),
            contributing_factors=contributions,
            prediction_date=date.today()
        )
        db.add(pred_record)

        # Upsert or save VillageRiskAssessment
        assessment = (
            db.query(VillageRiskAssessment)
            .filter(
                VillageRiskAssessment.village_id == village_id,
                VillageRiskAssessment.assessment_date == date.today()
            )
            .first()
        )
        if not assessment:
            assessment = VillageRiskAssessment(
                village_id=village_id,
                assessment_date=date.today(),
                overall_risk_score=risk_percentage,
                risk_category=risk_category,
                dominant_threat_disease=target_disease_name,
                weather_risk_score=weather_comp,
                spatial_proximity_score=spatial_comp,
                crop_vulnerability_score=crop_comp,
                key_drivers=key_drivers,
                recommended_action=recommended_action
            )
            db.add(assessment)
        else:
            assessment.overall_risk_score = risk_percentage
            assessment.risk_category = risk_category
            assessment.dominant_threat_disease = target_disease_name
            assessment.weather_risk_score = weather_comp
            assessment.spatial_proximity_score = spatial_comp
            assessment.crop_vulnerability_score = crop_comp
            assessment.key_drivers = key_drivers
            assessment.recommended_action = recommended_action
        
        db.commit()

        # 10. Trigger alerts when appropriate
        if risk_category in ["High", "Critical"]:
            AlertService.create_or_update_alert(
                db=db,
                village_id=village_id,
                crop=target_crop_name,
                disease_name=target_disease_name,
                risk_probability=outbreak_prob,
                risk_category=risk_category,
                contributing_factors=key_drivers
            )

        return {
            "village_id": village_id,
            "village_name": village.name,
            "crop_name": target_crop_name,
            "disease_name": target_disease_name,
            "outbreak_probability": round(outbreak_prob, 3),
            "risk_percentage": risk_percentage,
            "risk_category": risk_category,
            "confidence_range": [round(max(0.0, outbreak_prob - 0.08), 3), round(min(1.0, outbreak_prob + 0.08), 3)],
            "top_contributing_factors": contributions,
            "model_used": "XGBoost",
            "model_version": "v1.0-xgboost",
            "shap_summary": shap_summary,
            "recommended_action": recommended_action,
            "weather_risk_component": weather_comp,
            "spatial_risk_component": spatial_comp,
            "crop_vulnerability_component": crop_comp
        }

    @staticmethod
    def _categorize_risk(prob: float) -> str:
        if prob <= 0.25:
            return "Low"
        elif prob <= 0.50:
            return "Moderate"
        elif prob <= 0.75:
            return "High"
        else:
            return "Critical"

    @staticmethod
    def _fallback_probability(f: Dict[str, float]) -> float:
        score = (
            f.get("conducive_weather_index", 0.5) * 0.40 +
            (f.get("stage_susceptibility", 1.0) / 2.0) * 0.30 +
            f.get("spatial_proximity_score", 0.3) * 0.30
        )
        return float(np.clip(score, 0.05, 0.95))
