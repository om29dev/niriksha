import asyncio
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("connection_manager")


class ConnectionManager:
    """Thread-safe WebSocket connection registry for broadcasting real-time telemetry."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
            count = len(self.active_connections)
        logger.info(f"WebSocket client connected. Total active: {count}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                count = len(self.active_connections)
                logger.info(f"WebSocket client disconnected. Total active: {count}")

    async def broadcast(self, message: Dict[str, Any]):
        async with self._lock:
            clients = list(self.active_connections)

        if not clients:
            return

        dead_sockets = []
        for ws in clients:
            try:
                await ws.send_json(message)
            except Exception:
                dead_sockets.append(ws)

        if dead_sockets:
            async with self._lock:
                for ws in dead_sockets:
                    if ws in self.active_connections:
                        self.active_connections.remove(ws)


ws_manager = ConnectionManager()
