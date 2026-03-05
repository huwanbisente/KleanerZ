# Product Requirements Document (PRD): KleanerZ MVP

## 1. Executive Summary
KleanerZ is a gig-economy platform for residential cleaning services. It uses a "Claim-and-Go" model (similar to Grab/Angkas) rather than a traditional booking system. It targets Gen-Z users with a high-transparency, visual-first interface and a "Mission-based" user experience.

## 2. User Roles & Access Control
The system uses a single-app entry point with Role-Based Access Control (RBAC).

*   **Guest**: Can view public landing pages and "teaser" listings (blurred location).
*   **Client (Quest-Giver)**: Can create job listings, manage payments, and track cleaner progress.
*   **Cleaner (Quest-Taker)**: Can browse a real-time "Quest Board," claim jobs, and manage their earnings wallet.

## 3. Functional Requirements

### 3.1 Quest Management (The Core Engine)
*   **Listing Creation**: Clients must provide:
    *   Title & Description (e.g., "Post-Party Reset").
    *   Photos of the space (Room-by-room).
    *   Geolocation (Browser-detected + manual adjustment).
    *   Flat-fee price (Bidding optional for V2).
*   **The "Claim" Logic**:
    *   Jobs are broadcasted to Cleaners within a set radius (e.g., 5km–10km).
*   **Race Condition Handling**: First-come, first-served. Once a job is "Claimed," it is removed from the public board instantly.
*   **Proof of Work**: Cleaners must upload "Before" and "After" photos via the browser camera to move the job to "Completed" status.

### 3.2 Live Interaction
*   **Real-time Status**: `PENDING` -> `CLAIMED` -> `EN_ROUTE` -> `IN_PROGRESS` -> `COMPLETED` -> `PAID`.
*   **In-App Messaging**: Basic chat between Client and Cleaner once a job is claimed.
*   **GPS Tracking**: Periodic location pings from the Cleaner’s browser to the Client’s dashboard while the job is active.

### 3.3 Wallet & Payments
*   **Escrow System**: Funds are authorized on the Client's card/wallet when the job is posted and "locked" when a cleaner claims it.
*   **Payouts**: Funds are released to the Cleaner’s virtual wallet upon Client approval or 24 hours post-completion (auto-approval).

## 4. Technical Specifications

### 4.1 Frontend (React/Next.js)
*   **PWA Setup**: Must be installable on Home Screen; `manifest.json` and Service Workers for offline-lite capability.
*   **Design System**: Dark Theme / Cyber-Terminal aesthetic (Neon accents, high-contrast text).
*   **API Integration**: Use Axios/Fetch to talk to the Python backend.

### 4.2 Backend (Python/FastAPI)
*   **WebSockets**: Essential for the `/ws/quest-board` endpoint to push new jobs to cleaners without refreshing.
*   **Auth**: JWT-based authentication.
*   **Image Storage**: Integration with Cloudinary or AWS S3 for before/after photos.

### 4.3 Database Schema (High-Level)
*   **Users**: `id`, `email`, `role`, `wallet_balance`, `avg_rating`.
*   **Quests**: `id`, `client_id`, `cleaner_id (nullable)`, `status`, `price`, `lat/long`, `photos_json`.
*   **Reviews**: `quest_id`, `rating`, `comment`, `target_user_id`.

## 5. Security & Safety
*   **ID Verification**: Cleaners must have a "Verified" flag in the DB before claiming jobs.
*   **Location Privacy**: Precise house numbers are hidden from Cleaners until they click "Claim Quest."
*   **Emergency Trigger**: A "Report Issue" button visible to both parties during an active mission.

## 6. Development Roadmap (MVP)
*   **Phase 1**: Auth system + RBAC (Client vs. Cleaner views).
*   **Phase 2**: "Post Quest" flow and "Quest Board" listing.
*   **Phase 3**: Claim logic (handling the race condition) and basic status updates.
*   **Phase 4**: Image upload integration and Wallet UI.
