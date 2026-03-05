from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models.quest import QuestStatus

class QuestBase(BaseModel):
    title: str
    description: str
    price: float
    latitude: float
    longitude: float
    address_masked: str
    address_exact: str
    scheduled_at: Optional[datetime] = None

class QuestCreate(QuestBase):
    photos_initial: List[str] = []

class QuestComplete(BaseModel):
    photos_before: List[str]
    photos_after: List[str]

class QuestResponse(BaseModel):
    id: int
    client_id: int
    cleaner_id: Optional[int]
    status: QuestStatus
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    
    # Public info
    title: str
    description: str
    price: float
    address_masked: str
    latitude: float
    longitude: float
    photos_initial: List[str]
    client_name: Optional[str] = None
    cleaner_name: Optional[str] = None

    class Config:
        from_attributes = True

class QuestApplicationOut(BaseModel):
    id: int
    quest_id: int
    cleaner_id: int
    cleaner_name: Optional[str]
    cleaner_avatar_url: Optional[str]
    cleaner_rating: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class QuestDetailedResponse(QuestResponse):
    # Private info (only for participants)
    address_exact: Optional[str] = None
    photos_before: List[str] = []
    photos_after: List[str] = []
    applications: List[QuestApplicationOut] = []

class QuestApplicant(BaseModel):
    id: int
    full_name: Optional[str]
    rating: float
    avatar_url: Optional[str]
    
    class Config:
        from_attributes = True
