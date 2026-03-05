from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, quests, messages, users, reviews
from models import user, quest, message, quest_application, review

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="KleanerZ API", version="0.1.0")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(quests.router)
app.include_router(messages.router)
app.include_router(users.router)
app.include_router(reviews.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to KleanerZ API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

from fastapi import WebSocket, WebSocketDisconnect
from core.websocket import manager

@app.websocket("/ws/quest-board")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect_quest_board(websocket)
    try:
        while True:
            # Just keep connection alive, we primarily push TO client
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)
