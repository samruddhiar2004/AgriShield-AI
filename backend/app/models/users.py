from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.models.base import TimeStampedBase

class Role(TimeStampedBase):
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, nullable=False, index=True) # ADMIN, OFFICER, FARMER, RESEARCHER
    description = Column(String(255), nullable=True)
    
    users = relationship("User", back_populates="role")

class User(TimeStampedBase):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=True)
    role = relationship("Role", back_populates="users")
    
    officer_profile = relationship("AgriculturalOfficer", back_populates="user", uselist=False)
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False)
