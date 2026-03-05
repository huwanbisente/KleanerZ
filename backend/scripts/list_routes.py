import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

print("\n" + "="*50)
print("  LISTING ALL BACKEND ROUTES")
print("="*50)

for route in app.routes:
    methods = getattr(route, "methods", None)
    path = getattr(route, "path", None)
    name = getattr(route, "name", None)
    print(f"Path: {path} | Methods: {methods} | Name: {name}")

print("="*50 + "\n")
