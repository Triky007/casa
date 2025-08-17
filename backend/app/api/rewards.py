from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.user import User, UserRole
from ..models.reward import Reward, RewardRedemption
from ..schemas.auth import UserResponse
from .auth import get_current_user

router = APIRouter(prefix="/api/rewards", tags=["rewards"])


def require_admin_or_superadmin(current_user: User = Depends(get_current_user)):
    """Middleware para requerir permisos de admin o superadmin"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user


class RewardCreate(BaseModel):
    name: str
    description: str = None
    cost: int
    family_id: Optional[int] = None


class RewardUpdate(BaseModel):
    name: str = None
    description: str = None
    cost: int = None
    family_id: Optional[int] = None
    is_active: bool = None


class RewardResponse(BaseModel):
    id: int
    name: str
    description: str = None
    cost: int
    family_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class RewardRedemptionResponse(BaseModel):
    id: int
    reward_id: int
    user_id: int
    redeemed_at: datetime
    reward: RewardResponse = None
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[RewardResponse])
async def get_rewards(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Obtener recompensas activas - filtradas por familia"""
    if current_user.role == UserRole.SUPERADMIN:
        # Superadmins ven todas las recompensas
        statement = select(Reward).where(Reward.is_active == True)
    else:
        # Usuarios y admins solo ven recompensas de su familia
        statement = select(Reward).where(
            Reward.is_active == True,
            Reward.family_id == current_user.family_id
        )

    rewards = session.exec(statement).all()
    return rewards


@router.get("/admin/all", response_model=List[RewardResponse])
async def get_all_rewards_admin(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all rewards"
        )

    # Return rewards filtered by family for admins
    if current_user.role == UserRole.SUPERADMIN:
        # Superadmins ven todas las recompensas
        statement = select(Reward)
    else:
        # Admins solo ven recompensas de su familia
        statement = select(Reward).where(Reward.family_id == current_user.family_id)

    rewards = session.exec(statement).all()
    return rewards


@router.post("/", response_model=RewardResponse)
async def create_reward(
    reward_data: RewardCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create rewards"
        )
    
    reward_dict = reward_data.dict()

    # Asignar familia automáticamente si no se especifica
    if reward_dict.get('family_id') is None and current_user.role == UserRole.ADMIN:
        reward_dict['family_id'] = current_user.family_id

    reward = Reward(**reward_dict)
    session.add(reward)
    session.commit()
    session.refresh(reward)
    return reward


@router.put("/{reward_id}", response_model=RewardResponse)
async def update_reward(
    reward_id: int,
    reward_data: RewardUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update rewards"
        )

    reward = session.get(Reward, reward_id)
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found"
        )

    # Validar acceso a la recompensa
    if current_user.role != UserRole.SUPERADMIN:
        if reward.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta recompensa"
            )

    # Update only provided fields
    update_data = reward_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reward, field, value)

    session.add(reward)
    session.commit()
    session.refresh(reward)
    return reward


@router.patch("/{reward_id}", response_model=RewardResponse)
async def patch_reward(
    reward_id: int,
    reward_data: RewardUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update rewards"
        )

    reward = session.get(Reward, reward_id)
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found"
        )

    # Validar acceso a la recompensa
    if current_user.role != UserRole.SUPERADMIN:
        if reward.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta recompensa"
            )

    # Update only provided fields
    update_data = reward_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reward, field, value)

    session.add(reward)
    session.commit()
    session.refresh(reward)
    return reward


@router.delete("/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reward(
    reward_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete rewards"
        )

    reward = session.get(Reward, reward_id)
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found"
        )

    # Validar acceso a la recompensa
    if current_user.role != UserRole.SUPERADMIN:
        if reward.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta recompensa"
            )

    # Check if reward has been redeemed
    redemptions_statement = select(RewardRedemption).where(RewardRedemption.reward_id == reward_id)
    redemptions = session.exec(redemptions_statement).all()

    if redemptions:
        # If reward has been redeemed, only deactivate it
        reward.is_active = False
        session.add(reward)
        session.commit()
    else:
        # If no redemptions, we can safely delete it
        session.delete(reward)
        session.commit()


@router.post("/redeem/{reward_id}", response_model=RewardRedemptionResponse)
async def redeem_reward(
    reward_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check if reward exists
    reward = session.get(Reward, reward_id)
    if not reward or not reward.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found"
        )

    # Validar que la recompensa pertenezca a la familia del usuario
    if reward.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta recompensa no está disponible para tu familia"
        )

    # Check if user has enough credits
    if current_user.credits < reward.cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient credits"
        )
    
    # Deduct credits and create redemption
    current_user.credits -= reward.cost
    redemption = RewardRedemption(reward_id=reward_id, user_id=current_user.id)
    
    session.add(current_user)
    session.add(redemption)
    session.commit()
    session.refresh(redemption)
    
    # Crear objeto de respuesta con la información de recompensa incluida
    return RewardRedemptionResponse(
        id=redemption.id,
        reward_id=redemption.reward_id,
        user_id=redemption.user_id,
        redeemed_at=redemption.redeemed_at,
        reward=RewardResponse(
            id=reward.id,
            name=reward.name,
            description=reward.description,
            cost=reward.cost,
            is_active=reward.is_active,
            created_at=reward.created_at
        )
    )


@router.get("/redemptions", response_model=List[RewardRedemptionResponse])
async def get_user_redemptions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(RewardRedemption).where(RewardRedemption.user_id == current_user.id)
    redemptions = session.exec(statement).all()
    
    # Crear objetos de respuesta con la información de recompensa incluida
    result = []
    for redemption in redemptions:
        reward = session.get(Reward, redemption.reward_id)
        response = RewardRedemptionResponse(
            id=redemption.id,
            reward_id=redemption.reward_id,
            user_id=redemption.user_id,
            redeemed_at=redemption.redeemed_at,
            reward=RewardResponse(
                id=reward.id,
                name=reward.name,
                description=reward.description,
                cost=reward.cost,
                is_active=reward.is_active,
                created_at=reward.created_at
            ) if reward else None
        )
        result.append(response)
    
    return result
