import requests

API_URL = "http://127.0.0.1:8000"

def get_token(email, password):
    res = requests.post(f"{API_URL}/auth/token", json={"email": email, "password": password})
    return res.json().get("access_token") if res.status_code == 200 else None

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

def create_job(token, job_data):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.post(f"{API_URL}/quests/", json=job_data, headers=headers)
        if res.status_code == 200:
            return res.json()
        return None
    except:
        return None

# Job templates
JOBS = [
    # Client 1's jobs
    {"title": "Deep Clean 3BR Condo", "description": "Full deep cleaning needed", "price": 3500, "location": "Makati CBD"},
    {"title": "Office Sanitization", "description": "Disinfect entire office", "price": 5000, "location": "BGC"},
    {"title": "Move-Out Cleaning", "description": "Kitchen and bathroom focus", "price": 2800, "location": "QC"},
    {"title": "Weekly Housekeeping", "description": "Regular maintenance", "price": 2000, "location": "Manila"},
    {"title": "Post-Renovation Clean", "description": "Remove construction dust", "price": 4200, "location": "Ortigas"},
    
    # Client 2's jobs
    {"title": "Airbnb Turnover", "description": "Quick guest turnover", "price": 1800, "location": "BGC"},
    {"title": "Garage Deep Clean", "description": "Organize and sweep", "price": 2500, "location": "Alabang"},
    {"title": "Studio Refresh", "description": "Light cleaning", "price": 1500, "location": "Makati"},
    {"title": "Luxury Condo Service", "description": "Premium monthly service", "price": 6000, "location": "BGC"},
    {"title": "Kitchen Deep Clean", "description": "Oven and appliances", "price": 3200, "location": "QC"}
]

def main():
    print("\n" + "="*70)
    print("  KLEANERZ - MANUAL TESTING SETUP")
    print("="*70)
    
    # Create users
    print("\n[1] Creating Test Users...")
    print("─" * 70)
    
    create_user("client1@test.com", "test123", "Juan Dela Cruz", "client")
    create_user("client2@test.com", "test123", "Pedro Santos", "client")
    create_user("cleaner1@test.com", "test123", "Maria Garcia", "cleaner")
    
    # Get client tokens
    print("\n[2] Posting Jobs...")
    print("─" * 70)
    
    client1_token = get_token("client1@test.com", "test123")
    client2_token = get_token("client2@test.com", "test123")
    
    if not client1_token or not client2_token:
        print("✗ Failed to authenticate clients")
        return
    
    # Client 1 posts 5 jobs
    print("\n  Client 1 (Juan) posting jobs:")
    for i in range(5):
        job_data = {
            "title": JOBS[i]["title"],
            "description": JOBS[i]["description"],
            "price": JOBS[i]["price"],
            "address_masked": JOBS[i]["location"],
            "address_exact": "123 Main St",
            "latitude": 14.5995,
            "longitude": 120.9842,
            "photos_initial": ["https://images.unsplash.com/photo-1581578731117-104f2a41272c"]
        }
        job = create_job(client1_token, job_data)
        if job:
            print(f"    [{i+1}] {JOBS[i]['title']} - ₱{JOBS[i]['price']:,}")
    
    # Client 2 posts 5 jobs
    print(f"\n  Client 2 (Pedro) posting jobs:")
    for i in range(5, 10):
        job_data = {
            "title": JOBS[i]["title"],
            "description": JOBS[i]["description"],
            "price": JOBS[i]["price"],
            "address_masked": JOBS[i]["location"],
            "address_exact": "456 Oak St",
            "latitude": 14.5995,
            "longitude": 120.9842,
            "photos_initial": ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f"]
        }
        job = create_job(client2_token, job_data)
        if job:
            print(f"    [{i-4}] {JOBS[i]['title']} - ₱{JOBS[i]['price']:,}")
    
    print("\n" + "="*70)
    print("  ✅ SETUP COMPLETE!")
    print("="*70)
    
    print("\n📋 MANUAL TESTING WORKFLOW:")
    print("─" * 70)
    print("\n  STEP 1: Login as Cleaner")
    print("    • Email: cleaner1@test.com")
    print("    • Password: test123")
    print("    • Go to 'Find Work' tab")
    print("    • Click 'Accept Job' on jobs you want to claim")
    print("    • Complete the jobs (upload before/after photos)")
    
    print("\n  STEP 2: Login as Client 1")
    print("    • Email: client1@test.com")
    print("    • Password: test123")
    print("    • Check 'My Properties' or 'Recent Activity'")
    print("    • Verify completed jobs show up")
    print("    • Total Spent should match cleaner's earnings")
    
    print("\n  STEP 3: Login as Client 2")
    print("    • Email: client2@test.com")
    print("    • Password: test123")
    print("    • Same verification as Client 1")
    
    print("\n💰 EXPECTED TOTALS:")
    print("─" * 70)
    client1_total = sum(JOBS[i]["price"] for i in range(5))
    client2_total = sum(JOBS[i]["price"] for i in range(5, 10))
    print(f"  • Client 1 Total (if all completed): ₱{client1_total:,}")
    print(f"  • Client 2 Total (if all completed): ₱{client2_total:,}")
    print(f"  • Cleaner Total (if all completed): ₱{client1_total + client2_total:,}")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
