"""
Fix Database Schema
Updates the database to include the new PENDING_APPROVAL status
"""
print("\n" + "="*70)
print("  DATABASE SCHEMA UPDATE")
print("="*70)

print("\n⚠ IMPORTANT: The database model has been updated.")
print("  A new status 'PENDING_APPROVAL' has been added.")
print("\n📋 TO FIX THE 'Failed to post job' ERROR:")
print("─" * 70)
print("\n  OPTION 1: Clean Database (Recommended for testing)")
print("    1. Stop ALL backend servers (Ctrl+C in each terminal)")
print("    2. Run: python clean_db.py")
print("    3. Restart server: .\\venv\\Scripts\\uvicorn main:app --reload")
print("    4. Run: python fresh_start.py")
print("\n  OPTION 2: Just Restart (If you want to keep existing data)")
print("    1. Stop ALL backend servers (Ctrl+C in each terminal)")
print("    2. Restart server: .\\venv\\Scripts\\uvicorn main:app --reload")
print("    3. Try posting a job again")

print("\n💡 NOTE: SQLite doesn't support ALTER ENUM, so we need to")
print("  recreate the database or restart the server.")

print("\n" + "="*70 + "\n")
