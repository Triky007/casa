from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .auth import UserResponse


class FamilyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    max_members: int = 10
    timezone: str = "UTC"


class FamilyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_members: Optional[int] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = None


class FamilyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    created_by: Optional[int]
    max_members: int
    timezone: str
    
    class Config:
        from_attributes = True


class FamilyWithMembersResponse(FamilyResponse):
    members: List[UserResponse] = []
    member_count: int = 0
    admin_count: int = 0
    user_count: int = 0


class FamilyAdminCreate(BaseModel):
    """Schema para crear un administrador de familia"""
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None


class FamilyStats(BaseModel):
    """Estadísticas de una familia"""
    total_members: int
    active_members: int
    total_tasks: int
    completed_tasks_today: int
    pending_tasks: int
    total_credits_earned: int
