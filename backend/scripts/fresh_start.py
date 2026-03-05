"""
Fresh Start Setup
Creates clean user accounts with no jobs for manual testing
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
            print(f"  ✓ Created {role}: {name}")
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
    print("  KLEANERZ - FRESH START SETUP")
    print("  Creating user accounts only (no jobs)")
    print("="*70)
    
    print("\n[1] Creating Client Accounts...")
    print("─" * 70)
    create_user("client1@test.com", "test123", "Juan Dela Cruz", "client")
    create_user("client2@test.com", "test123", "Pedro Santos", "client")
    
    print("\n[2] Creating Cleaner Accounts...")
    print("─" * 70)
    create_user("cleaner1@test.com", "test123", "Maria Garcia", "cleaner")
    create_user("cleaner2@test.com", "test123", "Ana Reyes", "cleaner")
    
    print("\n" + "="*70)
    print("  ✅ SETUP COMPLETE - READY FOR MANUAL TESTING")
    print("="*70)
    
    print("\n📋 CLIENT ACCOUNTS (Can post jobs):")
    print("─" * 70)
    print("  1. Juan Dela Cruz")
    print("     Email: client1@test.com")
    print("     Password: test123")
    print()
    print("  2. Pedro Santos")
    print("     Email: client2@test.com")
    print("     Password: test123")
    
    print("\n👷 CLEANER ACCOUNTS (Can claim & complete jobs):")
    print("─" * 70)
    print("  1. Maria Garcia")
    print("     Email: cleaner1@test.com")
    print("     Password: test123")
    print()
    print("  2. Ana Reyes")
    print("     Email: cleaner2@test.com")
    print("     Password: test123")
    
    print("\n🧪 MANUAL TESTING WORKFLOW:")
    print("─" * 70)
    print("  STEP 1: Login as Client (e.g., client1@test.com)")
    print("    • Click 'Post New Request' button")
    print("    • Fill in job details and price")
    print("    • Submit the job")
    print()
    print("  STEP 2: Login as Cleaner (e.g., cleaner1@test.com)")
    print("    • Go to 'Find Work' tab")
    print("    • See the job you posted")
    print("    • Click 'Accept Job'")
    print()
    print("  STEP 3: Complete the Job")
    print("    • Go to 'My Jobs' tab")
    print("    • Click 'Mark as Complete'")
    print()
    print("  STEP 4: Verify as Client")
    print("    • Login back as the client")
    print("    • Check 'Total Spent' in dashboard")
    print("    • Verify it matches the job price")
    print()
    print("  STEP 5: Verify as Cleaner")
    print("    • Login back as the cleaner")
    print("    • Check 'Total Earnings' in dashboard")
    print("    • Should match client's 'Total Spent'")
    
    print("\n💡 TESTING TIPS:")
    print("─" * 70)
    print("  • Use realistic PHP prices (e.g., ₱2,000 - ₱5,000)")
    print("  • Test with multiple jobs from different clients")
    print("  • Verify currency conversion works (click PHP button)")
    print("  • Check that totals update in real-time")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
