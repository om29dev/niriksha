"""
API Router for Hardware Serial & Simulation Port Configuration.
"""
from fastapi import APIRouter
from app.schemas import PortConfigRequest

def create_ports_router(serial_mgr):
    router = APIRouter(prefix="/api/ports", tags=["ports"])

    @router.get("")
    async def get_ports():
        return {
            "ports": serial_mgr.list_available_ports(),
            "current_port": serial_mgr.port,
            "baudrate": serial_mgr.baudrate,
            "is_simulation": serial_mgr.use_simulation,
            "is_connected": serial_mgr.is_connected,
            "last_error": serial_mgr.last_error
        }

    @router.post("/config")
    async def configure_port(config: PortConfigRequest):
        serial_mgr.set_port(
            port=config.port if not config.use_simulation else None,
            baudrate=config.baudrate,
            use_simulation=config.use_simulation
        )
        return {
            "status": "success",
            "configured_port": config.port,
            "baudrate": config.baudrate,
            "simulation": config.use_simulation
        }

    return router
