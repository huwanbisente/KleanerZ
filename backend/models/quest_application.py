from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class QuestApplication(Base):
    __tablename__ = "quest_applications"

    id = Column(Integer, primary_key=True, index=True)
    quest_id = Column(Integer, ForeignKey("quests.id"))
    cleaner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending") # pending, rejected

    quest = relationship("Quest", back_populates="applications")
    cleaner = relationship("User")

    @property
    def cleaner_name(self):
        return self.cleaner.full_name if self.cleaner else None

    @property
    def cleaner_avatar_url(self):
        return self.cleaner.avatar_url if self.cleaner else None

    @property
    def cleaner_rating(self):
        return self.cleaner.rating if self.cleaner else 0.0
