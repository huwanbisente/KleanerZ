import requests

API_URL = "http://127.0.0.1:8000"

def get_token(email, password):
    res = requests.post(f"{API_URL}/auth/token", json={"email": email, "password": password})
    return res.json().get("access_token") if res.status_code == 200 else None

def verify_data():
    print("\n" + "="*80)
    print("  DATABASE RELATIONSHIP VERIFICATION")
    print("="*80)
    
    # Test accounts
    accounts = [
        ("client1@kleanerz.com", "Client 1 - Juan Dela Cruz"),
        ("client2@kleanerz.com", "Client 2 - Pedro Santos"),
        ("cleaner@kleanerz.com", "Cleaner 1 - Maria Garcia"),
        ("cleaner2@kleanerz.com", "Cleaner 2 - Ana Reyes")
    ]
    
    for email, name in accounts:
        token = get_token(email, "secret123")
        if not token:
            print(f"\n✗ Failed to authenticate {email}")
            continue
        
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{API_URL}/quests/my-missions", headers=headers)
        
        if res.status_code != 200:
            print(f"\n✗ Failed to fetch data for {email}")
            continue
        
        jobs = res.json()
        
        # Calculate totals
        total_jobs = len(jobs)
        pending = len([j for j in jobs if j.get('status') == 'pending'])
        claimed = len([j for j in jobs if j.get('status') == 'claimed'])
        completed = len([j for j in jobs if j.get('status') == 'completed'])
        
        total_amount = sum(j.get('price', 0) for j in jobs if j.get('status') == 'completed')
        
        print(f"\n{'─'*80}")
        print(f"👤 {name}")
        print(f"   Email: {email}")
        print(f"{'─'*80}")
        print(f"   Total Jobs: {total_jobs}")
        print(f"   • Pending: {pending}")
        print(f"   • Claimed: {claimed}")
        print(f"   • Completed: {completed}")
        
        if 'client' in email:
            print(f"   💰 Total Spent (Completed): ₱{total_amount:,.0f}")
        else:
            print(f"   💰 Total Earned (Completed): ₱{total_amount:,.0f}")
        
        if completed > 0:
            print(f"\n   📋 Completed Jobs:")
            for job in jobs:
                if job.get('status') == 'completed':
                    print(f"      • {job['title']}: ₱{job['price']:,.0f}")
    
    print("\n" + "="*80)
    print("  ✅ VERIFICATION COMPLETE")
    print("="*80)
    print("\n  The amounts should match:")
    print("    • Client 1's Total Spent = Cleaner 1's Total Earned")
    print("    • Client 2's Total Spent = Cleaner 2's Total Earned")
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    verify_data()
