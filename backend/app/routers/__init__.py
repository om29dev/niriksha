from .ports import create_ports_router
from .mqtt import create_mqtt_router
from .telemetry import create_telemetry_router
from .websockets import create_ws_router
from .alerts import create_alerts_router
from .ai_assistant import create_ai_assistant_router

__all__ = [
    "create_ports_router",
    "create_mqtt_router",
    "create_telemetry_router",
    "create_ws_router",
    "create_alerts_router",
    "create_ai_assistant_router",
]
