"""
Clean Database Script
Deletes the SQLite database to start fresh
"""
import os

DB_PATH = "kleanerz.db"

print("\n" + "="*70)
print("  DATABASE CLEANUP")
print("="*70)

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"\n✓ Deleted {DB_PATH}")
    print("\n⚠ IMPORTANT: You must restart the backend server!")
    print("  1. Stop the server (Ctrl+C in the terminal)")
    print("  2. Restart with: uvicorn main:app --reload")
    print("  3. Run: python fresh_start.py")
    print("\n" + "="*70 + "\n")
else:
    print(f"\n⚠ Database file not found: {DB_PATH}")
    print("  The database may already be clean.")
    print("\n" + "="*70 + "\n")
