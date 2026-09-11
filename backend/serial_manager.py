import asyncio
import json
import logging
import time
from typing import Callable, Optional, List, Dict, Any
import serial
import serial.tools.list_ports
from mock_simulator import MockSimulator

logger = logging.getLogger("serial_manager")
logger.setLevel(logging.INFO)


class SerialManager:
    """
    Manages physical COM port serial communication with crash-resistant
    auto-reconnect, packet parsing, and clean decoupling from mock simulation.
    """

    def __init__(
        self,
        port: Optional[str] = None,
        baudrate: int = 115200,
        broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
        use_simulation: bool = False
    ):
        import os
        # Prioritize explicit port, then SERIAL_PORT from .env
        env_port = os.getenv("SERIAL_PORT", "").strip() or None
        env_baud = int(os.getenv("SERIAL_BAUD", str(baudrate)))
        self.port = port or env_port
        self.baudrate = env_baud
        self.broadcast_callback = broadcast_callback
        self.use_simulation = use_simulation
        self.mock_sim = MockSimulator()
        self.is_running = False
        self.is_connected = False
        self.serial_inst: Optional[serial.Serial] = None
        self.seq = 1
        self.last_error = ""

        # Auto-select first available COM port if not simulating and no port provided
        if not self.use_simulation and not self.port:
            available_ports = self.list_available_ports()
            if available_ports:
                self.port = available_ports[0]["device"]
                logger.info(f"Auto-selected physical COM port: {self.port}")

    @staticmethod
    def list_available_ports() -> List[Dict[str, str]]:
        """Scans and lists physical COM ports available on the system."""
        ports = serial.tools.list_ports.comports()
        return [
            {
                "device": p.device,
                "description": p.description,
                "hwid": p.hwid
            }
            for p in ports
        ]

    def set_port(self, port: Optional[str], baudrate: int = 115200, use_simulation: bool = False):
        """Dynamically switch port or switch to/from simulation mode."""
        self.port = port
        self.baudrate = baudrate
        self.use_simulation = use_simulation
        self.seq = 1
        self.mock_sim.reset()
        self.last_error = ""
        if self.serial_inst and self.serial_inst.is_open:
            try:
                self.serial_inst.close()
            except Exception:
                pass
        self.is_connected = False
        logger.info(f"Port config updated & reset: port={port}, baud={baudrate}, sim={use_simulation}")

    def normalize_mesh_packet(self, data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """
        Dynamically inspects the incoming JSON readings.
        Determines CONNECTED vs NOT_CONNECTED purely from whether the reading
        is present and not null/None in the received JSON payload.
        """
        pole_id = int(data.get("pole_id", 1))
        mesh_node_id = data.get("mesh_node_id")
        t = float(data.get("timestamp", time.time()))

        # Extract whatever readings appear in the JSON
        temp_val = data.get("temperature")
        humidity_val = data.get("humidity")
        water_depth_val = data.get("water_depth")
        is_upright_val = data.get("is_upright")
        voltage_val = data.get("voltage")
        current_val = data.get("current", data.get("current_ma"))
        power_val = data.get("power")
        energy_val = data.get("energy")
        freq_val = data.get("frequency")
        pf_val = data.get("pf")

        # Handle gas sensors: either calibrated ppm or raw ADC values from firmware (air_quality_raw, co_raw)
        if data.get("mq7") is not None:
            mq7_val = data.get("mq7")
        elif data.get("co_raw") is not None:
            # Scaled ADC to approximate ppm estimate if raw ADC provided
            raw_co = float(data.get("co_raw", 0))
            mq7_val = round(raw_co * (100.0 / 4095.0), 1) if raw_co > 0 else 0.0
        else:
            mq7_val = None

        if data.get("mq135") is not None:
            mq135_val = data.get("mq135")
        elif data.get("air_quality_raw") is not None:
            # Scaled ADC (0-4095) to ppm (0-300 ppm)
            raw_aq = float(data.get("air_quality_raw", 0))
            mq135_val = round(raw_aq * (300.0 / 4095.0), 1) if raw_aq > 0 else 0.0
        else:
            mq135_val = None

        mq136_val = data.get("mq136")
        mq2_val = data.get("mq2")

        # Purely reading-driven detection: if the value is in the JSON and not None, it's CONNECTED
        def get_sensor_entry(val: Any, unit: str = "") -> Dict[str, Any]:
            if val is not None:
                return {"val": val, "status": "CONNECTED", "unit": unit}
            return {"val": None, "status": "NOT_CONNECTED", "unit": unit}

        sensors = {
            "temperature": get_sensor_entry(temp_val, "°C"),
            "humidity": get_sensor_entry(humidity_val, "%"),
            "water_depth": get_sensor_entry(water_depth_val, "cm"),
            "tilt": {
                "val": 1 if is_upright_val is True else (0 if is_upright_val is False else None),
                "status": "CONNECTED" if is_upright_val is not None else "NOT_CONNECTED",
                "is_upright": is_upright_val
            },
            "voltage": get_sensor_entry(voltage_val, "V"),
            "current": get_sensor_entry(current_val, "A"),
            "power": get_sensor_entry(power_val, "W"),
            "energy": get_sensor_entry(energy_val, "kWh"),
            "frequency": get_sensor_entry(freq_val, "Hz"),
            "pf": get_sensor_entry(pf_val, ""),
            "mq7": get_sensor_entry(mq7_val, "ppm"),
            "mq135": get_sensor_entry(mq135_val, "ppm"),
            "mq136": get_sensor_entry(mq136_val, "ppm"),
            "mq2": get_sensor_entry(mq2_val, "ppm")
        }

        pkt = {
            "seq": data.get("seq", self.seq),
            "timestamp": round(t, 3),
            "pole_id": pole_id,
            "mesh_node_id": mesh_node_id,
            "temperature": sensors["temperature"]["val"],
            "humidity": sensors["humidity"]["val"],
            "water_depth": sensors["water_depth"]["val"],
            "is_upright": sensors["tilt"]["is_upright"],
            "voltage": sensors["voltage"]["val"],
            "current_ma": sensors["current"]["val"],
            "power": sensors["power"]["val"],
            "energy": sensors["energy"]["val"],
            "frequency": sensors["frequency"]["val"],
            "pf": sensors["pf"]["val"],
            "mq7": sensors["mq7"]["val"],
            "mq135": sensors["mq135"]["val"],
            "mq136": sensors["mq136"]["val"],
            "mq2": sensors["mq2"]["val"],
            "sensors": sensors,
            "source": source
        }
        self.seq += 1
        return pkt

    async def run_loop(self):
        """Main lifecycle task handling continuous connection & ingestion."""
        self.is_running = True
        logger.info("[SerialManager] Ingestion loop started.")

        while self.is_running:
            if self.use_simulation:
                self.is_connected = True
                self.last_error = ""
                raw_pkt = self.mock_sim.generate_packet()
                if raw_pkt:
                    pkt = self.normalize_mesh_packet(raw_pkt, source="SIMULATION")
                    if self.broadcast_callback:
                        await self.broadcast_callback(pkt)
                await asyncio.sleep(0.8)  # ~1.25 Hz multi-pole telemetry cycle
                continue

            # Physical Serial Handling: SIMULATION IS STRICTLY STOPPED
            if not self.port:
                # Try auto-detecting an available COM port dynamically
                available = self.list_available_ports()
                if available:
                    self.port = available[0]["device"]
                    logger.info(f"Dynamically discovered & connected COM port: {self.port}")
                else:
                    self.is_connected = False
                    self.last_error = "No COM port selected or detected"
                    await asyncio.sleep(2.0)
                    continue

            try:
                if not self.serial_inst or not self.serial_inst.is_open:
                    logger.info(f"Attempting connection to physical serial port: {self.port} @ {self.baudrate}...")
                    self.serial_inst = serial.Serial(
                        port=self.port,
                        baudrate=self.baudrate,
                        timeout=1.0
                    )
                    self.serial_inst.reset_input_buffer()
                    self.is_connected = True
                    self.last_error = ""
                    logger.info(f"Connected successfully to physical {self.port}. Simulation halted.")

                # Read line in a non-blocking thread executor
                loop = asyncio.get_running_loop()
                raw_bytes = await loop.run_in_executor(None, self.serial_inst.readline)

                if raw_bytes:
                    raw_str = raw_bytes.decode("utf-8", errors="ignore").strip()
                    if raw_str:
                        # Resilient parsing: extract JSON payload if MESH_JSON prefix exists anywhere or starts with {
                        json_str = None
                        if "MESH_JSON:" in raw_str:
                            json_str = raw_str.split("MESH_JSON:", 1)[1].strip()
                        elif "{" in raw_str and "}" in raw_str:
                            start_idx = raw_str.find("{")
                            end_idx = raw_str.rfind("}") + 1
                            json_str = raw_str[start_idx:end_idx]

                        if json_str:
                            try:
                                data = json.loads(json_str)
                                if isinstance(data, dict):
                                    source = f"SERIAL:{self.port}"
                                    normalized = self.normalize_mesh_packet(data, source=source)
                                    if self.broadcast_callback:
                                        await self.broadcast_callback(normalized)
                            except json.JSONDecodeError:
                                logger.debug(f"JSONDecodeError for line: {raw_str}")
                        else:
                            logger.debug(f"Non-JSON raw line received: {raw_str}")
                await asyncio.sleep(0.01)

            except serial.SerialException as se:
                self.is_connected = False
                self.last_error = str(se)
                logger.warning(f"Serial port disconnected or unavailable ({self.port}): {se}. Reconnecting in 2s...")
                if self.serial_inst:
                    try:
                        self.serial_inst.close()
                    except Exception:
                        pass
                    self.serial_inst = None
                await asyncio.sleep(2.0)
            except Exception as e:
                logger.error(f"Unexpected error in serial loop: {e}")
                await asyncio.sleep(1.0)

    def stop(self):
        """Stop the loop and clean up connections."""
        self.is_running = False
        if self.serial_inst and self.serial_inst.is_open:
            try:
                self.serial_inst.close()
            except Exception:
                pass
            self.serial_inst = None
        self.is_connected = False
