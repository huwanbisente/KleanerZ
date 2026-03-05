import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def register(email, password, role, name):
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "email": email,
            "password": password,
            "role": role,
            "full_name": name
        })
        if res.status_code == 200:
            return res.json()["access_token"]
        # If already exists, login
        if res.status_code == 400:
            return login(email, password)
        print(f"Register failed for {name}: {res.text}")
        return None
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def login(email, password):
    data = {"email": email, "password": password}
    res = requests.post(f"{BASE_URL}/auth/token", json=data)
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Login failed for {email}. Status: {res.status_code}, Response: {res.text}")
    return None

def test_messaging():
    print("--- Testing Messaging Flow ---")
    
    # 1. Setup Users
    token_client = register("client_msg@test.com", "password123", "client", "Client Cathy")
    token_cleaner = register("cleaner_msg@test.com", "password123", "cleaner", "Cleaner Carl")
    
    if not token_client or not token_cleaner:
        print("Failed to get tokens. Is backend running?")
        return

    headers_client = {"Authorization": f"Bearer {token_client}"}
    headers_cleaner = {"Authorization": f"Bearer {token_cleaner}"}

    # 2. Search (Client looks for Cleaner)
    print("\n1. Client searching for Cleaner...")
    res = requests.get(f"{BASE_URL}/users/search?role=cleaner&query=Carl", headers=headers_client)
    if res.status_code == 200:
        users = res.json()
        print(f"Search found {len(users)} users.")
        target_user = next((u for u in users if u["email"] == "cleaner_msg@test.com"), None)
        if target_user:
            print(f"Found target: {target_user['full_name']} (ID: {target_user['id']})")
            cleaner_id = target_user['id']
        else:
            print("Target cleaner not found in search.")
            return
    else:
        print(f"Search failed: {res.text}")
        return

    # 3. Client sends message
    print("\n2. Client sending message...")
    msg_content = "Hello Carl, are you free tomorrow?"
    res = requests.post(f"{BASE_URL}/messages/", json={
        "recipient_id": cleaner_id,
        "content": msg_content
    }, headers=headers_client)
    
    if res.status_code == 200:
        print("Message sent successfully.")
    else:
        print(f"Failed to send message: {res.text}")
        return

    # 4. Cleaner checks inbox
    print("\n3. Cleaner checking inbox...")
    res = requests.get(f"{BASE_URL}/messages/inbox/conversations", headers=headers_cleaner)
    if res.status_code == 200:
        inbox = res.json()
        print(f"Cleaner has {len(inbox)} conversations.")
        conv = next((c for c in inbox if c["other_user_name"] == "Client Cathy"), None)
        if conv:
            print(f"Found conversation with {conv['other_user_name']}. Last msg: '{conv['last_message']}'")
            if conv['unread_count'] > 0:
                print("Pass: Message is unread.")
            else:
                print("Fail: Message marked as read improperly.")
        else:
            print("Conversation not found in inbox.")
    else:
        print(f"Failed to fetch inbox: {res.text}")

    # 5. Cleaner replies
    # Need client ID first. In real app, we get it from conversation or search. 
    # For test, we can get it from the conversation object above if we parse correctly, or just search.
    # We will search for Cathy.
    res = requests.get(f"{BASE_URL}/users/search?query=Cathy", headers=headers_cleaner)
    client_id = res.json()[0]['id']

    print("\n4. Cleaner replying...")
    res = requests.post(f"{BASE_URL}/messages/", json={
        "recipient_id": client_id,
        "content": "Yes, I am available!"
    }, headers=headers_cleaner)
    if res.status_code == 200:
        print("Reply sent.")

    # 6. Client checks specific conversation
    print("\n5. Client viewing conversation...")
    res = requests.get(f"{BASE_URL}/messages/{cleaner_id}", headers=headers_client)
    if res.status_code == 200:
        msgs = res.json()
        print(f"Conversation history has {len(msgs)} messages.")
        for m in msgs:
            sender = "Me" if m['sender_id'] != cleaner_id else "Carl"
            print(f"- {sender}: {m['content']}")
    
    print("\n--- Test Complete ---")

if __name__ == "__main__":
    test_messaging()
