
import sqlite3
import os

# Path to database
DB_PATH = "kleanerz.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Create Messages Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            recipient_id INTEGER,
            content VARCHAR,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT 0,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (recipient_id) REFERENCES users(id)
        )
        """)
        print("Created 'messages' table.")
        
        # Check if table was actually created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'")
        if cursor.fetchone():
            print("Table verification: SUCCESS")
        else:
            print("Table verification: FAILED")

        conn.commit()

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
