import requests
import json

API_URL = "http://127.0.0.1:8000"

def create_cleaner():
    """Create a cleaner user for testing"""
    
    # Try to register a cleaner
    cleaner_data = {
        "email": "cleaner@kleanerz.com",
        "password": "secret123",
        "full_name": "Maria Santos",
        "role": "cleaner"
    }
    
    res = requests.post(f"{API_URL}/auth/register", json=cleaner_data)
    
    if res.status_code == 200:
        print("✓ Cleaner user created successfully!")
        print(f"  Email: cleaner@kleanerz.com")
        print(f"  Name: Maria Santos")
        print(f"  Role: cleaner")
        return True
    else:
        if "already registered" in res.text.lower():
            print("✓ Cleaner user already exists")
            return True
        else:
            print(f"✗ Failed to create cleaner: {res.text}")
            return False

if __name__ == "__main__":
    create_cleaner()
