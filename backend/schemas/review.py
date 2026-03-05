from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    quest_id: int
    reviewer_id: int
    reviewee_id: int
    rating: float
    comment: Optional[str]
    created_at: datetime
    
    reviewer_name: Optional[str] = None

    class Config:
        orm_mode = True
