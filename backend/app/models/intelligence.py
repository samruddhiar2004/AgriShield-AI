from datetime import datetime, date
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, Boolean, DateTime, Date, JSON
from sqlalchemy.orm import relationship
from backend.app.models.base import TimeStampedBase

class MLModelVersion(TimeStampedBase):
    __tablename__ = "ml_model_versions"
    
    model_name = Column(String(100), nullable=False)
    algorithm = Column(String(50), nullable=False) # LogisticRegression, RandomForest, XGBoost
    version = Column(String(50), nullable=False, unique=True)
    
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    pr_auc = Column(Float, nullable=True)
    brier_score = Column(Float, nullable=True)
    
    model_file_path = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=False)
    hyperparameters = Column(JSON, nullable=True)
    feature_names = Column(JSON, nullable=True)

class PredictionRecord(TimeStampedBase):
    __tablename__ = "prediction_records"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    model_version_id = Column(String(36), ForeignKey("ml_model_versions.id"), nullable=True)
    crop_name = Column(String(100), default="Cotton", nullable=False)
    disease_name = Column(String(150), nullable=False)
    
    prediction_probability = Column(Float, nullable=False) # 0.0 to 1.0
    risk_category = Column(String(50), nullable=False) # Low, Moderate, High, Critical
    confidence_interval_low = Column(Float, nullable=True)
    confidence_interval_high = Column(Float, nullable=True)
    contributing_factors = Column(JSON, nullable=True) # SHAP values and top drivers
    
    prediction_date = Column(Date, default=date.today, nullable=False)

class VillageRiskAssessment(TimeStampedBase):
    __tablename__ = "village_risk_assessments"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    assessment_date = Column(Date, default=date.today, nullable=False, index=True)
    
    overall_risk_score = Column(Float, nullable=False) # 0 to 100%
    risk_category = Column(String(50), nullable=False) # Low, Moderate, High, Critical
    dominant_threat_disease = Column(String(150), nullable=False)
    
    weather_risk_score = Column(Float, default=0.0) # 0 to 100
    spatial_proximity_score = Column(Float, default=0.0) # 0 to 100
    crop_vulnerability_score = Column(Float, default=0.0) # 0 to 100
    
    key_drivers = Column(JSON, nullable=True) # Explanations
    recommended_action = Column(Text, nullable=True)
    
    village = relationship("Village", back_populates="risk_assessments")

class Alert(TimeStampedBase):
    __tablename__ = "alerts"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    crop = Column(String(100), default="Cotton", nullable=False)
    suspected_disease = Column(String(150), nullable=False)
    risk_probability = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False) # High, Critical
    
    contributing_factors = Column(JSON, nullable=True)
    recommended_inspection = Column(Text, nullable=False)
    preventive_actions = Column(Text, nullable=False)
    
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, ACKNOWLEDGED, RESOLVED
    alert_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    
    village = relationship("Village", back_populates="alerts")

class Recommendation(TimeStampedBase):
    __tablename__ = "recommendations"
    
    disease_id = Column(String(36), ForeignKey("diseases.id"), nullable=False)
    growth_stage = Column(String(50), nullable=False) # Vegetative, Flowering, Boll Formation, All
    risk_category = Column(String(50), nullable=False) # Low, Moderate, High, Critical
    recommendation_type = Column(String(50), nullable=False) # FIELD_INSPECTION, CULTURAL_PRACTICE, BIOCONTROL, SANITATION
    
    title = Column(String(200), nullable=False)
    guidance_text = Column(Text, nullable=False)
    scientific_basis = Column(String(255), default="ICAR-CICR Cotton Protection Advisory Guidelines")
    is_expert_reviewed = Column(Boolean, default=True)
    
    disease = relationship("Disease", back_populates="recommendations")
