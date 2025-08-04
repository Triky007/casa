from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.task import TaskAssignment, TaskStatus
from ..schemas.auth import UserResponse
from ..schemas.user import UserUpdate, UserStats
from .auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    update_data = user_update.dict(exclude_unset=True)
    
    # Only admins can update role and credits
    if current_user.role != UserRole.ADMIN:
        update_data.pop("role", None)
        update_data.pop("credits", None)
        update_data.pop("is_active", None)
    
    # Hash password if provided
    if "password" in update_data:
        from ..core.security import get_password_hash
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Users can only see their own stats, admins can see anyone's
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own statistics"
        )
    
    # Check if user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Calculate statistics
    total_tasks_completed = session.exec(
        select(func.count(TaskAssignment.id)).where(
            TaskAssignment.user_id == user_id,
            TaskAssignment.status == TaskStatus.APPROVED
        )
    ).first() or 0
    
    pending_tasks = session.exec(
        select(func.count(TaskAssignment.id)).where(
            TaskAssignment.user_id == user_id,
            TaskAssignment.status == TaskStatus.PENDING
        )
    ).first() or 0
    
    approved_tasks = session.exec(
        select(func.count(TaskAssignment.id)).where(
            TaskAssignment.user_id == user_id,
            TaskAssignment.status == TaskStatus.APPROVED
        )
    ).first() or 0
    
    rejected_tasks = session.exec(
        select(func.count(TaskAssignment.id)).where(
            TaskAssignment.user_id == user_id,
            TaskAssignment.status == TaskStatus.REJECTED
        )
    ).first() or 0
    
    return UserStats(
        total_tasks_completed=total_tasks_completed,
        total_credits_earned=user.credits,
        pending_tasks=pending_tasks,
        approved_tasks=approved_tasks,
        rejected_tasks=rejected_tasks
    )


@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all users"
        )
    
    statement = select(User).where(User.is_active == True)
    users = session.exec(statement).all()
    return users
