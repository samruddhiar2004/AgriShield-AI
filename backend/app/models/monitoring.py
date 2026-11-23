from datetime import date
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, Boolean, Date
from sqlalchemy.orm import relationship
from backend.app.models.base import TimeStampedBase

class WeatherObservation(TimeStampedBase):
    __tablename__ = "weather_observations"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    observation_date = Column(Date, default=date.today, nullable=False, index=True)
    
    temperature_c = Column(Float, nullable=False)
    relative_humidity_pct = Column(Float, nullable=False)
    rainfall_mm = Column(Float, default=0.0, nullable=False)
    wind_speed_kmh = Column(Float, default=10.0)
    solar_radiation = Column(Float, nullable=True)
    
    # Calculated rolling features
    temp_avg_3d = Column(Float, nullable=True)
    temp_avg_7d = Column(Float, nullable=True)
    humidity_avg_3d = Column(Float, nullable=True)
    humidity_avg_7d = Column(Float, nullable=True)
    cumulative_rainfall_7d = Column(Float, nullable=True)
    conducive_weather_index = Column(Float, nullable=True) # 0 to 1 index of disease suitability
    
    village = relationship("Village", back_populates="weather_observations")

class FarmerReport(TimeStampedBase):
    __tablename__ = "farmer_reports"
    
    farmer_id = Column(String(36), ForeignKey("farmers.id"), nullable=False, index=True)
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    crop_name = Column(String(100), default="Cotton", nullable=False)
    suspected_disease_id = Column(String(36), ForeignKey("diseases.id"), nullable=True)
    crop_growth_stage = Column(String(100), nullable=False) # Vegetative, Flowering, Boll Formation, etc.
    observation_date = Column(Date, default=date.today, nullable=False)
    
    symptoms = Column(Text, nullable=False)
    affected_plants_pct = Column(Float, default=5.0) # Percentage of plants affected
    severity = Column(String(50), default="Moderate") # Low, Moderate, High, Severe
    image_url = Column(String(500), nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, VERIFIED, REJECTED
    officer_review_notes = Column(Text, nullable=True)
    reviewed_by_id = Column(String(36), ForeignKey("agricultural_officers.id"), nullable=True)
    
    farmer = relationship("Farmer", back_populates="reports")
    village = relationship("Village", back_populates="farmer_reports")
    disease = relationship("Disease", back_populates="reports")
    reviewed_by_officer = relationship("AgriculturalOfficer", back_populates="verified_reports")

class DiseaseIncident(TimeStampedBase):
    __tablename__ = "disease_incidents"
    
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False, index=True)
    disease_id = Column(String(36), ForeignKey("diseases.id"), nullable=False, index=True)
    incident_date = Column(Date, default=date.today, nullable=False)
    severity_level = Column(String(50), default="Moderate") # Low, Moderate, High, Outbreak
    affected_area_ha = Column(Float, default=10.0)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    village = relationship("Village", back_populates="disease_incidents")
    disease = relationship("Disease", back_populates="incidents")
