from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from typing import Optional
import os
from ..core.database import get_session
from ..core.security import verify_password, get_password_hash, create_access_token, verify_token
from ..models.user import User
from ..schemas.auth import Token, UserLogin, UserCreate, UserResponse

router = APIRouter(prefix="/api/user", tags=["user"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/login")


async def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
    token: Optional[str] = Depends(oauth2_scheme),
    auth_token: Optional[str] = Cookie(None, alias="auth_token")
):
    # Try to get token from cookie first, then from Authorization header
    access_token = auth_token or token

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(access_token)
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})

    # Set secure HTTP-only cookie
    # Use different settings for development vs production
    is_production = os.getenv("ENVIRONMENT", "development") == "production"

    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=is_production,  # Only secure in HTTPS (production)
        samesite="none" if is_production else "lax",  # None for production, Lax for development
        max_age=1800,  # 30 minutes (same as token expiry)
        path="/"
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, session: Session = Depends(get_session)):
    # Check if user already exists
    statement = select(User).where(User.username == user_data.username)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        password_hash=hashed_password,
        role=user_data.role
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing the auth cookie"""
    is_production = os.getenv("ENVIRONMENT", "development") == "production"

    response.delete_cookie(
        key="auth_token",
        path="/",
        secure=is_production,
        samesite="none" if is_production else "lax"
    )
    return {"message": "Successfully logged out"}
