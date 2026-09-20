import json
import asyncio
import logging
from typing import Callable, Optional, Dict, Any
import aiomqtt
from app.core.config import settings
from app.protocols.normalizer import normalize_mesh_packet

logger = logging.getLogger("protocols.mqtt")


class MqttManager:
    """Manages asynchronous MQTT broker connection, topic subscriptions, and telemetry ingestion."""

    def __init__(
        self,
        broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
    ):
        self.broadcast_callback = broadcast_callback
        self.host = settings.MQTT_HOST
        self.port = settings.MQTT_PORT
        self.topic = settings.MQTT_TOPIC
        self.username = settings.MQTT_USERNAME
        self.password = settings.MQTT_PASSWORD
        self.client_id = settings.MQTT_CLIENT_ID
        self.is_enabled = settings.MQTT_ENABLED

        self.is_running = False
        self.is_connected = False
        self.last_error = ""
        self.seq = 1
        self.client: Optional[aiomqtt.Client] = None

    def get_status(self) -> Dict[str, Any]:
        """Returns current operational status of the MQTT client."""
        return {
            "enabled": self.is_enabled,
            "connected": self.is_connected,
            "host": self.host,
            "port": self.port,
            "topic": self.topic,
            "client_id": self.client_id,
            "last_error": self.last_error
        }

    async def run_loop(self):
        """Asynchronous subscription loop with automatic reconnection."""
        if not self.is_enabled:
            logger.info("MQTT telemetry ingestion is disabled in settings.")
            return

        self.is_running = True
        logger.info(f"MQTT service active: connecting to {self.host}:{self.port}, topic: {self.topic}")

        reconnect_interval = 2.0
        while self.is_running:
            try:
                async with aiomqtt.Client(
                    hostname=self.host,
                    port=self.port,
                    username=self.username,
                    password=self.password,
                    identifier=self.client_id,
                    timeout=5.0
                ) as client:
                    self.client = client
                    self.is_connected = True
                    self.last_error = ""
                    reconnect_interval = 2.0
                    logger.info(f"Connected to MQTT broker [{self.host}:{self.port}]. Subscribing to '{self.topic}'...")

                    await client.subscribe(self.topic)
                    # Also subscribe to root telemetry topic if distinct
                    if self.topic != "telemetry/#":
                        await client.subscribe("telemetry/#")

                    async for message in client.messages:
                        if not self.is_running:
                            break
                        await self._process_message(message)

            except (aiomqtt.MqttError, OSError) as e:
                self.is_connected = False
                self.client = None
                self.last_error = str(e)
                logger.warning(f"MQTT connection lost or unavailable ({self.host}:{self.port}): {e}. Retrying in {reconnect_interval:.0f}s...")
                await asyncio.sleep(reconnect_interval)
                reconnect_interval = min(reconnect_interval * 1.5, 30.0)
            except Exception as e:
                self.is_connected = False
                self.client = None
                self.last_error = str(e)
                logger.error(f"Unexpected MQTT worker error: {e}")
                await asyncio.sleep(5.0)

    async def _process_message(self, message: aiomqtt.Message):
        """Decodes raw MQTT payload and routes through packet normalizer."""
        try:
            payload_str = message.payload.decode("utf-8", errors="ignore").strip()
            if not payload_str:
                return

            data = json.loads(payload_str)
            if not isinstance(data, dict):
                return

            # Extract pole_id from topic if not present in body (e.g. niriksha/poles/2/telemetry)
            topic_str = str(message.topic)
            if "pole_id" not in data and "poles/" in topic_str:
                parts = topic_str.split("/")
                idx = parts.index("poles") + 1
                if idx < len(parts) and parts[idx].isdigit():
                    data["pole_id"] = int(parts[idx])

            source = f"MQTT:{topic_str}"
            pkt = normalize_mesh_packet(data, source=source, seq=self.seq)
            self.seq += 1

            if self.broadcast_callback:
                await self.broadcast_callback(pkt)

        except json.JSONDecodeError:
            logger.debug(f"Invalid JSON payload on topic {message.topic}")
        except Exception as e:
            logger.error(f"Error parsing MQTT packet on {message.topic}: {e}")

    async def publish_alert(self, alert: Dict[str, Any]):
        """Publishes alert event to MQTT broker topic."""
        if not self.client or not self.is_connected:
            return
        try:
            topic = f"niriksha/poles/{alert.get('pole_id', 1)}/alerts"
            payload = json.dumps(alert)
            await self.client.publish(topic, payload=payload, qos=1)
        except Exception as e:
            logger.warning(f"Failed to publish alert to MQTT: {e}")

    def stop(self):
        """Terminates MQTT loop gracefully."""
        self.is_running = False
        self.is_connected = False
        self.client = None
