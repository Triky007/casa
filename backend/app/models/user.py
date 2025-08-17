from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    SUPERADMIN = "superadmin"  # Puede gestionar familias
    ADMIN = "admin"            # Administrador de familia
    USER = "user"              # Usuario regular de familia


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    role: UserRole = Field(default=UserRole.USER)
    credits: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relación con familia
    family_id: Optional[int] = Field(default=None, foreign_key="family.id")

    # Metadatos adicionales
    full_name: Optional[str] = None
    email: Optional[str] = None
