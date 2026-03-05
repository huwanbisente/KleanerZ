
from database import SessionLocal
from models.user import User
from models.message import Message
from sqlalchemy import text

def check_db():
    try:
        db = SessionLocal()
        print("Database connection successful.")
        
        # Test User Query
        user_count = db.query(User).count()
        print(f"User count: {user_count}")
        
        # Test if we can retrieve a user
        user = db.query(User).first()
        if user:
            print(f"Found user: {user.email}")
            print(f"User role: {user.role}")
            # Access relationships to check if they blow up
            print(f"Sent messages: {user.sent_messages}")
        else:
            print("No users found.")
            
        # Check tables
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = [row[0] for row in result]
        print("Tables:", tables)
        
    except Exception as e:
        print(f"Database/Model Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
