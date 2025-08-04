from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from enum import Enum


class TaskType(str, Enum):
    INDIVIDUAL = "individual"
    COLLECTIVE = "collective"


class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    APPROVED = "approved"
    REJECTED = "rejected"


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    credits: int
    task_type: TaskType = Field(default=TaskType.INDIVIDUAL)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TaskAssignment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    user_id: int = Field(foreign_key="user.id")
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    completed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
