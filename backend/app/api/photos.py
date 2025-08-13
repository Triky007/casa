from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, select
import os
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.task import TaskAssignment, TaskStatus
from ..models.task_completion_photo import TaskCompletionPhoto
from ..schemas.photo import TaskCompletionPhotoResponse, PhotoUploadResponse
from ..utils.file_handler import save_uploaded_file, create_thumbnail, delete_photo_files
from .auth import get_current_user
import os

router = APIRouter(prefix="/api/photos", tags=["photos"])


@router.post("/upload/{assignment_id}", response_model=PhotoUploadResponse)
async def upload_task_photo(
    assignment_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Subir foto para una asignación de tarea"""

    # Verificar que la asignación existe y pertenece al usuario
    assignment = session.get(TaskAssignment, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only upload photos for your own tasks"
        )

    # Verificar que la tarea esté completada
    if assignment.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only upload photos for completed tasks"
        )

    try:
        # Guardar archivo
        filename, web_path, file_size = await save_uploaded_file(file)

        # Crear thumbnail (necesitamos la ruta del sistema para crear el thumbnail)
        full_path = os.path.join("uploads/task-photos", filename)
        thumbnail_web_path = create_thumbnail(full_path, filename)

        # Guardar en base de datos
        photo = TaskCompletionPhoto(
            task_assignment_id=assignment_id,
            filename=filename,
            original_filename=file.filename,
            file_path=web_path,  # Ruta web relativa
            thumbnail_path=thumbnail_web_path,  # Ruta web del thumbnail
            file_size=file_size,
            mime_type=file.content_type
        )

        session.add(photo)
        session.commit()
        session.refresh(photo)

        # Construir URLs
        photo_url = web_path
        thumbnail_url = thumbnail_web_path

        return PhotoUploadResponse(
            message="Photo uploaded successfully",
            photo_id=photo.id,
            filename=filename,
            file_size=file_size,
            photo_url=photo_url,
            thumbnail_url=thumbnail_url
        )

    except Exception as e:
        # Limpiar archivos si algo sale mal
        if 'web_path' in locals():
            delete_photo_files(web_path, thumbnail_web_path if 'thumbnail_web_path' in locals() else None)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading photo: {str(e)}"
        )


@router.get("/assignment/{assignment_id}", response_model=List[TaskCompletionPhotoResponse])
async def get_assignment_photos(
    assignment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las fotos de una asignación de tarea"""

    # Verificar que la asignación existe
    assignment = session.get(TaskAssignment, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    # Los usuarios solo pueden ver sus propias fotos, los admins pueden ver todas
    if current_user.role != UserRole.ADMIN and assignment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view photos for your own tasks"
        )

    # Obtener fotos
    statement = select(TaskCompletionPhoto).where(
        TaskCompletionPhoto.task_assignment_id == assignment_id
    )
    photos = session.exec(statement).all()

    return photos


@router.get("/{photo_id}", response_model=TaskCompletionPhotoResponse)
async def get_photo(
    photo_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener información de una foto específica"""

    photo = session.get(TaskCompletionPhoto, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )

    # Verificar permisos
    assignment = session.get(TaskAssignment, photo.task_assignment_id)
    if current_user.role != UserRole.ADMIN and assignment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view photos for your own tasks"
        )

    return photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una foto (solo administradores)"""

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete photos"
        )

    photo = session.get(TaskCompletionPhoto, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )

    # Eliminar archivos del sistema
    delete_photo_files(photo.file_path, photo.thumbnail_path)

    # Eliminar de base de datos
    session.delete(photo)
    session.commit()