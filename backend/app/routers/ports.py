from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional


class PortConfigRequest(BaseModel):
    port: Optional[str] = None
    baudrate: int = 115200


def create_ports_router(serial_mgr):
    router = APIRouter(prefix="/api/ports", tags=["ports"])

    @router.get("")
    async def get_ports():
        return {
            "ports": serial_mgr.list_available_ports(),
            "current_port": serial_mgr.port,
            "baudrate": serial_mgr.baudrate,
            "is_connected": serial_mgr.is_connected,
            "last_error": serial_mgr.last_error
        }

    @router.post("/config")
    async def configure_port(config: PortConfigRequest):
        serial_mgr.set_port(port=config.port, baudrate=config.baudrate)
        return {
            "status": "success",
            "configured_port": config.port,
            "baudrate": config.baudrate
        }

    return router
