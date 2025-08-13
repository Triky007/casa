from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from ..models.task import TaskType, TaskStatus, TaskPeriodicity


class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = None
    credits: int
    task_type: TaskType = TaskType.INDIVIDUAL
    periodicity: TaskPeriodicity = TaskPeriodicity.DAILY


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    task_type: Optional[TaskType] = None
    periodicity: Optional[TaskPeriodicity] = None
    is_active: Optional[bool] = None


class TaskResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    credits: int
    task_type: TaskType
    periodicity: TaskPeriodicity
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserBasicInfo(BaseModel):
    id: int
    username: str


class TaskAssignmentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    status: TaskStatus
    scheduled_date: date
    completed_at: Optional[datetime]
    approved_at: Optional[datetime]
    approved_by: Optional[int]
    created_at: datetime
    task: Optional[TaskResponse] = None
    user: Optional[UserBasicInfo] = None
    
    class Config:
        from_attributes = True


class TaskAssignmentUpdate(BaseModel):
    status: TaskStatus
