import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models.quest as models_quest
import models.user as models_user

DATABASE_URL = "sqlite:///./kleanerz.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def simulate_claim():
    db = SessionLocal()
    try:
        # Get Maria (Cleaner)
        maria = db.query(models_user.User).filter(models_user.User.email == "maria@kleanerz.com").first()
        if not maria:
            print("Maria not found")
            return
            
        # Get Job 2
        quest = db.query(models_quest.Quest).filter(models_quest.Quest.id == 2).first()
        if not quest:
            print("Quest 2 not found")
            return
            
        print(f"Current Quest Status: {quest.status}")
        print(f"Maria Role: {maria.role}")
        
        # Simulate router logic
        if maria.role != "cleaner":
            print("Fail: Not a cleaner")
            return
        
        if quest.status != models_quest.QuestStatus.PENDING:
            print(f"Fail: Status is {quest.status}")
            return
            
        print("Conditions met. Attempting commit...")
        quest.status = models_quest.QuestStatus.CLAIMED
        quest.cleaner_id = maria.id
        db.commit()
        db.refresh(quest)
        print("Success! Quest claimed.")
        
        # Reset for user to test
        quest.status = models_quest.QuestStatus.PENDING
        quest.cleaner_id = None
        db.commit()
        print("Quest reset to pending for user testing.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    simulate_claim()
