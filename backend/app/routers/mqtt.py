from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional


class MqttConfigRequest(BaseModel):
    host: str
    port: int = 1883
    topic: str = "niriksha/poles/+/telemetry"
    username: Optional[str] = None
    password: Optional[str] = None


def create_mqtt_router(mqtt_mgr):
    router = APIRouter(prefix="/api/mqtt", tags=["mqtt"])

    @router.get("")
    async def get_mqtt_status():
        """Returns the active operational status of the MQTT broker client."""
        return mqtt_mgr.get_status()

    @router.post("/config")
    async def configure_mqtt(config: MqttConfigRequest):
        """Updates MQTT client configuration and triggers reconnection."""
        mqtt_mgr.host = config.host
        mqtt_mgr.port = config.port
        mqtt_mgr.topic = config.topic
        mqtt_mgr.username = config.username
        mqtt_mgr.password = config.password
        mqtt_mgr.stop()
        return {"status": "success", "message": f"MQTT target set to {config.host}:{config.port}"}

    return router
