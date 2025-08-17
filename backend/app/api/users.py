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


def validate_family_access(current_user: User, target_user: User = None, target_family_id: int = None):
    """Validar que el usuario tenga acceso a la familia especificada"""
    # Superadmins tienen acceso a todo
    if current_user.role == UserRole.SUPERADMIN:
        return True

    # Determinar la familia objetivo
    family_id = target_family_id if target_family_id is not None else (target_user.family_id if target_user else None)

    # Usuarios deben pertenecer a la misma familia
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a datos de otras familias"
        )

    return True


def require_admin_or_superadmin(current_user: User = Depends(get_current_user)):
    """Middleware para requerir permisos de admin o superadmin"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user


@router.post("/{user_id}/change-password", status_code=status.HTTP_200_OK)
async def change_user_password(
    user_id: int,
    password_change: PasswordChange,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Obtener el usuario cuya contraseña se va a cambiar
    target_user = session.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Validar acceso a la familia
    validate_family_access(current_user, target_user)

    # Verificar permisos específicos
    # Los administradores pueden cambiar contraseñas de su familia, los usuarios solo la suya
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para cambiar esta contraseña"
        )
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
    # Check if user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validar acceso a la familia
    validate_family_access(current_user, user)

    # Users can only see their own stats, admins can see stats of their family
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own statistics"
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
    current_user: User = Depends(require_admin_or_superadmin)
):
    # Superadmins ven todos los usuarios, admins solo de su familia
    if current_user.role == UserRole.SUPERADMIN:
        statement = select(User)
    else:
        # Admins solo ven usuarios de su familia
        statement = select(User).where(User.family_id == current_user.family_id)

    users = session.exec(statement).all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin_or_superadmin)
):
    # Validar familia si se especifica
    target_family_id = user_create.family_id
    if target_family_id is None and current_user.role == UserRole.ADMIN:
        # Si es admin y no especifica familia, usar la suya
        target_family_id = current_user.family_id

    # Validar acceso a la familia
    if target_family_id is not None:
        validate_family_access(current_user, target_family_id=target_family_id)

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
        family_id=target_family_id,
        full_name=user_create.full_name,
        email=user_create.email,
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
    current_user: User = Depends(require_admin_or_superadmin)
):
    # Get user to update
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validar acceso a la familia
    validate_family_access(current_user, user)

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
    current_user: User = Depends(require_admin_or_superadmin)
):
    # Get user to update
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validar acceso a la familia
    validate_family_access(current_user, user)

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
    current_user: User = Depends(require_admin_or_superadmin)
):
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

    # Validar acceso a la familia
    validate_family_access(current_user, user)

    # Delete user
    session.delete(user)
    session.commit()
    return None
