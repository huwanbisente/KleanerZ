"""
Debug Job Posting Issues
Shows all jobs and helps diagnose posting problems
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models.quest as models_quest
import models.user as models_user

DATABASE_URL = "sqlite:///./kleanerz.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def show_jobs():
    print("\n" + "="*80)
    print("  JOB POSTING DEBUG")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Get all jobs
        jobs = db.query(models_quest.Quest).all()
        
        print(f"\n📋 TOTAL JOBS IN DATABASE: {len(jobs)}")
        print("─" * 80)
        
        if not jobs:
            print("\n⚠ No jobs found")
            print("\nPossible reasons:")
            print("  1. No jobs have been posted yet")
            print("  2. Jobs were posted but failed to save")
            print("  3. Database was recently cleaned")
            return
        
        for i, job in enumerate(jobs, 1):
            print(f"\n{i}. {job.title}")
            print(f"   ID: {job.id}")
            print(f"   Status: {job.status}")
            print(f"   Price: ₱{job.price}")
            print(f"   Location: {job.address_masked}")
            print(f"   Client ID: {job.client_id}")
            print(f"   Cleaner ID: {job.cleaner_id if job.cleaner_id else 'Not claimed'}")
            
            # Get client name
            client = db.query(models_user.User).filter(models_user.User.id == job.client_id).first()
            if client:
                client_name = client.email.split('@')[0].title()
                print(f"   Posted by: {client_name} ({client.email})")
        
        print("\n" + "="*80)
        print("\n💡 TIPS:")
        print("  • If you see duplicate jobs, the form might not be resetting")
        print("  • If jobs are missing, check browser console for errors")
        print("  • If status is wrong, check the backend API")
        print("\n" + "="*80 + "\n")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    show_jobs()
