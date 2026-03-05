from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    quest_id = Column(Integer, ForeignKey("quests.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    reviewee_id = Column(Integer, ForeignKey("users.id"))
    
    rating = Column(Float) # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    quest = relationship("Quest")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])
