from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    role: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: str = "OFFICER"

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    phone_number: Optional[str]
    role: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True
