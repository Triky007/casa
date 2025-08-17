from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from datetime import datetime, date
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.task import Task, TaskAssignment, TaskStatus
from ..models.task_completion_photo import TaskCompletionPhoto
from ..schemas.task import TaskAssignmentResponse, UserBasicInfo
from ..utils.file_handler import delete_photo_files
from .auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks-admin"])


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


@router.patch("/approve/{assignment_id}", response_model=TaskAssignmentResponse)
async def approve_task(
    assignment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Aprobar una tarea completada - solo administradores"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can approve tasks"
        )

    assignment = session.get(TaskAssignment, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task must be completed before approval"
        )

    # Update assignment status
    assignment.status = TaskStatus.APPROVED
    assignment.approved_at = datetime.utcnow()
    assignment.approved_by = current_user.id

    # Award credits to user
    user = session.get(User, assignment.user_id)
    task = session.get(Task, assignment.task_id)
    if user and task:
        user.credits += task.credits

    session.add(assignment)
    session.add(user)
    session.commit()
    session.refresh(assignment)
    return assignment


@router.patch("/reject/{assignment_id}", response_model=TaskAssignmentResponse)
async def reject_task(
    assignment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Rechazar una tarea completada - solo administradores"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can reject tasks"
        )

    assignment = session.get(TaskAssignment, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task must be completed before rejection"
        )

    assignment.status = TaskStatus.REJECTED
    assignment.approved_at = datetime.utcnow()
    assignment.approved_by = current_user.id

    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return assignment


@router.get("/pending-approvals", response_model=List[TaskAssignmentResponse])
async def get_pending_approvals(
    from_date: str | None = None,
    to_date: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener tareas pendientes de aprobación - solo administradores y superadmins"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view pending approvals"
        )

    # Base query para tareas completadas
    statement = select(TaskAssignment).where(TaskAssignment.status == TaskStatus.COMPLETED)

    # Filtrar por familia para admins regulares
    if current_user.role == UserRole.ADMIN:
        # Admins solo ven aprobaciones de su familia
        statement = statement.join(User, TaskAssignment.user_id == User.id).where(
            User.family_id == current_user.family_id
        )
    # Superadmins ven todas las aprobaciones (no agregar filtro)
    
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
    
    # Add task details to each assignment
    for assignment in assignments:
        assignment.task = session.get(Task, assignment.task_id)

    return assignments


@router.post("/reset-all")
async def reset_all_tasks(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Resetear todas las asignaciones de tareas - solo administradores"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can reset tasks"
        )

    # First, delete all photos associated with task assignments
    photos_statement = select(TaskCompletionPhoto)
    photos = session.exec(photos_statement).all()

    # Delete photo files from filesystem
    for photo in photos:
        try:
            delete_photo_files(photo.file_path, photo.thumbnail_path)
        except Exception as e:
            print(f"Warning: Could not delete photo files for photo {photo.id}: {e}")

    # Delete all photos from database
    for photo in photos:
        session.delete(photo)

    # Delete all task assignments
    assignments_statement = select(TaskAssignment)
    assignments = session.exec(assignments_statement).all()
    
    for assignment in assignments:
        session.delete(assignment)

    session.commit()

    return {"message": f"Successfully reset {len(assignments)} task assignments and deleted {len(photos)} photos"}


@router.get("/stats/daily")
async def get_daily_stats(
    from_date: str | None = None,
    to_date: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas diarias de tareas - solo administradores"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view daily stats"
        )

    # Default to today if no dates provided
    if not from_date:
        from_date = date.today().strftime("%Y-%m-%d")
    if not to_date:
        to_date = date.today().strftime("%Y-%m-%d")

    try:
        from_date_obj = datetime.strptime(from_date, "%Y-%m-%d").date()
        to_date_obj = datetime.strptime(to_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Get stats for the date range
    stats_query = select(
        TaskAssignment.scheduled_date,
        TaskAssignment.status,
        func.count(TaskAssignment.id).label('count')
    ).where(
        TaskAssignment.scheduled_date >= from_date_obj,
        TaskAssignment.scheduled_date <= to_date_obj
    ).group_by(
        TaskAssignment.scheduled_date,
        TaskAssignment.status
    ).order_by(TaskAssignment.scheduled_date)

    results = session.exec(stats_query).all()

    # Organize results by date
    daily_stats = {}
    for result in results:
        date_str = result.scheduled_date.strftime("%Y-%m-%d")
        if date_str not in daily_stats:
            daily_stats[date_str] = {
                "date": date_str,
                "pending": 0,
                "completed": 0,
                "approved": 0,
                "rejected": 0,
                "total": 0
            }

        status_key = result.status.value.lower()
        daily_stats[date_str][status_key] = result.count
        daily_stats[date_str]["total"] += result.count

    return {
        "from_date": from_date,
        "to_date": to_date,
        "daily_stats": list(daily_stats.values())
    }
