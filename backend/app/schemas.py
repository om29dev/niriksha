"""
FastAPI Pydantic Schemas for IoT Telemetry & Serial Port Configuration.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class PortConfigRequest(BaseModel):
    port: Optional[str] = None
    baudrate: int = 115200
    use_simulation: bool = False


class SensorPoint(BaseModel):
    val: Optional[float] = None
    status: str
    unit: Optional[str] = None
    is_upright: Optional[bool] = None


class TelemetryResponse(BaseModel):
    data: List[Dict[str, Any]]
