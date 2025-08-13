from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class TaskCompletionPhoto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_assignment_id: int = Field(foreign_key="taskassignment.id")
    filename: str  # Nombre del archivo en el sistema
    original_filename: str  # Nombre original del archivo subido
    file_path: str  # Ruta web relativa (ej: /uploads/task-photos/file.jpg)
    thumbnail_path: Optional[str] = None  # Ruta web del thumbnail
    file_size: int  # Tamaño del archivo en bytes
    mime_type: str  # Tipo MIME del archivo (image/jpeg, image/png, etc.)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        table_name = "task_completion_photo"