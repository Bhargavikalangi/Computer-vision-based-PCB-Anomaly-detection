from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Connection manager for WebSocket clients
class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, client_id: str, ws: WebSocket):
        await ws.accept()
        self.active[client_id] = ws
        logger.info(f"WS connected: {client_id}")

    def disconnect(self, client_id: str):
        self.active.pop(client_id, None)
        logger.info(f"WS disconnected: {client_id}")

    async def send(self, client_id: str, data: dict):
        ws = self.active.get(client_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(client_id)

    async def broadcast(self, data: dict):
        for cid, ws in list(self.active.items()):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(cid)


manager = ConnectionManager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await manager.send(client_id, {"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WS error: {e}")
        manager.disconnect(client_id)
