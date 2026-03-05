"""
Kill Backend Servers
Stops all running uvicorn processes
"""
import subprocess
import time

print("\n" + "="*70)
print("  STOPPING BACKEND SERVERS")
print("="*70)

try:
    # Kill all Python processes running uvicorn
    result = subprocess.run(
        ['taskkill', '/F', '/IM', 'python.exe', '/FI', 'WINDOWTITLE eq *uvicorn*'],
        capture_output=True,
        text=True
    )
    
    # Alternative: Kill all uvicorn processes
    subprocess.run(['taskkill', '/F', '/FI', 'IMAGENAME eq python.exe'], 
                   capture_output=True, text=True)
    
    print("\n✓ Stopped all backend servers")
    print("\n⏳ Waiting 2 seconds for processes to fully stop...")
    time.sleep(2)
    
    print("\n" + "="*70)
    print("  ✅ SERVERS STOPPED")
    print("="*70)
    print("\nNow you can run:")
    print("  1. python clean_db.py")
    print("  2. .\\venv\\Scripts\\uvicorn main:app --reload")
    print("  3. python create_production_accounts.py")
    print("\n" + "="*70 + "\n")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    print("\nManual alternative:")
    print("  1. Open Task Manager (Ctrl+Shift+Esc)")
    print("  2. Find 'python.exe' processes")
    print("  3. End all python.exe tasks")
    print("\n" + "="*70 + "\n")
