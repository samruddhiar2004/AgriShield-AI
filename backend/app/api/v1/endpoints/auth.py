from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.users import User, Role
from backend.app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from backend.app.schemas.auth import Token, LoginRequest, UserCreate, UserResponse

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT access token.
    """
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    role_name = user.role.name if user.role else "OFFICER"
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        role=role_name
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user profile.
    """
    role_name = current_user.role.name if current_user.role else "OFFICER"
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        role=role_name,
        is_active=current_user.is_active
    )

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (Officer, Farmer, or Researcher).
    """
    existing_user = db.query(User).filter((User.email == user_in.email) | (User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email or username already exists")

    target_role = db.query(Role).filter(Role.name == user_in.role.upper()).first()
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        role_id=target_role.id if target_role else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        phone_number=new_user.phone_number,
        role=target_role.name if target_role else "OFFICER",
        is_active=new_user.is_active
    )
