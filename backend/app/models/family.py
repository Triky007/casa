from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class Family(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")  # Superadmin que la creó
    
    # Configuración de la familia
    max_members: int = Field(default=10)  # Límite de miembros
    timezone: str = Field(default="UTC")  # Zona horaria de la familia
