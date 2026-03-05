import sqlite3
import os

db_path = "kleanerz.db"

if not os.path.exists(db_path):
    print("Database does not exist.")
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
add_column("users", "skills", "VARCHAR")
add_column("users", "equipment", "VARCHAR")
add_column("users", "languages", "VARCHAR")

conn.commit()
conn.close()
print("Migration v3 complete!")
