"""
Show All Users - Workers and Clients
Displays all registered users in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models.user as models_user

DATABASE_URL = "sqlite:///./kleanerz.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def show_users():
    print("\n" + "="*80)
    print("  KLEANERZ - USER DATABASE")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Get all users
        users = db.query(models_user.User).all()
        
        if not users:
            print("\n⚠ No users found in database")
            print("\nRun: python scripts/create_production_accounts.py")
            return
        
        # Separate by role
        clients = [u for u in users if u.role == 'client']
        cleaners = [u for u in users if u.role == 'cleaner']
        
        # Display Clients
        print("\n📋 CLIENT ACCOUNTS (Can post jobs):")
        print("─" * 80)
        if clients:
            for i, user in enumerate(clients, 1):
                # Extract name from email (before @)
                name = user.email.split('@')[0].replace('.', ' ').title()
                print(f"\n  {i}. {name}")
                print(f"     Email: {user.email}")
                print(f"     Password: klean123")
                print(f"     User ID: {user.id}")
        else:
            print("\n  No clients found")
        
        # Display Cleaners
        print("\n\n👷 CLEANER ACCOUNTS (Can claim & complete jobs):")
        print("─" * 80)
        if cleaners:
            for i, user in enumerate(cleaners, 1):
                # Extract name from email (before @)
                name = user.email.split('@')[0].replace('.', ' ').title()
                print(f"\n  {i}. {name}")
                print(f"     Email: {user.email}")
                print(f"     Password: klean123")
                print(f"     User ID: {user.id}")
        else:
            print("\n  No cleaners found")
        
        # Summary
        print("\n\n📊 SUMMARY:")
        print("─" * 80)
        print(f"  Total Users: {len(users)}")
        print(f"  • Clients: {len(clients)}")
        print(f"  • Cleaners: {len(cleaners)}")
        
        print("\n" + "="*80)
        print("\n💡 TO LOGIN:")
        print("  1. Go to http://localhost:3000")
        print("  2. Click 'Find Gigs' (for cleaners) or 'Post a Gig' (for clients)")
        print("  3. Use any email above with password: klean123")
        print("\n" + "="*80 + "\n")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    show_users()
