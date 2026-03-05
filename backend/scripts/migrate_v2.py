import sqlite3
import os

db_path = "kleanerz.db"

if not os.path.exists(db_path):
    print("Database does not exist. Uvicorn will create it.")
    exit(0)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column(table, column, type):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type}")
        print(f"Added column {column} to {table}")
    except sqlite3.OperationalError:
        print(f"Column {column} already exists in {table}")

# Update Users table
add_column("users", "full_name", "VARCHAR")
add_column("users", "phone", "VARCHAR")
add_column("users", "bio", "VARCHAR")
add_column("users", "avatar_url", "VARCHAR")

# Update Quests table
add_column("quests", "scheduled_at", "DATETIME")

conn.commit()
conn.close()
print("Migration complete!")
