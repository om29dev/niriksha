import os
import json
import logging
import datetime
from typing import Optional, List, Dict, Any
import httpx
from app.core.config import settings
from app.ai.schemas import ChatMessage

logger = logging.getLogger("ai.ollama")


def get_ollama_host() -> str:
    return settings.OLLAMA_HOST


def get_ollama_model() -> str:
    return settings.OLLAMA_MODEL


def save_ollama_config(host: str, model: str):
    settings.OLLAMA_HOST = host
    settings.OLLAMA_MODEL = model


def save_chat_to_markdown(
    user_message: str,
    ai_reply: str,
    source: str,
    latest_by_pole: Dict[int, Dict[str, Any]],
    active_alerts_count: int
):
    """Persists chat prompt, AI response, and telemetry snapshot to Markdown."""
    if not settings.SAVE_AI_MARKDOWN:
        return

    try:
        log_dir = settings.AI_MARKDOWN_DIR
        log_dir.mkdir(parents=True, exist_ok=True)
        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        log_path = log_dir / f"ai_dialog_{date_str}.md"

        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"\n## [{now_str}] Query via {source}\n\n")
            f.write(f"**Operator:** {user_message}\n\n")
            f.write(f"**NIRIKSHA AI:**\n\n{ai_reply}\n\n")
            f.write(f"*Context: {len(latest_by_pole)} poles online, {active_alerts_count} active alerts.*\n")
            f.write("---\n")
    except Exception as e:
        logger.warning(f"Failed to log chat interaction to Markdown: {e}")


def query_ollama(
    prompt: str,
    history: List[ChatMessage],
    latest_by_pole: Dict[int, Dict[str, Any]],
    active_alerts: List[Dict[str, Any]]
) -> Optional[str]:
    """Sends prompt with injected telemetry context to local Ollama instance."""
    host = settings.OLLAMA_HOST.rstrip("/")
    model = settings.OLLAMA_MODEL

    context_lines = ["Current Infrastructure Telemetry:"]
    for p in [1, 2, 3]:
        d = latest_by_pole.get(p)
        if d:
            context_lines.append(
                f"Pole {p}: Upright={d.get('is_upright')}, Volt={d.get('voltage')}V, "
                f"Depth={d.get('water_depth')}cm, Temp={d.get('temperature')}°C, "
                f"MQ7={d.get('mq7')}ppm, MQ135={d.get('mq135')}ppm"
            )
    context_lines.append(f"Active Unresolved Alerts: {len(active_alerts)}")
    context_str = "\n".join(context_lines)

    messages = [
        {
            "role": "system",
            "content": (
                "You are NIRIKSHA AI, an industrial safety and infrastructure intelligence assistant. "
                "Provide direct, concise, factual diagnostic replies based strictly on the telemetry context.\n"
                f"{context_str}"
            )
        }
    ]

    for h in history[-4:]:
        messages.append({"role": h.role, "content": h.content})

    messages.append({"role": "user", "content": prompt})

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                f"{host}/api/chat",
                json={"model": model, "messages": messages, "stream": False}
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("message", {}).get("content", "").strip()
    except Exception as e:
        logger.debug(f"Ollama inference unavailable ({e}), falling back to heuristic engine.")

    return None
