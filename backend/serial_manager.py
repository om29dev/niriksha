"""
Backward-compatibility facade for NIRIKSHA Serial communication.
The core implementation resides in `app.protocols.serial_manager`.
"""
from app.protocols.serial_manager import SerialManager
from app.protocols.normalizer import normalize_mesh_packet

__all__ = ["SerialManager", "normalize_mesh_packet"]
