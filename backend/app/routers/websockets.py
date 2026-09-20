from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.connection_manager import ws_manager


def create_ws_router(serial_mgr, mqtt_mgr):
    router = APIRouter(tags=["websockets"])

    @router.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        await ws_manager.connect(websocket)

        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "serial_port": serial_mgr.port,
            "serial_connected": serial_mgr.is_connected,
            "mqtt_connected": mqtt_mgr.is_connected,
            "mqtt_host": mqtt_mgr.host,
            "mqtt_topic": mqtt_mgr.topic
        })

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await ws_manager.disconnect(websocket)
        except Exception:
            await ws_manager.disconnect(websocket)

    return router
