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
    
    # Load reward data
    redemption.reward = reward
    
    return redemption


@router.get("/redemptions", response_model=List[RewardRedemptionResponse])
async def get_user_redemptions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(RewardRedemption).where(RewardRedemption.user_id == current_user.id)
    redemptions = session.exec(statement).all()
    
    # Load reward data for each redemption
    for redemption in redemptions:
        redemption.reward = session.get(Reward, redemption.reward_id)
    
    return redemptions
