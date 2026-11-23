from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.models.base import TimeStampedBase

class Crop(TimeStampedBase):
    __tablename__ = "crops"
    
    name = Column(String(100), unique=True, nullable=False, index=True) # Cotton, Soybean, etc.
    scientific_name = Column(String(150), nullable=True)
    category = Column(String(50), default="Fiber Crop")
    description = Column(Text, nullable=True)
    
    growth_stages = relationship("CropGrowthStage", back_populates="crop", cascade="all, delete-orphan")
    farms = relationship("Farm", back_populates="crop")
    diseases = relationship("Disease", back_populates="crop")

class CropGrowthStage(TimeStampedBase):
    __tablename__ = "crop_growth_stages"
    
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False)
    stage_name = Column(String(100), nullable=False) # Seedling, Vegetative, Squaring, Flowering, Boll Formation, Maturity
    stage_order = Column(Integer, nullable=False)
    duration_days = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    susceptibility_multiplier = Column(Float, default=1.0) # Relative vulnerability multiplier
    
    crop = relationship("Crop", back_populates="growth_stages")

class Disease(TimeStampedBase):
    __tablename__ = "diseases"
    
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False)
    name = Column(String(150), nullable=False, index=True) # Pink Bollworm, Cotton Leaf Curl, Bacterial Blight
    pathogen_type = Column(String(50), nullable=False) # Insect / Pest, Virus, Bacteria, Fungus
    optimal_temp_min = Column(Float, nullable=True) # Celsius
    optimal_temp_max = Column(Float, nullable=True)
    optimal_humidity_min = Column(Float, nullable=True) # Percentage
    description = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)
    
    crop = relationship("Crop", back_populates="diseases")
    reports = relationship("FarmerReport", back_populates="disease")
    incidents = relationship("DiseaseIncident", back_populates="disease")
    recommendations = relationship("Recommendation", back_populates="disease")

class AgriculturalOfficer(TimeStampedBase):
    __tablename__ = "agricultural_officers"
    
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    badge_number = Column(String(50), unique=True, nullable=False)
    jurisdiction_district = Column(String(100), nullable=False)
    department = Column(String(100), default="Department of Agriculture, Maharashtra")
    
    user = relationship("User", back_populates="officer_profile")
    verified_reports = relationship("FarmerReport", back_populates="reviewed_by_officer")

class Farmer(TimeStampedBase):
    __tablename__ = "farmers"
    
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=True)
    farmer_id_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    contact_number = Column(String(20), nullable=False)
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    total_land_area_ha = Column(Float, default=2.0)
    
    village = relationship("Village", back_populates="farmers")
    user = relationship("User", back_populates="farmer_profile")
    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")
    reports = relationship("FarmerReport", back_populates="farmer")

class Farm(TimeStampedBase):
    __tablename__ = "farms"
    
    farmer_id = Column(String(36), ForeignKey("farmers.id"), nullable=False)
    village_id = Column(String(36), ForeignKey("villages.id"), nullable=False)
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False)
    
    survey_number = Column(String(50), nullable=True)
    area_hectares = Column(Float, default=1.5)
    soil_type = Column(String(50), default="Black Cotton Soil (Regur)")
    current_growth_stage = Column(String(50), default="Flowering")
    sowing_date = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    farmer = relationship("Farmer", back_populates="farms")
    village = relationship("Village", back_populates="farms")
    crop = relationship("Crop", back_populates="farms")
