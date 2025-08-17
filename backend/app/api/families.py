from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select, func
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.family import Family
from ..models.task import TaskAssignment, TaskStatus
from ..schemas.family import (
    FamilyCreate, 
    FamilyUpdate, 
    FamilyResponse, 
    FamilyWithMembersResponse,
    FamilyAdminCreate,
    FamilyStats
)
from ..schemas.auth import UserResponse
from ..core.security import get_password_hash
from .auth import get_current_user

router = APIRouter(prefix="/api/families", tags=["families"])


# Endpoint OPTIONS explícito para manejar preflight requests
@router.options("/{family_id}")
async def options_family(family_id: int):
    """Handle preflight requests for family operations"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        }
    )


@router.get("/public", response_model=List[FamilyResponse])
async def get_public_families(session: Session = Depends(get_session)):
    """Obtener familias activas para el formulario de login - Endpoint público"""
    statement = select(Family).where(Family.is_active == True).order_by(Family.name)
    families = session.exec(statement).all()
    return families


def require_superadmin(current_user: User = Depends(get_current_user)):
    """Middleware para verificar que el usuario sea superadmin"""
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can perform this action"
        )
    return current_user


@router.get("/", response_model=List[FamilyWithMembersResponse])
async def get_all_families(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin)
):
    """Obtener todas las familias con información de miembros - Solo superadmin"""
    statement = select(Family).order_by(Family.created_at.desc())
    families = session.exec(statement).all()
    
    result = []
    for family in families:
        # Obtener miembros de la familia
        members_statement = select(User).where(User.family_id == family.id)
        members = session.exec(members_statement).all()
        
        # Contar por roles
        admin_count = len([m for m in members if m.role == UserRole.ADMIN])
        user_count = len([m for m in members if m.role == UserRole.USER])
        
        family_dict = family.dict()
        family_dict['members'] = members
        family_dict['member_count'] = len(members)
        family_dict['admin_count'] = admin_count
        family_dict['user_count'] = user_count
        
        result.append(FamilyWithMembersResponse(**family_dict))
    
    return result


@router.post("/", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    family_data: FamilyCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin)
):
    """Crear una nueva familia - Solo superadmin"""
    # Verificar que el nombre no exista
    existing_family = session.exec(
        select(Family).where(Family.name == family_data.name)
    ).first()
    
    if existing_family:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Family name already exists"
        )
    
    # Crear la familia
    family = Family(
        **family_data.dict(),
        created_by=current_user.id
    )
    
    session.add(family)
    session.commit()
    session.refresh(family)
    
    return family


@router.get("/{family_id}", response_model=FamilyWithMembersResponse)
async def get_family(
    family_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin)
):
    """Obtener información detallada de una familia - Solo superadmin"""
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Obtener miembros
    members_statement = select(User).where(User.family_id == family_id)
    members = session.exec(members_statement).all()
    
    # Contar por roles
    admin_count = len([m for m in members if m.role == UserRole.ADMIN])
    user_count = len([m for m in members if m.role == UserRole.USER])
    
    family_dict = family.dict()
    family_dict['members'] = members
    family_dict['member_count'] = len(members)
    family_dict['admin_count'] = admin_count
    family_dict['user_count'] = user_count
    
    return FamilyWithMembersResponse(**family_dict)


@router.patch("/{family_id}", response_model=FamilyResponse)
async def update_family(
    family_id: int,
    family_update: FamilyUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin)
):
    """Actualizar una familia - Solo superadmin"""
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Verificar nombre único si se está cambiando
    update_data = family_update.dict(exclude_unset=True)
    if 'name' in update_data and update_data['name'] != family.name:
        existing_family = session.exec(
            select(Family).where(Family.name == update_data['name'])
        ).first()
        if existing_family:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Family name already exists"
            )
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(family, field, value)
    
    session.add(family)
    session.commit()
    session.refresh(family)
    
    return family


@router.delete("/{family_id}")
async def delete_family(
    family_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin)
):
    """Eliminar una familia y todos sus miembros - Solo superadmin"""
    print(f"🗑️  Iniciando eliminación de familia {family_id} por usuario {current_user.username}")

    family = session.get(Family, family_id)
    if not family:
        print(f"❌ Familia {family_id} no encontrada")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )

    print(f"✅ Familia encontrada: {family.name}")

    try:
        # Enfoque completo: eliminar/desasociar todas las relaciones
        print(f"🔄 Iniciando proceso de eliminación completa...")

        # 1. Eliminar todas las asignaciones de tareas de usuarios de esta familia
        from ..models.task import Task, TaskAssignment
        print(f"🔄 Eliminando asignaciones de tareas...")

        # Obtener todas las asignaciones de usuarios de esta familia
        user_assignments_statement = (
            select(TaskAssignment)
            .join(User, TaskAssignment.user_id == User.id)
            .where(User.family_id == family_id)
        )
        user_assignments = session.exec(user_assignments_statement).all()
        print(f"📊 Encontradas {len(user_assignments)} asignaciones de usuarios")

        for assignment in user_assignments:
            session.delete(assignment)

        # También eliminar asignaciones de tareas específicas de la familia
        task_assignments_statement = (
            select(TaskAssignment)
            .join(Task, TaskAssignment.task_id == Task.id)
            .where(Task.family_id == family_id)
        )
        task_assignments = session.exec(task_assignments_statement).all()
        print(f"📊 Encontradas {len(task_assignments)} asignaciones de tareas de familia")

        for assignment in task_assignments:
            session.delete(assignment)

        # 2. Eliminar tareas de la familia
        print(f"🔄 Eliminando tareas de la familia...")
        tasks_statement = select(Task).where(Task.family_id == family_id)
        tasks = session.exec(tasks_statement).all()
        print(f"📊 Encontradas {len(tasks)} tareas")

        for task in tasks:
            session.delete(task)

        # 3. Eliminar recompensas de la familia
        print(f"🔄 Eliminando recompensas de la familia...")
        from ..models.reward import Reward
        rewards_statement = select(Reward).where(Reward.family_id == family_id)
        rewards = session.exec(rewards_statement).all()
        print(f"📊 Encontradas {len(rewards)} recompensas")

        for reward in rewards:
            session.delete(reward)

        # 4. Desasociar usuarios de la familia (ponerlos sin familia)
        print(f"🔄 Desasociando usuarios de la familia...")
        members_statement = select(User).where(User.family_id == family_id)
        members = session.exec(members_statement).all()
        print(f"📊 Encontrados {len(members)} miembros")

        for member in members:
            member.family_id = None
            session.add(member)

        # 5. Finalmente, eliminar la familia
        print(f"🔄 Eliminando familia...")
        session.delete(family)
        session.commit()
        print(f"✅ Familia {family_id} eliminada exitosamente")

    except Exception as e:
        session.rollback()
        print(f"❌ Error eliminando familia {family_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error eliminando familia: {str(e)}"
        )

    # Retornar respuesta con headers CORS explícitos
    print(f"🎉 Retornando respuesta exitosa para eliminación de familia {family_id}")
    return Response(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        }
    )


@router.post("/{family_id}/admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_family_admin(
    family_id: int,
    admin_data: FamilyAdminCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin)
):
    """Crear un administrador para una familia específica - Solo superadmin"""
    # Verificar que la familia existe
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Verificar que el username no exista
    existing_user = session.exec(
        select(User).where(User.username == admin_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Crear el administrador
    hashed_password = get_password_hash(admin_data.password)
    admin_user = User(
        username=admin_data.username,
        password_hash=hashed_password,
        role=UserRole.ADMIN,
        family_id=family_id,
        full_name=admin_data.full_name,
        email=admin_data.email,
        credits=0
    )
    
    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)
    
    return admin_user


@router.get("/{family_id}/stats", response_model=FamilyStats)
async def get_family_stats(
    family_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_superadmin)
):
    """Obtener estadísticas de una familia - Solo superadmin"""
    family = session.get(Family, family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Contar miembros
    total_members = session.exec(
        select(func.count(User.id)).where(User.family_id == family_id)
    ).one()
    
    active_members = session.exec(
        select(func.count(User.id)).where(
            User.family_id == family_id,
            User.is_active == True
        )
    ).one()
    
    # Estadísticas de tareas (esto requerirá ajustar las consultas cuando actualicemos el modelo Task)
    # Por ahora, valores por defecto
    total_tasks = 0
    completed_tasks_today = 0
    pending_tasks = 0
    total_credits_earned = session.exec(
        select(func.sum(User.credits)).where(User.family_id == family_id)
    ).one() or 0
    
    return FamilyStats(
        total_members=total_members,
        active_members=active_members,
        total_tasks=total_tasks,
        completed_tasks_today=completed_tasks_today,
        pending_tasks=pending_tasks,
        total_credits_earned=total_credits_earned
    )
