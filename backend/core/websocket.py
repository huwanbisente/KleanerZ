from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.quest_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.quest_connections:
            self.quest_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    # Specific channel for Quest Updates
    async def connect_quest_board(self, websocket: WebSocket):
        await websocket.accept()
        self.quest_connections.append(websocket)

    async def broadcast_quest_update(self, message: dict):
        # In a real app we'd convert dict to JSON string
        import json
        json_msg = json.dumps(message)
        for connection in self.quest_connections:
            try:
                await connection.send_text(json_msg)
            except:
                self.disconnect(connection)

manager = ConnectionManager()
