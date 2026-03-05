"""
Delete All Jobs Script
Removes all jobs from the database while keeping user accounts
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models.quest as models_quest
import models.user as models_user

DATABASE_URL = "sqlite:///./kleanerz.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def delete_all_jobs():
    print("\n" + "="*70)
    print("  DELETE ALL JOBS")
    print("="*70)
    
    db = SessionLocal()
    try:
        # Count jobs before deletion
        job_count = db.query(models_quest.Quest).count()
        
        if job_count == 0:
            print("\n✓ No jobs found in database. Already clean!")
        else:
            # Delete all jobs
            db.query(models_quest.Quest).delete()
            db.commit()
            print(f"\n✓ Deleted {job_count} job(s) from database")
            print("✓ User accounts preserved")
        
        print("\n" + "="*70 + "\n")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_jobs()
