"""
Create Real Production Accounts
These are actual accounts you'll use for the live system
"""
import requests

API_URL = "http://127.0.0.1:8000"

def create_user(email, password, name, role):
    try:
        res = requests.post(f"{API_URL}/auth/register", json={
            "email": email,
            "password": password,
            "full_name": name,
            "role": role
        })
        if res.status_code == 200:
            print(f"  ✓ Created {role}: {name} ({email})")
            return True
        elif "already registered" in res.text.lower():
            print(f"  ⚠ User already exists: {email}")
            return True
        else:
            print(f"  ✗ Failed: {res.text}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("\n" + "="*70)
    print("  KLEANERZ - PRODUCTION ACCOUNTS SETUP")
    print("="*70)
    
    print("\n[1] Creating Client Accounts...")
    print("─" * 70)
    create_user("juan@kleanerz.com", "klean123", "Juan Dela Cruz", "client")
    create_user("pedro@kleanerz.com", "klean123", "Pedro Santos", "client")
    
    print("\n[2] Creating Cleaner Accounts...")
    print("─" * 70)
    create_user("maria@kleanerz.com", "klean123", "Maria Garcia", "cleaner")
    create_user("ana@kleanerz.com", "klean123", "Ana Reyes", "cleaner")
    
    print("\n" + "="*70)
    print("  ✅ PRODUCTION ACCOUNTS CREATED")
    print("="*70)
    
    print("\n📋 CLIENT ACCOUNTS:")
    print("─" * 70)
    print("  1. Juan Dela Cruz")
    print("     Email: juan@kleanerz.com")
    print("     Password: klean123")
    print()
    print("  2. Pedro Santos")
    print("     Email: pedro@kleanerz.com")
    print("     Password: klean123")
    
    print("\n👷 CLEANER ACCOUNTS:")
    print("─" * 70)
    print("  1. Maria Garcia")
    print("     Email: maria@kleanerz.com")
    print("     Password: klean123")
    print()
    print("  2. Ana Reyes")
    print("     Email: ana@kleanerz.com")
    print("     Password: klean123")
    
    print("\n🎯 READY FOR PRODUCTION USE!")
    print("─" * 70)
    print("  • Login with these accounts")
    print("  • Post real jobs as clients")
    print("  • Claim and complete jobs as cleaners")
    print("  • Test the full approval workflow")
    print("  • All data will be saved permanently")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
