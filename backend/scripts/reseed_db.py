import os
import sqlite3
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models.user import User, UserRole
from models.quest import Quest, QuestStatus
from core.auth import get_password_hash
from datetime import datetime, timedelta

# 1. Delete old database
db_file = "kleanerz.db"
if os.path.exists(db_file):
    print(f"Deleting existing database: {db_file}")
    os.remove(db_file)

# 2. Create tables
print("Creating new tables with updated schema...")
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    try:
        print("Seeding users...")
        users = [
            {"email": "juan@kleanerz.com", "name": "JUAN DE LA CRUZ", "role": "client", "pass": "klean123"},
            {"email": "pedro@kleanerz.com", "name": "PEDRO PENDUKO", "role": "client", "pass": "klean123"},
            {"email": "maria@kleanerz.com", "name": "MARIA MAKILING", "role": "cleaner", "pass": "klean123"},
            {"email": "ana@kleanerz.com", "name": "ANA KARENINA", "role": "cleaner", "pass": "klean123"},
        ]
        
        db_users = []
        for u in users:
            new_user = User(
                email=u["email"],
                hashed_password=get_password_hash(u["pass"]),
                role=u["role"],
                full_name=u["name"],
                wallet_balance=5000.0 if u["role"] == "client" else 0.0,
                bio=f"Professional {u['role']} in the KleanerZ platform."
            )
            db.add(new_user)
            db_users.append(new_user)
        
        db.commit()
        
        print("Seeding sample jobs...")
        # Create a pending job for Maria to find
        job1 = Quest(
            title="Luxury Condo Deep Clean",
            description="Deep clean for a 2BR condo in Makati. Focus on balcony and kitchen cabinets.",
            price=2500.0,
            address_masked="Makati City Central",
            address_exact="Unit 1204, Rise Residences, Makati",
            latitude=14.5620,
            longitude=121.0163,
            status=QuestStatus.PENDING,
            client_id=1, # Juan
            scheduled_at=datetime.utcnow() + timedelta(days=2)
        )
        db.add(job1)
        
        # Create an already completed job for history
        job2 = Quest(
            title="Quick Kitchen Clean",
            description="Just dishes and floor mopping.",
            price=800.0,
            address_masked="Quezon City",
            address_exact="45 Scout Borromeo, QC",
            latitude=14.6321,
            longitude=121.0365,
            status=QuestStatus.COMPLETED,
            client_id=2, # Pedro
            cleaner_id=3, # Maria
            scheduled_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(job2)
        
        db.commit()
        print("Database re-seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
