import requests
import json

API_URL = "http://127.0.0.1:8000"

# Test users configuration
CLIENTS = [
    {"email": "client1@kleanerz.com", "password": "secret123", "name": "Juan Dela Cruz", "role": "client"},
    {"email": "client2@kleanerz.com", "password": "secret123", "name": "Pedro Santos", "role": "client"}
]

CLEANERS = [
    {"email": "cleaner@kleanerz.com", "password": "secret123", "name": "Maria Garcia", "role": "cleaner"},
    {"email": "cleaner2@kleanerz.com", "password": "secret123", "name": "Ana Reyes", "role": "cleaner"}
]

# Job data - 10 jobs total
JOBS = [
    # Client 1's jobs (5 jobs)
    {"title": "Deep Clean 3BR Condo", "description": "Full deep cleaning needed", "price": 3500, "location": "Makati CBD"},
    {"title": "Office Sanitization", "description": "Disinfect entire office space", "price": 5000, "location": "BGC High Street"},
    {"title": "Move-Out Cleaning", "description": "Kitchen and bathroom focus", "price": 2800, "location": "Quezon City"},
    {"title": "Weekly Housekeeping", "description": "Regular maintenance clean", "price": 2000, "location": "Manila Proper"},
    {"title": "Post-Renovation Clean", "description": "Remove construction dust", "price": 4200, "location": "Ortigas Center"},
    
    # Client 2's jobs (5 jobs)
    {"title": "Airbnb Turnover", "description": "Quick turnover between guests", "price": 1800, "location": "BGC High Street"},
    {"title": "Garage Deep Clean", "description": "Organize and sweep garage", "price": 2500, "location": "Alabang Hills"},
    {"title": "Studio Apartment Refresh", "description": "Light cleaning and organizing", "price": 1500, "location": "Makati CBD"},
    {"title": "Luxury Condo Maintenance", "description": "Monthly premium service", "price": 6000, "location": "BGC High Street"},
    {"title": "Kitchen Deep Clean", "description": "Oven, cabinets, and appliances", "price": 3200, "location": "Quezon City"}
]

def get_token(email, password):
    """Get authentication token"""
    try:
        res = requests.post(f"{API_URL}/auth/token", json={"email": email, "password": password})
        if res.status_code == 200:
            return res.json().get("access_token")
        return None
    except Exception as e:
        print(f"  ✗ Error getting token for {email}: {e}")
        return None

def create_user(user_data):
    """Create a user account"""
    try:
        res = requests.post(f"{API_URL}/auth/register", json={
            "email": user_data["email"],
            "password": user_data["password"],
            "full_name": user_data["name"],
            "role": user_data["role"]
        })
        
        if res.status_code == 200:
            print(f"  ✓ Created {user_data['role']}: {user_data['name']} ({user_data['email']})")
            return True
        elif "already registered" in res.text.lower():
            print(f"  ⚠ User already exists: {user_data['email']}")
            return True
        else:
            print(f"  ✗ Failed to create {user_data['email']}: {res.text}")
            return False
    except Exception as e:
        print(f"  ✗ Error creating user: {e}")
        return False

def create_job(client_token, job_data):
    """Create a job posting"""
    try:
        headers = {"Authorization": f"Bearer {client_token}"}
        payload = {
            "title": job_data["title"],
            "description": job_data["description"],
            "price": job_data["price"],
            "address_masked": job_data["location"],
            "address_exact": "123 Main St",
            "latitude": 14.5995,
            "longitude": 120.9842,
            "photos_initial": ["https://images.unsplash.com/photo-1581578731117-104f2a41272c"]
        }
        
        res = requests.post(f"{API_URL}/quests/", json=payload, headers=headers)
        
        if res.status_code == 200:
            return res.json()
        else:
            print(f"  ✗ Failed to create job: {res.text}")
            return None
    except Exception as e:
        print(f"  ✗ Error creating job: {e}")
        return None

def claim_job(cleaner_token, quest_id):
    """Cleaner claims a job"""
    try:
        headers = {"Authorization": f"Bearer {cleaner_token}"}
        res = requests.put(f"{API_URL}/quests/{quest_id}/claim", headers=headers)
        return res.status_code == 200
    except:
        return False

def complete_job(cleaner_token, quest_id):
    """Cleaner completes a job"""
    try:
        headers = {"Authorization": f"Bearer {cleaner_token}"}
        completion_data = {
            "photos_before": ["https://images.unsplash.com/photo-1581578731117-104f2a41272c"],
            "photos_after": ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f"]
        }
        res = requests.put(f"{API_URL}/quests/{quest_id}/complete", json=completion_data, headers=headers)
        return res.status_code == 200
    except:
        return False

def main():
    print("\n" + "="*70)
    print("  KLEANERZ TEST DATA SETUP")
    print("="*70)
    
    # Step 1: Create users
    print("\n[1] Creating Users...")
    print("─" * 70)
    
    for client in CLIENTS:
        create_user(client)
    
    for cleaner in CLEANERS:
        create_user(cleaner)
    
    # Step 2: Get tokens
    print("\n[2] Authenticating Users...")
    print("─" * 70)
    
    client_tokens = []
    for client in CLIENTS:
        token = get_token(client["email"], client["password"])
        if token:
            client_tokens.append(token)
            print(f"  ✓ Authenticated: {client['name']}")
        else:
            print(f"  ✗ Failed to authenticate: {client['email']}")
            return
    
    cleaner_tokens = []
    for cleaner in CLEANERS:
        token = get_token(cleaner["email"], cleaner["password"])
        if token:
            cleaner_tokens.append(token)
            print(f"  ✓ Authenticated: {cleaner['name']}")
        else:
            print(f"  ✗ Failed to authenticate: {cleaner['email']}")
            return
    
    # Step 3: Create jobs
    print("\n[3] Creating Jobs...")
    print("─" * 70)
    
    created_jobs = []
    
    # Client 1 posts first 5 jobs
    print(f"\n  Client 1 ({CLIENTS[0]['name']}) posting jobs:")
    for i in range(5):
        job = create_job(client_tokens[0], JOBS[i])
        if job:
            created_jobs.append(job)
            print(f"    [{i+1}] {JOBS[i]['title']} - ₱{JOBS[i]['price']:,}")
    
    # Client 2 posts next 5 jobs
    print(f"\n  Client 2 ({CLIENTS[1]['name']}) posting jobs:")
    for i in range(5, 10):
        job = create_job(client_tokens[1], JOBS[i])
        if job:
            created_jobs.append(job)
            print(f"    [{i-4}] {JOBS[i]['title']} - ₱{JOBS[i]['price']:,}")
    
    if len(created_jobs) != 10:
        print(f"\n  ✗ Only created {len(created_jobs)}/10 jobs. Aborting.")
        return
    
    # Step 4: Cleaners claim jobs
    print("\n[4] Cleaners Claiming Jobs...")
    print("─" * 70)
    
    # Cleaner 1 claims first 5 jobs
    print(f"\n  Cleaner 1 ({CLEANERS[0]['name']}) claiming jobs:")
    cleaner1_jobs = []
    for i in range(5):
        if claim_job(cleaner_tokens[0], created_jobs[i]['id']):
            cleaner1_jobs.append(created_jobs[i])
            print(f"    ✓ Claimed: {created_jobs[i]['title']}")
    
    # Cleaner 2 claims next 5 jobs
    print(f"\n  Cleaner 2 ({CLEANERS[1]['name']}) claiming jobs:")
    cleaner2_jobs = []
    for i in range(5, 10):
        if claim_job(cleaner_tokens[1], created_jobs[i]['id']):
            cleaner2_jobs.append(created_jobs[i])
            print(f"    ✓ Claimed: {created_jobs[i]['title']}")
    
    # Step 5: Complete some jobs
    print("\n[5] Completing Jobs...")
    print("─" * 70)
    
    # Cleaner 1 completes 3 jobs
    print(f"\n  Cleaner 1 ({CLEANERS[0]['name']}) completing jobs:")
    cleaner1_completed = []
    for i in range(3):
        if complete_job(cleaner_tokens[0], cleaner1_jobs[i]['id']):
            cleaner1_completed.append(cleaner1_jobs[i])
            print(f"    ✓ Completed: {cleaner1_jobs[i]['title']} - ₱{cleaner1_jobs[i]['price']:,}")
    
    # Cleaner 2 completes 4 jobs
    print(f"\n  Cleaner 2 ({CLEANERS[1]['name']}) completing jobs:")
    cleaner2_completed = []
    for i in range(4):
        if complete_job(cleaner_tokens[1], cleaner2_jobs[i]['id']):
            cleaner2_completed.append(cleaner2_jobs[i])
            print(f"    ✓ Completed: {cleaner2_jobs[i]['title']} - ₱{cleaner2_jobs[i]['price']:,}")
    
    # Step 6: Summary
    print("\n" + "="*70)
    print("  SUMMARY")
    print("="*70)
    
    client1_spent = sum(job['price'] for job in cleaner1_completed[:3])
    client2_spent = sum(job['price'] for job in cleaner2_completed[:4])
    
    cleaner1_earned = sum(job['price'] for job in cleaner1_completed)
    cleaner2_earned = sum(job['price'] for job in cleaner2_completed)
    
    print(f"\n📊 CLIENT DASHBOARD TOTALS:")
    print(f"  • Client 1 ({CLIENTS[0]['name']}): ₱{client1_spent:,} spent on {len(cleaner1_completed)} completed jobs")
    print(f"  • Client 2 ({CLIENTS[1]['name']}): ₱{client2_spent:,} spent on {len(cleaner2_completed)} completed jobs")
    
    print(f"\n💰 CLEANER DASHBOARD TOTALS:")
    print(f"  • Cleaner 1 ({CLEANERS[0]['name']}): ₱{cleaner1_earned:,} earned from {len(cleaner1_completed)} completed jobs")
    print(f"  • Cleaner 2 ({CLEANERS[1]['name']}): ₱{cleaner2_earned:,} earned from {len(cleaner2_completed)} completed jobs")
    
    print(f"\n📋 JOB STATUS:")
    print(f"  • Total Jobs Created: 10")
    print(f"  • Jobs Claimed: 10")
    print(f"  • Jobs Completed: 7")
    print(f"  • Jobs In Progress: 3")
    
    print("\n✅ TEST DATA SETUP COMPLETE!")
    print("\n🔐 LOGIN CREDENTIALS:")
    print("─" * 70)
    print("  Clients:")
    for client in CLIENTS:
        print(f"    • {client['email']} / {client['password']}")
    print("\n  Cleaners:")
    for cleaner in CLEANERS:
        print(f"    • {cleaner['email']} / {cleaner['password']}")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
