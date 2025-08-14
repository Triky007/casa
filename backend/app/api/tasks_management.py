from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session, select, func
from datetime import datetime, date
import os
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.task import Task, TaskAssignment, TaskStatus, TaskType, TaskPeriodicity
from ..models.task_completion_photo import TaskCompletionPhoto
from ..schemas.task import TaskAssignmentResponse, TaskAssignmentUpdate, UserBasicInfo, TaskResponse
from ..schemas.photo import TaskCompletionPhotoResponse
from ..utils.file_handler import save_uploaded_file, create_thumbnail, delete_photo_files
from .auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks-management"])


def build_assignment_response(assignment: TaskAssignment, session: Session) -> TaskAssignmentResponse:
    """Helper function to build TaskAssignmentResponse with related data"""
    assignment_dict = assignment.dict()
    
    # Get task details
    task = session.get(Task, assignment.task_id)
    assignment_dict['task'] = task.dict() if task else None
    
    # Get user details
    user = session.get(User, assignment.user_id)
    assignment_dict['user'] = UserBasicInfo(id=user.id, username=user.username).dict() if user else None
    
    # Get photos
    photos_statement = select(TaskCompletionPhoto).where(TaskCompletionPhoto.task_assignment_id == assignment.id)
    photos = session.exec(photos_statement).all()
    assignment_dict['photos'] = [photo.dict() for photo in photos] if photos else []

    return TaskAssignmentResponse(**assignment_dict)


@router.post("/assign/{task_id}", response_model=TaskAssignmentResponse)
async def assign_task(
    task_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Asignar una tarea a un usuario para hoy"""
    # Get the task
    task = session.get(Task, task_id)
    if not task or not task.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or inactive"
        )
    
    today = date.today()
    
    # Check if user already has this task assigned for today
    existing_assignment = session.exec(
        select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == current_user.id,
            TaskAssignment.scheduled_date == today
        )
    ).first()
    
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task already assigned for today"
        )
    
    # For collective tasks, check if there's already an assignment for today
    if task.task_type == TaskType.COLLECTIVE:
        collective_assignment = session.exec(
            select(TaskAssignment).where(
                TaskAssignment.task_id == task_id,
                TaskAssignment.scheduled_date == today
            )
        ).first()
        
        if collective_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Collective task already assigned for today"
            )
    
    # For individual tasks, check if user already has an individual task for today
    if task.task_type == TaskType.INDIVIDUAL:
        individual_assignment = session.exec(
            select(TaskAssignment).join(Task).where(
                TaskAssignment.user_id == current_user.id,
                TaskAssignment.scheduled_date == today,
                Task.task_type == TaskType.INDIVIDUAL
            )
        ).first()
        
        if individual_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an individual task assigned for today"
            )
    
    # Create the assignment
    assignment = TaskAssignment(
        task_id=task_id,
        user_id=current_user.id,
        scheduled_date=today,
        status=TaskStatus.PENDING
    )
    
    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return build_assignment_response(assignment, session)


@router.get("/assignments", response_model=List[TaskAssignmentResponse])
async def get_user_assignments(
    from_date: str | None = None,
    to_date: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener las asignaciones del usuario actual"""
    statement = select(TaskAssignment).where(TaskAssignment.user_id == current_user.id)
    
    # Apply date filters if provided
    if from_date:
        try:
            from_date_obj = datetime.strptime(from_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date >= from_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format. Use YYYY-MM-DD")
    
    if to_date:
        try:
            to_date_obj = datetime.strptime(to_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date <= to_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format. Use YYYY-MM-DD")
    
    assignments = session.exec(statement).all()
    
    response_assignments = []
    for assignment in assignments:
        response_assignments.append(build_assignment_response(assignment, session))

    return response_assignments


@router.get("/assignments/all", response_model=List[TaskAssignmentResponse])
async def get_all_assignments(
    from_date: str | None = None,
    to_date: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las asignaciones - solo administradores"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all assignments"
        )
    
    statement = select(TaskAssignment)
    
    # Apply date filters if provided
    if from_date:
        try:
            from_date_obj = datetime.strptime(from_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date >= from_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format. Use YYYY-MM-DD")
    
    if to_date:
        try:
            to_date_obj = datetime.strptime(to_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date <= to_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format. Use YYYY-MM-DD")
    
    assignments = session.exec(statement).all()
    
    response_assignments = []
    for assignment in assignments:
        response_assignments.append(build_assignment_response(assignment, session))

    return response_assignments


@router.patch("/complete/{assignment_id}", response_model=TaskAssignmentResponse)
async def complete_task(
    assignment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Marcar una tarea como completada"""
    assignment = session.get(TaskAssignment, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only complete your own tasks"
        )

    if assignment.status != TaskStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not in pending status"
        )

    assignment.status = TaskStatus.COMPLETED
    assignment.completed_at = datetime.utcnow()

    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return build_assignment_response(assignment, session)


@router.post("/complete-with-photo/{assignment_id}", response_model=TaskAssignmentResponse)
async def complete_task_with_photo(
    assignment_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Completar una tarea subiendo una foto como evidencia"""
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
            detail="Can only complete your own tasks"
        )

    if assignment.status != TaskStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not in pending status"
        )

    try:
        # Guardar el archivo
        file_info = await save_uploaded_file(file, "task-photos")

        # Crear thumbnail
        thumbnail_path = await create_thumbnail(file_info["file_path"], "task-photos/thumbnails")

        # Crear registro en la base de datos
        photo = TaskCompletionPhoto(
            task_assignment_id=assignment_id,
            filename=file_info["filename"],
            original_filename=file.filename,
            file_path=file_info["web_path"],
            thumbnail_path=thumbnail_path,
            file_size=file_info["file_size"],
            mime_type=file.content_type
        )

        session.add(photo)

        # Marcar la tarea como completada
        assignment.status = TaskStatus.COMPLETED
        assignment.completed_at = datetime.utcnow()
        session.add(assignment)

        session.commit()
        session.refresh(assignment)

        return build_assignment_response(assignment, session)

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing task with photo: {str(e)}"
        )
