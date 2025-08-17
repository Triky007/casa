from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.task import Task, TaskAssignment
from ..schemas.task import TaskCreate, TaskResponse, TaskUpdate
from .auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks-crud"])


def validate_family_access_for_tasks(current_user: User, session: Session, task_id: int = None):
    """Validar acceso a tareas basado en familia"""
    # Superadmins tienen acceso a todo
    if current_user.role == UserRole.SUPERADMIN:
        return True

    # Para usuarios regulares y admins, solo pueden ver tareas de su familia
    # Esto se implementa filtrando por usuarios de la misma familia
    return True  # La validación real se hace en las consultas


def require_admin_or_superadmin(current_user: User = Depends(get_current_user)):
    """Middleware para requerir permisos de admin o superadmin"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Obtener todas las tareas activas - filtradas por familia"""
    if current_user.role == UserRole.SUPERADMIN:
        # Superadmins ven todas las tareas
        statement = select(Task).where(Task.is_active == True)
    else:
        # Admins y usuarios solo ven tareas de su familia
        statement = select(Task).where(
            Task.is_active == True,
            Task.family_id == current_user.family_id
        )

    tasks = session.exec(statement).all()
    return tasks


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Crear una nueva tarea - solo administradores y superadmins"""
    task_dict = task_data.dict()

    # Asignar familia automáticamente si no se especifica
    if task_dict.get('family_id') is None and current_user.role == UserRole.ADMIN:
        task_dict['family_id'] = current_user.family_id

    task = Task(**task_dict)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Actualizar una tarea completamente - solo administradores y superadmins"""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Validar que la tarea pertenece a la familia del admin (excepto superadmins)
    if current_user.role != UserRole.SUPERADMIN:
        if task.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta tarea"
            )

    # Update all fields
    for field, value in task_data.dict().items():
        setattr(task, field, value)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def patch_task(
    task_id: int,
    task_data: TaskUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Actualizar una tarea parcialmente - solo administradores y superadmins"""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Validar acceso a la tarea
    if current_user.role != UserRole.SUPERADMIN:
        if task.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta tarea"
            )

    # Update only provided fields
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Eliminar una tarea (soft delete) - solo administradores y superadmins"""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Validar acceso a la tarea
    if current_user.role != UserRole.SUPERADMIN:
        if task.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta tarea"
            )

    # Soft delete - mark as inactive instead of deleting
    task.is_active = False
    session.add(task)
    session.commit()
