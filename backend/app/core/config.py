import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Locate and load environment variables from backend/.env
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BACKEND_DIR / ".env")


def _get_bool(key: str, default: bool) -> bool:
    val = os.getenv(key)
    if val is None:
        return default
    return val.strip().lower() in ("true", "1", "yes", "on")


class Settings:
    # PostgreSQL Configuration
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    DB_NAME: str = os.getenv("DB_NAME", "iot_dashboard")
    DB_MIN_POOL: int = int(os.getenv("DB_MIN_POOL_SIZE", "2"))
    DB_MAX_POOL: int = int(os.getenv("DB_MAX_POOL_SIZE", "10"))

    # Batch Flushing
    BATCH_INTERVAL_SEC: float = float(os.getenv("BATCH_FLUSH_INTERVAL_MS", "300")) / 1000.0
    BATCH_MAX_SIZE: int = int(os.getenv("BATCH_BUFFER_MAX_SIZE", "50"))

    # HTTP Server
    SERVER_HOST: str = os.getenv("SERVER_HOST", "127.0.0.1")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "8000"))

    # Physical Serial COM
    SERIAL_PORT: Optional[str] = os.getenv("SERIAL_PORT", "").strip() or None
    SERIAL_BAUD: int = int(os.getenv("SERIAL_BAUD", "115200"))

    # Industrial MQTT Broker
    MQTT_ENABLED: bool = _get_bool("MQTT_ENABLED", True)
    MQTT_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_TOPIC: str = os.getenv("MQTT_TOPIC", "niriksha/poles/+/telemetry")
    MQTT_USERNAME: Optional[str] = os.getenv("MQTT_USERNAME", "").strip() or None
    MQTT_PASSWORD: Optional[str] = os.getenv("MQTT_PASSWORD", "").strip() or None
    MQTT_CLIENT_ID: str = os.getenv("MQTT_CLIENT_ID", "niriksha_backend_ingestor")

    # Ollama AI Engine
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")
    SAVE_AI_MARKDOWN: bool = _get_bool("SAVE_AI_MARKDOWN", True)
    AI_MARKDOWN_DIR: Path = BACKEND_DIR / os.getenv("AI_MARKDOWN_DIR", "data/ai_logs")


settings = Settings()
