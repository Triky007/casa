from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class Reward(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    cost: int  # Credits required to redeem
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RewardRedemption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    reward_id: int = Field(foreign_key="reward.id")
    user_id: int = Field(foreign_key="user.id")
    redeemed_at: datetime = Field(default_factory=datetime.utcnow)
