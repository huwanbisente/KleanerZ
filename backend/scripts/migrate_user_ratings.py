
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
        # Add rating column
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN rating FLOAT DEFAULT 0.0")
            print("Added 'rating' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'rating' column already exists.")
            else:
                raise e

        # Add reviews_count column
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN reviews_count INTEGER DEFAULT 0")
            print("Added 'reviews_count' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'reviews_count' column already exists.")
            else:
                raise e

        conn.commit()
        print("Migration successful.")

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
