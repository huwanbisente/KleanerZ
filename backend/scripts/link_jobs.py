import requests
import json

API_URL = "http://127.0.0.1:8000"

def get_token(email, password):
    """Get authentication token"""
    try:
        res = requests.post(f"{API_URL}/auth/token", json={
            "email": email, 
            "password": password
        })
        return res.json().get("access_token")
    except Exception as e:
        print(f"Error logging in: {e}")
        return None

def link_jobs_to_client_and_cleaner():
    """
    This script will:
    1. Get the client token (test@kleanerz.com)
    2. Get the cleaner token (cleaner@kleanerz.com)
    3. Fetch all pending jobs
    4. Have the cleaner claim 5 jobs
    5. Mark 3 of them as completed
    
    This creates a realistic dataset where:
    - Client sees their posted jobs (some pending, some claimed, some completed)
    - Cleaner sees their claimed/completed jobs
    - Total spent (client) should match total earnings (cleaner) for completed jobs
    """
    
    # Get tokens
    client_token = get_token("test@kleanerz.com", "secret123")
    cleaner_token = get_token("cleaner@kleanerz.com", "secret123")
    
    if not client_token or not cleaner_token:
        print("Failed to authenticate. Make sure both users exist.")
        return
    
    print("✓ Authenticated both users")
    
    # Get all pending quests
    res = requests.get(f"{API_URL}/quests/")
    if res.status_code != 200:
        print(f"Failed to fetch quests: {res.text}")
        return
    
    quests = res.json()
    print(f"✓ Found {len(quests)} pending quests")
    
    if len(quests) < 5:
        print("⚠ Not enough quests. Run seed_jobs.py first.")
        return
    
    # Cleaner claims 5 jobs
    claimed_jobs = []
    for i, quest in enumerate(quests[:5]):
        quest_id = quest['id']
        headers = {"Authorization": f"Bearer {cleaner_token}"}
        res = requests.put(f"{API_URL}/quests/{quest_id}/claim", headers=headers)
        
        if res.status_code == 200:
            claimed_jobs.append(res.json())
            print(f"  [{i+1}] Cleaner claimed: {quest['title']} (₱{quest['price']})")
        else:
            print(f"  [✗] Failed to claim quest {quest_id}: {res.text}")
    
    print(f"\n✓ Cleaner claimed {len(claimed_jobs)} jobs")
    
    # Mark first 3 as completed
    completed_count = 0
    total_earnings = 0
    
    for i, job in enumerate(claimed_jobs[:3]):
        quest_id = job['id']
        headers = {"Authorization": f"Bearer {cleaner_token}"}
        
        completion_data = {
            "photos_before": ["https://images.unsplash.com/photo-1581578731117-104f2a41272c"],
            "photos_after": ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f"]
        }
        
        res = requests.put(
            f"{API_URL}/quests/{quest_id}/complete", 
            json=completion_data,
            headers=headers
        )
        
        if res.status_code == 200:
            completed_count += 1
            total_earnings += job['price']
            print(f"  [{i+1}] Completed: {job['title']} (₱{job['price']})")
        else:
            print(f"  [✗] Failed to complete quest {quest_id}: {res.text}")
    
    print(f"\n{'='*60}")
    print(f"✓ SUMMARY:")
    print(f"  - Client (test@kleanerz.com) posted jobs")
    print(f"  - Cleaner (cleaner@kleanerz.com) claimed {len(claimed_jobs)} jobs")
    print(f"  - Cleaner completed {completed_count} jobs")
    print(f"  - Total earnings for cleaner: ₱{total_earnings:,.0f}")
    print(f"  - Client's total spent (completed): ₱{total_earnings:,.0f}")
    print(f"\n✓ Both dashboards should now show matching totals!")
    print(f"{'='*60}")

if __name__ == "__main__":
    link_jobs_to_client_and_cleaner()
