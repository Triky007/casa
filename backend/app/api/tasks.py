from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.task import Task, TaskAssignment, TaskStatus
from ..schemas.task import TaskCreate, TaskResponse, TaskAssignmentResponse, TaskAssignmentUpdate, TaskUpdate
from .auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(Task).where(Task.is_active == True)
    tasks = session.exec(statement).all()
    return tasks


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create tasks"
        )
    
    task = Task(**task_data.dict())
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update tasks"
        )

    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Update task fields
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
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update tasks"
        )

    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
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
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete tasks"
        )
    
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Instead of hard delete, set as inactive
    task.is_active = False
    session.add(task)
    session.commit()


@router.post("/assign/{task_id}", response_model=TaskAssignmentResponse)
async def assign_task(
    task_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check if user is admin (admins cannot assign tasks to themselves)
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot assign tasks to themselves"
        )
    
    # Check if task exists
    task = session.get(Task, task_id)
    if not task or not task.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Para tareas diarias: limitar por día (scheduled_date)
    today = datetime.utcnow().date()

    # Para tareas individuales, permitir múltiples asignaciones a diferentes usuarios
    # Para tareas colectivas, verificar si ya está asignada ese día
    if task.task_type == "collective":
        # Verificar si la tarea colectiva ya está asignada a cualquier usuario hoy
        statement = select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.scheduled_date == today,
            TaskAssignment.status.in_([TaskStatus.PENDING, TaskStatus.COMPLETED])
        )
        existing_assignment = session.exec(statement).first()
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta tarea colectiva ya está asignada hoy a un usuario"
            )
    else:  # Tarea individual
        # Solo verificar si el mismo usuario ya tiene esta tarea asignada hoy
        statement = select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == current_user.id,
            TaskAssignment.scheduled_date == today,
            TaskAssignment.status.in_([TaskStatus.PENDING, TaskStatus.COMPLETED])
        )
        existing_assignment = session.exec(statement).first()
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya tienes esta tarea asignada hoy"
            )

    assignment = TaskAssignment(task_id=task_id, user_id=current_user.id, scheduled_date=today)
    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return assignment


@router.get("/assignments", response_model=List[TaskAssignmentResponse])
async def get_user_assignments(
    from_date: str | None = None,
    to_date: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(TaskAssignment).where(TaskAssignment.user_id == current_user.id)
    # Apply date filters if provided (YYYY-MM-DD)
    if from_date:
        try:
            fd = datetime.strptime(from_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date >= fd)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format, expected YYYY-MM-DD")
    if to_date:
        try:
            td = datetime.strptime(to_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date <= td)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format, expected YYYY-MM-DD")

    assignments = session.exec(statement).all()

    # Create response objects with task data
    response_assignments = []
    for assignment in assignments:
        task = session.get(Task, assignment.task_id)
        assignment_dict = assignment.dict()
        assignment_dict['task'] = task.dict() if task else None
        response_assignments.append(TaskAssignmentResponse(**assignment_dict))

    return response_assignments


@router.get("/assignments/all", response_model=List[TaskAssignmentResponse])
async def get_all_assignments(
    from_date: str | None = None,
    to_date: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all task assignments - only for administrators"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all assignments"
        )

    statement = select(TaskAssignment)
    # Apply date filters if provided
    if from_date:
        try:
            fd = datetime.strptime(from_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date >= fd)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format, expected YYYY-MM-DD")
    if to_date:
        try:
            td = datetime.strptime(to_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date <= td)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format, expected YYYY-MM-DD")

    assignments = session.exec(statement).all()

    # Create response objects with task and user data
    response_assignments = []
    for assignment in assignments:
        task = session.get(Task, assignment.task_id)
        user = session.get(User, assignment.user_id)
        assignment_dict = assignment.dict()
        assignment_dict['task'] = task.dict() if task else None
        assignment_dict['user'] = {
            'id': user.id,
            'username': user.username
        } if user else None
        response_assignments.append(TaskAssignmentResponse(**assignment_dict))

    return response_assignments


@router.patch("/complete/{assignment_id}", response_model=TaskAssignmentResponse)
async def complete_task(
    assignment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
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
    return assignment


@router.patch("/approve/{assignment_id}", response_model=TaskAssignmentResponse)
async def approve_task(
    assignment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
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
    
    # Get task to award credits
    task = session.get(Task, assignment.task_id)
    user = session.get(User, assignment.user_id)
    
    assignment.status = TaskStatus.APPROVED
    assignment.approved_at = datetime.utcnow()
    assignment.approved_by = current_user.id
    
    # Award credits to user
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
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view pending approvals"
        )

    statement = select(TaskAssignment).where(TaskAssignment.status == TaskStatus.COMPLETED)
    # Apply date filters if provided
    if from_date:
        try:
            fd = datetime.strptime(from_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date >= fd)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format, expected YYYY-MM-DD")
    if to_date:
        try:
            td = datetime.strptime(to_date, "%Y-%m-%d").date()
            statement = statement.where(TaskAssignment.scheduled_date <= td)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format, expected YYYY-MM-DD")

    assignments = session.exec(statement).all()

    # Load task data for each assignment
    for assignment in assignments:
        assignment.task = session.get(Task, assignment.task_id)

    return assignments


@router.post("/reset-all")
async def reset_all_tasks(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Reset all task assignments - only for administrators"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can reset tasks"
        )

    # Delete all task assignments to make tasks available again
    statement = select(TaskAssignment)
    assignments = session.exec(statement).all()

    for assignment in assignments:
        session.delete(assignment)

    session.commit()

    return {"message": f"Successfully reset {len(assignments)} task assignments"}


@router.get("/stats/daily")
async def get_daily_stats(
    from_date: str | None = None,
    to_date: str | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Return counts per status in a date range (scheduled_date). Admin only."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only administrators can view stats")

    # Default to today if not provided
    if not from_date and not to_date:
        today = datetime.utcnow().date()
        from_dt = to_dt = today
    else:
        try:
            from_dt = datetime.strptime(from_date or to_date, "%Y-%m-%d").date()
            to_dt = datetime.strptime(to_date or from_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    statement = select(TaskAssignment).where(
        TaskAssignment.scheduled_date >= from_dt,
        TaskAssignment.scheduled_date <= to_dt,
    )
    assignments = session.exec(statement).all()

    counts = {s: 0 for s in [
        TaskStatus.PENDING.value,
        TaskStatus.COMPLETED.value,
        TaskStatus.APPROVED.value,
        TaskStatus.REJECTED.value,
    ]}
    for a in assignments:
        counts[a.status.value] = counts.get(a.status.value, 0) + 1

    return {
        "from_date": from_dt.isoformat(),
        "to_date": to_dt.isoformat(),
        "total": len(assignments),
        "pending": counts[TaskStatus.PENDING.value],
        "completed": counts[TaskStatus.COMPLETED.value],
        "approved": counts[TaskStatus.APPROVED.value],
        "rejected": counts[TaskStatus.REJECTED.value],
    }
