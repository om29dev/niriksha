import json
import asyncio
import logging
from typing import Callable, Optional, List, Dict, Any
import serial
import serial.tools.list_ports
from app.core.config import settings
from app.protocols.normalizer import normalize_mesh_packet

logger = logging.getLogger("protocols.serial")


class SerialManager:
    """Manages physical COM port ingestion with auto-reconnection and fault tolerance."""

    def __init__(
        self,
        port: Optional[str] = None,
        baudrate: int = 115200,
        broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
    ):
        self.port = port or settings.SERIAL_PORT
        self.baudrate = baudrate or settings.SERIAL_BAUD
        self.broadcast_callback = broadcast_callback
        self.is_running = False
        self.is_connected = False
        self.serial_inst: Optional[serial.Serial] = None
        self.seq = 1
        self.last_error = ""

        # Auto-discover COM port if not specified
        if not self.port:
            available = self.list_available_ports()
            if available:
                self.port = available[0]["device"]
                logger.info(f"Auto-selected COM port: {self.port}")

    @staticmethod
    def list_available_ports() -> List[Dict[str, str]]:
        """Enumerates physical COM ports available on the host."""
        ports = serial.tools.list_ports.comports()
        return [{"device": p.device, "description": p.description, "hwid": p.hwid} for p in ports]

    def set_port(self, port: Optional[str], baudrate: int = 115200):
        """Updates connection parameters and re-triggers connection loop."""
        self.port = port
        self.baudrate = baudrate
        self.seq = 1
        self.last_error = ""
        self._close_serial()
        logger.info(f"Serial port updated: port={port}, baud={baudrate}")

    def _close_serial(self):
        if self.serial_inst:
            try:
                if self.serial_inst.is_open:
                    self.serial_inst.close()
            except Exception:
                pass
            self.serial_inst = None
        self.is_connected = False

    async def run_loop(self):
        """Main non-blocking read loop handling connection lifecycle."""
        self.is_running = True
        logger.info("Serial ingestion loop started.")

        while self.is_running:
            if not self.port:
                available = self.list_available_ports()
                if available:
                    self.port = available[0]["device"]
                    logger.info(f"Discovered COM port: {self.port}")
                else:
                    self.is_connected = False
                    self.last_error = "No COM port selected or available"
                    await asyncio.sleep(2.0)
                    continue

            try:
                if not self.serial_inst or not self.serial_inst.is_open:
                    logger.info(f"Opening physical serial port: {self.port} @ {self.baudrate} baud...")
                    self.serial_inst = serial.Serial(port=self.port, baudrate=self.baudrate, timeout=1.0)
                    self.serial_inst.reset_input_buffer()
                    self.is_connected = True
                    self.last_error = ""
                    logger.info(f"Successfully connected to serial device on {self.port}")

                loop = asyncio.get_running_loop()
                raw_bytes = await loop.run_in_executor(None, self.serial_inst.readline)

                if raw_bytes:
                    raw_str = raw_bytes.decode("utf-8", errors="ignore").strip()
                    if raw_str:
                        json_str = self._extract_json(raw_str)
                        if json_str:
                            try:
                                data = json.loads(json_str)
                                if isinstance(data, dict):
                                    source = f"SERIAL:{self.port}"
                                    pkt = normalize_mesh_packet(data, source=source, seq=self.seq)
                                    self.seq += 1
                                    if self.broadcast_callback:
                                        await self.broadcast_callback(pkt)
                            except json.JSONDecodeError:
                                logger.debug(f"JSON decode error for payload: {raw_str}")

                await asyncio.sleep(0.01)

            except (serial.SerialException, OSError, PermissionError) as se:
                self.is_connected = False
                self.last_error = str(se)
                logger.warning(f"Serial port {self.port} connection error: {se}. Reconnecting in 2s...")
                self._close_serial()
                await asyncio.sleep(2.0)
            except Exception as e:
                logger.error(f"Unexpected exception in serial loop: {e}")
                await asyncio.sleep(1.0)

    @staticmethod
    def _extract_json(raw_str: str) -> Optional[str]:
        if "MESH_JSON:" in raw_str:
            return raw_str.split("MESH_JSON:", 1)[1].strip()
        if "{" in raw_str and "}" in raw_str:
            start = raw_str.find("{")
            end = raw_str.rfind("}") + 1
            return raw_str[start:end]
        return None

    def stop(self):
        """Stops the ingestion loop and closes the port."""
        self.is_running = False
        self._close_serial()
