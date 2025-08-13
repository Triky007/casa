from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskCompletionPhotoResponse(BaseModel):
    id: int
    task_assignment_id: int
    filename: str
    original_filename: str
    file_path: str
    thumbnail_path: Optional[str]
    file_size: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PhotoUploadResponse(BaseModel):
    message: str
    photo_id: int
    filename: str
    file_size: int
    thumbnail_url: Optional[str] = None
    photo_url: str