from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.task import TaskAssignment, TaskStatus, Task
from ..schemas.auth import UserResponse, UserCreate
from ..schemas.user import UserUpdate, UserStats, PasswordChange
from .auth import get_current_user
from ..core.security import get_password_hash, verify_password

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/{user_id}/change-password", status_code=status.HTTP_200_OK)
async def change_user_password(
    user_id: int,
    password_change: PasswordChange,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verificar si el usuario tiene permisos para cambiar esta contraseña
    # Los administradores pueden cambiar cualquier contraseña, los usuarios solo la suya
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para cambiar esta contraseña"
        )

    # Obtener el usuario cuya contraseña se va a cambiar
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Si es el propio usuario cambiando su contraseña, verificar la contraseña actual
    if current_user.id == user_id:
        if not verify_password(password_change.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta"
            )

    # Actualizar la contraseña
    user.password_hash = get_password_hash(password_change.new_password)
    session.add(user)
    session.commit()

    return {"message": "Contraseña actualizada correctamente"}


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
    
    # Calcular el total de créditos ganados históricamente sumando los créditos de las tareas aprobadas
    total_credits_earned = session.exec(
        select(func.sum(Task.credits)).join(TaskAssignment).where(
            TaskAssignment.user_id == user_id,
            TaskAssignment.status == TaskStatus.APPROVED,
            TaskAssignment.task_id == Task.id
        )
    ).first() or 0
    
    return UserStats(
        total_tasks_completed=total_tasks_completed,
        total_credits_earned=total_credits_earned,
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
    
    # Mostrar todos los usuarios, incluso inactivos, para que el admin pueda gestionarlos
    statement = select(User)
    users = session.exec(statement).all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create users"
        )
    
    # Check if username already exists
    existing_user = session.exec(select(User).where(User.username == user_create.username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    password_hash = get_password_hash(user_create.password)
    
    new_user = User(
        username=user_create.username,
        password_hash=password_hash,
        role=user_create.role,
        credits=user_create.credits if user_create.credits is not None else 0,
        is_active=True
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update users"
        )

    # Get user to update
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update user fields
    update_data = user_update.dict(exclude_unset=True)

    # Hash password if provided
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def patch_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update users"
        )

    # Get user to update
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update user fields
    update_data = user_update.dict(exclude_unset=True)

    # Hash password if provided
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Get user to delete
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user
    session.delete(user)
    session.commit()
    return None
