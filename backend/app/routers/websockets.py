"""
WebSocket Endpoints for Real-Time Streaming Telemetry.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.connection_manager import ws_manager

def create_ws_router(serial_mgr):
    router = APIRouter(tags=["websockets"])

    @router.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        await ws_manager.connect(websocket)

        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "port": serial_mgr.port,
            "simulation": serial_mgr.use_simulation,
            "is_connected": serial_mgr.is_connected
        })

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            ws_manager.disconnect(websocket)
        except Exception:
            ws_manager.disconnect(websocket)

    return router
