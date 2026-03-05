"""
Complete Reset and Setup
Kills servers, cleans database, and creates production accounts
"""
import subprocess
import time
import os
import requests

API_URL = "http://127.0.0.1:8000"
DB_PATH = "kleanerz.db"

def kill_servers():
    print("\n" + "="*70)
    print("  [1/5] STOPPING BACKEND SERVERS")
    print("="*70)
    try:
        subprocess.run(['taskkill', '/F', '/FI', 'IMAGENAME eq python.exe'], 
                       capture_output=True, text=True, timeout=5)
        print("✓ Stopped all Python processes")
        time.sleep(3)
    except:
        print("⚠ Could not stop processes automatically")
        print("  Please close any running Python terminals manually")
        input("  Press Enter when ready...")

def clean_database():
    print("\n" + "="*70)
    print("  [2/5] CLEANING DATABASE")
    print("="*70)
    try:
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
            print("✓ Deleted old database")
        else:
            print("✓ No database to clean")
    except PermissionError:
        print("✗ Database is still locked!")
        print("  Please manually close all Python processes and try again")
        return False
    return True

def start_server():
    print("\n" + "="*70)
    print("  [3/5] STARTING SERVER")
    print("="*70)
    print("⏳ Starting uvicorn server...")
    print("  (This will run in the background)")
    
    # Start server in background
    subprocess.Popen(
        ['.\\venv\\Scripts\\python.exe', '-m', 'uvicorn', 'main:app', '--reload'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    
    print("✓ Server starting...")
    print("⏳ Waiting 5 seconds for server to initialize...")
    time.sleep(5)

def create_accounts():
    print("\n" + "="*70)
    print("  [4/5] CREATING PRODUCTION ACCOUNTS")
    print("="*70)
    
    accounts = [
        ("juan@kleanerz.com", "klean123", "Juan Dela Cruz", "client"),
        ("pedro@kleanerz.com", "klean123", "Pedro Santos", "client"),
        ("maria@kleanerz.com", "klean123", "Maria Garcia", "cleaner"),
        ("ana@kleanerz.com", "klean123", "Ana Reyes", "cleaner"),
    ]
    
    for email, password, name, role in accounts:
        try:
            res = requests.post(f"{API_URL}/auth/register", json={
                "email": email,
                "password": password,
                "full_name": name,
                "role": role
            }, timeout=5)
            if res.status_code == 200:
                print(f"  ✓ Created {role}: {name}")
            elif "already registered" in res.text.lower():
                print(f"  ⚠ Already exists: {email}")
            else:
                print(f"  ✗ Failed: {email}")
        except Exception as e:
            print(f"  ✗ Error creating {email}: {e}")

def show_summary():
    print("\n" + "="*70)
    print("  [5/5] ✅ SETUP COMPLETE!")
    print("="*70)
    
    print("\n📋 PRODUCTION ACCOUNTS:")
    print("─" * 70)
    print("\n  CLIENTS:")
    print("    • juan@kleanerz.com / klean123 (Juan Dela Cruz)")
    print("    • pedro@kleanerz.com / klean123 (Pedro Santos)")
    print("\n  CLEANERS:")
    print("    • maria@kleanerz.com / klean123 (Maria Garcia)")
    print("    • ana@kleanerz.com / klean123 (Ana Reyes)")
    
    print("\n🎯 READY TO USE:")
    print("─" * 70)
    print("  1. Go to http://localhost:3000")
    print("  2. Login with any account above")
    print("  3. Post jobs, claim them, and test approval workflow")
    print("  4. All data is REAL and will persist")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    print("\n" + "="*70)
    print("  KLEANERZ - COMPLETE RESET & SETUP")
    print("="*70)
    
    kill_servers()
    
    if not clean_database():
        print("\n✗ Setup failed. Please try again.")
        exit(1)
    
    start_server()
    create_accounts()
    show_summary()
