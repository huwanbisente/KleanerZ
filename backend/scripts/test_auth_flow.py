
import requests
import random
import string

BASE_URL = "http://127.0.0.1:8000"

def random_string(length=10):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def run_test():
    email = f"test_{random_string()}@kleanerz.com"
    password = "password123"
    role = "client"
    full_name = "Test User"
    
    print(f"Testing Auth Flow for: {email}")
    
    # 1. Register
    print("\n[1] Registering...")
    try:
        reg_payload = {
            "email": email,
            "password": password,
            "role": role,
            "full_name": full_name
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
        if resp.status_code == 200:
            print("✅ Registration Success:", resp.json())
        else:
            print("❌ Registration Failed:", resp.status_code, resp.text)
            return
    except Exception as e:
        print("❌ Registration Exception:", e)
        return

    # 2. Login
    print("\n[2] Logging in...")
    try:
        login_payload = {
            "email": email,
            "password": password
        }
        resp = requests.post(f"{BASE_URL}/auth/token", json=login_payload)
        if resp.status_code == 200:
            token_data = resp.json()
            access_token = token_data['access_token']
            print("✅ Login Success. Token obtained.")
        else:
            print("❌ Login Failed:", resp.status_code, resp.text)
            return
    except Exception as e:
        print("❌ Login Exception:", e)
        return

    # 3. Get Profile
    print("\n[3] Fetching Profile...")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if resp.status_code == 200:
            print("✅ Profile Fetch Success:", resp.json())
        else:
            print("❌ Profile Fetch Failed:", resp.status_code, resp.text)
            return
    except Exception as e:
        print("❌ Profile Exception:", e)
        return

if __name__ == "__main__":
    run_test()
