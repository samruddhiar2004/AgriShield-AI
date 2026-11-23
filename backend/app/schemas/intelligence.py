from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ContributingFactor(BaseModel):
    feature_name: str
    contribution_weight: float
    description: str
    direction: str # "INCREASES_RISK" or "DECREASES_RISK"

class PredictionRequest(BaseModel):
    village_id: str
    crop_name: str = "Cotton"
    growth_stage: str = "Flowering"
    target_disease: Optional[str] = "Pink Bollworm"

class PredictionResponse(BaseModel):
    village_id: str
    village_name: str
    crop_name: str
    disease_name: str
    outbreak_probability: float # 0.0 to 1.0
    risk_percentage: float # 0 to 100%
    risk_category: str # Low, Moderate, High, Critical
    confidence_range: List[float]
    top_contributing_factors: List[ContributingFactor]
    model_used: str
    model_version: str
    shap_summary: Dict[str, float]
    recommended_action: str

class VillageRiskAssessmentResponse(BaseModel):
    id: str
    village_id: str
    village_name: Optional[str]
    district_name: Optional[str]
    assessment_date: date
    overall_risk_score: float # 0-100%
    risk_category: str
    dominant_threat_disease: str
    weather_risk_score: float
    spatial_proximity_score: float
    crop_vulnerability_score: float
    key_drivers: List[str] = []
    recommended_action: Optional[str]

    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: str
    village_id: str
    village_name: Optional[str]
    district_name: Optional[str]
    crop: str
    suspected_disease: str
    risk_probability: float
    risk_category: str
    contributing_factors: List[str]
    recommended_inspection: str
    preventive_actions: str
    status: str # ACTIVE, ACKNOWLEDGED, RESOLVED
    alert_timestamp: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str # ACKNOWLEDGED, RESOLVED

class RecommendationResponse(BaseModel):
    id: str
    disease_name: Optional[str]
    growth_stage: str
    risk_category: str
    recommendation_type: str
    title: str
    guidance_text: str
    scientific_basis: str
    is_expert_reviewed: bool

    class Config:
        from_attributes = True

class MLModelVersionResponse(BaseModel):
    id: str
    model_name: str
    algorithm: str
    version: str
    precision_score: Optional[float]
    recall_score: Optional[float]
    f1_score: Optional[float]
    roc_auc: Optional[float]
    pr_auc: Optional[float]
    brier_score: Optional[float]
    is_active: bool
    feature_importances: Optional[Dict[str, float]] = None

    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    total_registered_farmers: int
    total_monitored_villages: int
    total_monitored_farms: int
    crops_under_monitoring: int
    active_disease_alerts: int
    high_risk_villages_count: int
    average_regional_risk_pct: float
    risk_category_distribution: Dict[str, int]
    disease_outbreak_trends: List[Dict[str, Any]]
    crop_wise_risk: List[Dict[str, Any]]
    weather_overview: Dict[str, Any]
    recent_farmer_reports: List[Dict[str, Any]]
