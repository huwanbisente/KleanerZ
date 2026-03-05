import requests
import json
import random

API_URL = "http://127.0.0.1:8000"

# Unsplash Image IDs for consistent, realistic cleaning/home images
IMAGES = [
    "https://images.unsplash.com/photo-1581578731117-104f2a41272c?q=80&w=1080", # Living room
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1080", # Kitchen
    "https://images.unsplash.com/photo-1527513123882-397ad98a53e3?q=80&w=1080", # Clean bedroom
    "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=1080", # Bathroom
    "https://images.unsplash.com/photo-1505691938895-1758d7140464?q=80&w=1080", # Minimalist room
    "https://images.unsplash.com/photo-1630699144339-420f59b4747b?q=80&w=1080", # Cleaning supplies
    "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=1080"  # Cleaner at work
]

TITLES = [
    "Deep Clean for 2BR Apartment",
    "Post-Renovation Dusting",
    "Weekly Housekeeping - Bungalow",
    "Move-Out Clean (Kitchen Focus)",
    "Studio Apartment Refresh",
    "Backyard Patio & Grill Cleaning",
    "Office Space Sanitization",
    "Garage Organization & Sweep",
    "Luxury Condo Monthly Maintenance",
    "Airbnb Turnover Service"
]

LOCATIONS = [
    {"masked": "Manila Proper", "exact": "123 Rizal Ave", "lat": 14.6091, "lon": 120.9821},
    {"masked": "Makati CBD", "exact": "45 Ayala Ave", "lat": 14.5547, "lon": 121.0244},
    {"masked": "BGC High Street", "exact": "88 5th Ave", "lat": 14.5454, "lon": 121.0493},
    {"masked": "Quezon City Circle", "exact": "22 Elliptical Rd", "lat": 14.6514, "lon": 121.0493},
    {"masked": "Ortigas Center", "exact": "500 Julia Vargas", "lat": 14.5866, "lon": 121.0615},
    {"masked": "Alabang Hills", "exact": "10 Acacia Ave", "lat": 14.4445, "lon": 121.0437}
]

DESCRIPTIONS = [
    "Standard cleaning required. Must have own supplies (vacuum, mop). Friendly dog on premises.",
    "Dust is everywhere after sanding floors. Need detailed dusting of walls, shelves, and baseboards.",
    "Looking for a regular cleaner. This is a trial run. 3 hours max.",
    "Moving out next week. Focus on oven, fridge interior, and cabinets.",
    "Quick refresh needed before guests arrive tonight. Vacuum, wipe surfaces, and bathroom deep clean."
]

def get_client_token():
    try:
        res = requests.post(f"{API_URL}/auth/token", json={
            "email": "test@kleanerz.com", 
            "password": "secret123"
        })
        return res.json().get("access_token")
    except Exception as e:
        print(f"Error logging in: {e}")
        return None

def seed_jobs():
    token = get_client_token()
    if not token:
        print("Failed to get token. Make sure server is running and user exists.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    print("Seeding Job Listings with Images...")
    
    for _ in range(12):
        loc = random.choice(LOCATIONS)
        payload = {
            "title": random.choice(TITLES),
            "description": random.choice(DESCRIPTIONS),
            "price": random.randint(1500, 8000), 
            "latitude": loc["lat"] + random.uniform(-0.01, 0.01), # Add jitter so they don't stack
            "longitude": loc["lon"] + random.uniform(-0.01, 0.01),
            "address_masked": loc["masked"],
            "address_exact": loc["exact"],
            "photos_initial": [random.choice(IMAGES)] 
        }
        
        res = requests.post(f"{API_URL}/quests/", json=payload, headers=headers)
        if res.status_code == 200:
            print(f" [+] Posted: {payload['title']} (${payload['price']})")
        else:
            print(f" [-] Failed: {res.text}")

if __name__ == "__main__":
    seed_jobs()
