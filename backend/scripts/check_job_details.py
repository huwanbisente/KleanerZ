import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models.user as models_user
import models.quest as models_quest
import json

DATABASE_URL = "sqlite:///./kleanerz.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check():
    db = SessionLocal()
    job = db.query(models_quest.Quest).filter(models_quest.Quest.id == 2).first()
    if not job:
        print("Job ID 2 not found")
        return
    
    print(f"ID: {job.id}")
    print(f"Title: {job.title}")
    print(f"Status: {job.status}")
    print(f"Photos Initial: {job.photos_initial} (Type: {type(job.photos_initial)})")
    
    # Try to simulate QuestDetailedResponse validation
    from schemas.quest import QuestDetailedResponse
    try:
        qr = QuestDetailedResponse.from_orm(job)
        print("Pydantic validation: SUCCESS")
    except Exception as e:
        print(f"Pydantic validation: FAILED: {e}")

if __name__ == "__main__":
    check()
