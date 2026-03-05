<h1 align="center">KLeanerZ</h1>

<p align="center">
  A modern, Gen-Z focused gig-economy platform for residential cleaning services, using a "Claim-and-Go" model.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Author-Jan%20Vincent%20Chioco-red?style=flat-square" alt="Author">
  <img src="https://img.shields.io/badge/Frontend-Next.js%20%2B%20React-green?style=flat-square" alt="Frontend">
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-blue?style=flat-square&logo=python&logoColor=white" alt="Backend">
  <img src="https://img.shields.io/badge/Database-SQLite%20%2B%20SQLAlchemy-lightgrey?style=flat-square" alt="Database">
</p>

---

*   If you find this project impressive for a portfolio, please consider giving it a star!

**KLeanerZ** is a high-transparency marketplace designed for the next generation of clients and cleaners. It replaces traditional, slow booking systems with a real-time "Quest Board" where cleaners can instantly claim jobs, and clients can track progress through visual "Proof of Work" (Before/After photos).

The system features robust **Role-Based Access Control (RBAC)**, real-time updates via **WebSockets**, and a curated "Cyber-Terminal" aesthetic.

---

## 🏗️ System Architecture

KLeanerZ utilizes a decoupled architecture to ensure real-time performance and scalability of the "Quest" lifecycle.

```mermaid
graph TD
    subgraph Frontend [Next.js Web App]
        UI[React Components / Dashboard]
        ST[State Management / Hooks]
        WS_C[WebSocket Client]
    end

    subgraph Backend [FastAPI Server]
        API[REST Endpoints]
        WS_S[WebSocket Manager - 'The Pulse']
        AUTH[JWT / Bcrypt Security]
    end

    subgraph Database [Storage Layer]
        DB[(SQLite / SQLAlchemy)]
    end

    subgraph Services [External APIs]
        MAPS[Leaflet / Nominatim Geocoding]
    end

    UI --> API
    UI --> WS_C
    WS_C <--> WS_S
    API --> AUTH
    AUTH --> DB
    API --> DB
    WS_S --> DB
    UI --> MAPS
```

### 🔄 The Quest Lifecycle Flow

The "Claim-and-Go" engine handles race conditions ensures the first-come, first-served logic.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB
    participant Kleaner

    Client->>Server: Create Job (Title, Price, Location)
    Server->>DB: Save Quest (Status: PENDING)
    Server-->>Kleaner: [WebSocket] Broadcast NEW_QUEST
    Kleaner->>Server: Claim Quest
    Server->>DB: Update Status: CLAIMED
    Kleaner->>Server: Complete Quest (Upload Photos)
    Server->>DB: Update Status: PENDING_APPROVAL
    Client->>Server: Approve & Release
    Server->>DB: Update Status: COMPLETED
```

---

## � User Interface

The application features a modern "Cyber-Terminal" dark theme with neon accents, optimized for both desktop and mobile PWA usage.

### Landing & Discovery
High-conversion landing page with role-selection for Clients and KleanerZ.
![Landing Page](frontend/public/screenshots/landing.png)

### Quest Board (Kleaner View)
Real-time feed of available jobs with map integration and instant claiming.
![Quest Board](frontend/public/screenshots/quest_board.png)

### Client Management Dashboard
Track active jobs, review applicants, and release payments upon approval.
![Client Dashboard](frontend/public/screenshots/client_dash.png)

### Real-Time Messaging
In-app communication between participants once a quest is active.
![Messaging](frontend/public/screenshots/messaging.png)

---

## ⚡ Features

*   **The Pulse (WebSockets)**: Instant job broadcasting to all nearby cleaners.
*   **Proof of Work**: Visual verification system (Before/After photos) for transparency.
*   **Smart Geocoding**: Automatic address verification and demand heatmapping via Leaflet.
*   **Wallet System**: Integrated earnings tracking and automated payment release flow.
*   **Role-Based Security**: Secure JWT authentication with 24h session tokens.
*   **PWA Ready**: Installable on home screens for a native mobile experience.

---

## 🛠️ Requirements

*   **Python**: 3.10+
*   **Node.js**: 18.x or higher
*   **Database**: SQLite (built-in) or PostgreSQL

---

## 🚀 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/huwanbisente/KleanerZ.git
   cd KleanerZ
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python scripts/setup_test_data.py # Seeds the DB with demo accounts
   uvicorn main:app --reload
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🔑 Demo Access

Explore the platform perspectives using these pre-seeded demo accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Client** | `demo_client@kleanerz.com` | `password123` |
| **Kleaner** | `demo_cleaner@kleanerz.com` | `password123` |

---

## � Project Structure

```text
├── backend/                # FastAPI Application
│   ├── core/               # Auth & WebSockets
│   ├── models/             # SQLAlchemy Models
│   ├── routers/            # API Endpoints
│   ├── schemas/            # Pydantic Types
│   └── scripts/            # Seed & Utility Scripts
├── frontend/               # Next.js Application
│   ├── src/
│   │   ├── components/     # UI Design System
│   │   ├── pages/          # Dashboards & Auth
│   │   └── utils/          # API Handlers
└── README.md
```
