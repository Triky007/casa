from typing import List
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


class RewardCreate(BaseModel):
    name: str
    description: str = None
    cost: int


class RewardUpdate(BaseModel):
    name: str = None
    description: str = None
    cost: int = None
    is_active: bool = None


class RewardResponse(BaseModel):
    id: int
    name: str
    description: str = None
    cost: int
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
    statement = select(Reward).where(Reward.is_active == True)
    rewards = session.exec(statement).all()
    return rewards


@router.get("/admin/all", response_model=List[RewardResponse])
async def get_all_rewards_admin(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all rewards"
        )

    # Return all rewards (active and inactive) for admin management
    statement = select(Reward)
    rewards = session.exec(statement).all()
    return rewards


@router.post("/", response_model=RewardResponse)
async def create_reward(
    reward_data: RewardCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create rewards"
        )
    
    reward = Reward(**reward_data.dict())
    session.add(reward)
    session.commit()
    session.refresh(reward)
    return reward


@router.put("/{reward_id}", response_model=RewardResponse)
async def update_reward(
    reward_id: int,
    reward_data: RewardCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
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

    # Update reward fields
    for field, value in reward_data.dict().items():
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
    if current_user.role != UserRole.ADMIN:
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
    if current_user.role != UserRole.ADMIN:
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
    
    # Instead of hard delete, set as inactive
    reward.is_active = False
    session.add(reward)
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
