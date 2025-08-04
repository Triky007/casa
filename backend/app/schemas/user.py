from pydantic import BaseModel
from typing import Optional
from ..models.user import UserRole


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    credits: Optional[int] = None
    is_active: Optional[bool] = None


class UserStats(BaseModel):
    total_tasks_completed: int
    total_credits_earned: int
    pending_tasks: int
    approved_tasks: int
    rejected_tasks: int
