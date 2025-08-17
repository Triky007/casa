from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str


class FamilyBasicInfo(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    timezone: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str
    family_id: Optional[int] = None  # Opcional para superadmins


class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.USER
    credits: Optional[int] = 0
    family_id: Optional[int] = None
    full_name: Optional[str] = None
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    credits: int
    is_active: bool
    family_id: Optional[int]
    full_name: Optional[str]
    email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    family: Optional[FamilyBasicInfo] = None
