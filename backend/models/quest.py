from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class QuestStatus(str, enum.Enum):
    PENDING = "pending"
    CLAIMED = "claimed"
    EN_ROUTE = "en_route"
    IN_PROGRESS = "in_progress"
    PENDING_APPROVAL = "pending_approval"  # Cleaner submitted, waiting for client approval
    COMPLETED = "completed"
    PAID = "paid"
    CANCELLED = "cancelled"

class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    cleaner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    title = Column(String)
    description = Column(String)
    price = Column(Float)
    
    # Geolocation
    latitude = Column(Float)
    longitude = Column(Float)
    address_masked = Column(String) # "Near corner of 5th and Main"
    address_exact = Column(String)  # Hidden until claimed
    
    status = Column(String, default=QuestStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    scheduled_at = Column(DateTime, nullable=True) # When the job is scheduled to happen
    
    # Photos stored as JSON array of URLs ["url1", "url2"]
    photos_initial = Column(JSON, default=[]) 
    photos_before = Column(JSON, default=[])
    photos_after = Column(JSON, default=[])

    # Relationships
    client = relationship("User", foreign_keys=[client_id])
    cleaner = relationship("User", foreign_keys=[cleaner_id])
    applications = relationship("QuestApplication", back_populates="quest")

    @property
    def client_name(self):
        return self.client.full_name if self.client else None

    @property
    def cleaner_name(self):
        return self.cleaner.full_name if self.cleaner else None
