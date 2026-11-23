from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.models.base import TimeStampedBase

class District(TimeStampedBase):
    __tablename__ = "districts"
    
    name = Column(String(100), unique=True, nullable=False, index=True)
    state = Column(String(100), default="Maharashtra", nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    villages = relationship("Village", back_populates="district", cascade="all, delete-orphan")

class Village(TimeStampedBase):
    __tablename__ = "villages"
    
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    district_id = Column(String(36), ForeignKey("districts.id"), nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True, default=320.0)
    total_cultivated_area_ha = Column(Float, nullable=True, default=1250.0)
    cotton_cultivated_area_ha = Column(Float, nullable=True, default=850.0)
    
    district = relationship("District", back_populates="villages")
    farms = relationship("Farm", back_populates="village")
    farmers = relationship("Farmer", back_populates="village")
    weather_observations = relationship("WeatherObservation", back_populates="village")
    farmer_reports = relationship("FarmerReport", back_populates="village")
    disease_incidents = relationship("DiseaseIncident", back_populates="village")
    risk_assessments = relationship("VillageRiskAssessment", back_populates="village")
    alerts = relationship("Alert", back_populates="village")
