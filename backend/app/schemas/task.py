from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.task import TaskType, TaskStatus, TaskPeriodicity


class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = None
    credits: int
    task_type: TaskType = TaskType.INDIVIDUAL
    periodicity: TaskPeriodicity = TaskPeriodicity.DAILY


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
