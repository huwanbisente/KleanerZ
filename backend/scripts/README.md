# Backend Utility Scripts

This folder contains utility scripts for database management, testing, and setup.

## 🔧 Production Setup Scripts

### `create_production_accounts.py`
**Purpose**: Creates real production accounts for the application  
**Usage**: `python scripts/create_production_accounts.py`  
**Creates**:
- 2 Client accounts (juan@kleanerz.com, pedro@kleanerz.com)
- 2 Cleaner accounts (maria@kleanerz.com, ana@kleanerz.com)
- Password for all: `klean123`

### `reset_and_setup.py`
**Purpose**: Complete reset - kills servers, cleans DB, restarts, creates accounts  
**Usage**: `python scripts/reset_and_setup.py`  
**Warning**: This will delete ALL data!

---

## 🗄️ Database Management

### `clean_db.py`
**Purpose**: Deletes the entire database file  
**Usage**: `python scripts/clean_db.py`  
**Note**: Requires server to be stopped first

### `delete_all_jobs.py`
**Purpose**: Deletes all jobs but keeps user accounts  
**Usage**: `python scripts/delete_all_jobs.py`  
**Note**: Can run while server is running

### `fix_schema.py`
**Purpose**: Shows instructions for fixing database schema issues  
**Usage**: `python scripts/fix_schema.py`

---

## 🧪 Testing & Development Scripts

### `seed_jobs.py`
**Purpose**: Creates 12 sample job listings for testing  
**Usage**: `python scripts/seed_jobs.py`  
**Note**: Requires a client account to be logged in

### `setup_test_data.py`
**Purpose**: Creates comprehensive test dataset (2 clients, 2 cleaners, 10 jobs)  
**Usage**: `python scripts/setup_test_data.py`  
**Note**: For automated testing only

### `setup_manual_test.py`
**Purpose**: Sets up accounts and jobs for manual testing  
**Usage**: `python scripts/setup_manual_test.py`

### `verify_data.py`
**Purpose**: Verifies database relationships and shows current state  
**Usage**: `python scripts/verify_data.py`  
**Output**: Shows all users, jobs, and totals

### `fresh_start.py`
**Purpose**: Creates test accounts without any jobs  
**Usage**: `python scripts/fresh_start.py`

---

## 🛠️ Server Management

### `kill_servers.py`
**Purpose**: Stops all running Python/uvicorn processes  
**Usage**: `python scripts/kill_servers.py`  
**Warning**: Kills ALL Python processes!

---

## 📝 Deprecated/Legacy Scripts

### `create_cleaner.py`
**Purpose**: Creates a single cleaner account  
**Status**: Replaced by `create_production_accounts.py`

### `link_jobs.py`
**Purpose**: Links existing jobs between clients and cleaners  
**Status**: For testing only

---

## 🚀 Quick Start Guide

**For Production Setup:**
```bash
# 1. Stop any running servers
python scripts/kill_servers.py

# 2. Clean database
python scripts/clean_db.py

# 3. Start server
.\venv\Scripts\uvicorn main:app --reload

# 4. Create production accounts
python scripts/create_production_accounts.py
```

**For Testing:**
```bash
# Delete all jobs but keep accounts
python scripts/delete_all_jobs.py

# Or create test data
python scripts/setup_test_data.py
```

---

## ⚠️ Important Notes

- Always stop the server before running `clean_db.py`
- Use `delete_all_jobs.py` if you want to keep user accounts
- Production accounts use `@kleanerz.com` domain
- Test accounts use `@test.com` domain
- All scripts assume the server is running on `http://127.0.0.1:8000`
