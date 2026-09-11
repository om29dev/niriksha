"""
AI Telemetry Assistant API Router.
Provides offline domain-intelligent responses for telemetry queries,
hazard analysis, node diagnostics, and mitigation advice.
"""
import os
import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_recent_telemetry, get_alerts, get_telemetry_stats

class ChatMessage(BaseModel):
    role: str # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    active_pole: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    context_summary: Dict[str, Any]
    timestamp: float

def build_offline_ai_response(
    query: str,
    latest_by_pole: Dict[int, Dict[str, Any]],
    active_alerts: List[Dict[str, Any]],
    stats_data: Dict[str, Any]
) -> str:
    """
    Offline Domain-Specific Rule & Inference Engine for NIRIKSHA IoT Platform.
    Evaluates query intents: health assessment, voltage safety, submersion, gas leaks,
    hardware mesh topology, and specific sensor values.
    """
    q = query.lower().strip()
    
    # Check current system hazard conditions
    voltage_hazards = [p for p, data in latest_by_pole.items() if (data.get("voltage") or 0) > 5.0]
    fallen_poles = [p for p, data in latest_by_pole.items() if data.get("is_upright") is False]
    flood_poles = [p for p, data in latest_by_pole.items() if (data.get("water_depth") or 0) > 100.0]
    
    gas_alerts = []
    for p, data in latest_by_pole.items():
        if (data.get("mq7") or 0) > 50:
            gas_alerts.append(f"Pole {p}: CO Carbon Monoxide high ({data.get('mq7')} ppm)")
        if (data.get("mq135") or 0) > 150:
            gas_alerts.append(f"Pole {p}: Poor Air Quality ({data.get('mq135')} ppm)")
        if (data.get("mq136") or 0) > 15:
            gas_alerts.append(f"Pole {p}: H2S Sewer Gas Breach ({data.get('mq136')} ppm)")

    # 1. Health / Overall Status
    if any(k in q for k in ["health", "status", "overview", "diagnos", "system state", "condition", "how is the system"]):
        lines = ["### 🩺 NIRIKSHA Fleet Health & Diagnostic Report\n"]
        if not voltage_hazards and not fallen_poles and not flood_poles and not gas_alerts:
            lines.append("✅ **Overall Fleet Condition: NORMAL / OPTIMAL**")
            lines.append("All 3 field poles are currently communicating upright with safe environmental metrics.\n")
        else:
            lines.append("⚠️ **Overall Fleet Condition: HAZARD ALERTS ACTIVE**\n")
            if voltage_hazards:
                lines.append(f"- 🔴 **ELECTROCUTION RISK:** Voltage leakage (>5V) detected on **Pole {', '.join(map(str, voltage_hazards))}**! Water probe potential is elevated.")
            if fallen_poles:
                lines.append(f"- 🚨 **STRUCTURAL TILT:** Pole collapse or horizontal tilt reported on **Pole {', '.join(map(str, fallen_poles))}** via SW-520D switch.")
            if flood_poles:
                lines.append(f"- 🌊 **SUBMERSION LEVEL:** Water depth exceeds 100cm flood threshold on **Pole {', '.join(map(str, flood_poles))}**.")
            if gas_alerts:
                lines.append(f"- ☣️ **AIR / GAS BREACH:** {'; '.join(gas_alerts)}")
        
        lines.append("\n**Current Mesh Telemetry Snapshot:**")
        for pole_id in [1, 2, 3]:
            data = latest_by_pole.get(pole_id)
            if data:
                v = data.get("voltage")
                d = data.get("water_depth")
                p = data.get("power")
                t = data.get("temperature")
                upright_str = "Upright" if data.get("is_upright") is not False else "FALLEN/TILTED"
                lines.append(f"- **Pole {pole_id}**: {upright_str} | Volt: {f'{v:.1f}V' if v is not None else 'N/A'} | Depth: {f'{d:.1f}cm' if d is not None else 'N/A'} | Power: {f'{p:.1f}W' if p is not None else 'N/A'} | Temp: {f'{t:.1f}°C' if t is not None else 'N/A'}")
            else:
                lines.append(f"- **Pole {pole_id}**: No recent packet received (Offline).")
        return "\n".join(lines)

    # 2. Voltage / Electrocution Hazards
    if any(k in q for k in ["volt", "electric", "shock", "current", "power", "energy"]):
        lines = ["### ⚡ Electrical Grid & Voltage Safety Diagnostic\n"]
        p1 = latest_by_pole.get(1, {})
        p2 = latest_by_pole.get(2, {})
        v1 = p1.get("voltage")
        v2 = p2.get("voltage")
        p2_power = p2.get("power")
        p2_curr = p2.get("current_ma")

        lines.append(f"- **Pole 1 (Water Leakage Voltage Probe):** {f'{v1:.2f} V' if v1 is not None else 'No reading'}")
        if v1 is not None and v1 > 5.0:
            lines.append("  ⚠️ **DANGER:** Lethal potential detected in street water (>5.0V). Audio sirens and lockout relays are engaged.")
        else:
            lines.append("  ✅ Safe baseline (< 5.0V threshold).")

        lines.append(f"- **Pole 2 (PZEM-004T AC Grid Telemetry):**")
        lines.append(f"  - AC Voltage: {f'{v2:.1f} V' if v2 is not None else 'Not Connected'}")
        lines.append(f"  - Current Draw: {f'{p2_curr:.1f} mA' if p2_curr is not None else 'Not Connected'}")
        lines.append(f"  - Active Power: {f'{p2_power:.1f} W' if p2_power is not None else 'Not Connected'}")
        return "\n".join(lines)

    # 3. Water / Flood / Depth
    if any(k in q for k in ["water", "depth", "flood", "submersion", "ultrasonic"]):
        lines = ["### 🌊 Water Depth & Flood Assessment\n"]
        p1 = latest_by_pole.get(1, {})
        depth = p1.get("water_depth")
        lines.append(f"- **Pole 1 HC-SR04 Ultrasonic Sensor:** {f'{depth:.1f} cm' if depth is not None else 'Not connected'}")
        if depth is not None:
            if depth > 100:
                lines.append("⚠️ **CRITICAL INUNDATION:** Water depth has surpassed the 100cm flood threshold. Rapid drain intervention required.")
            elif depth > 50:
                lines.append("🟡 **WARNING:** Moderate water accumulation (50cm - 100cm). Monitoring trend.")
            else:
                lines.append("✅ Water level is well within nominal drainage limits (< 50cm).")
        else:
            lines.append("Note: Water depth sensing is physically provisioned on Pole 1.")
        return "\n".join(lines)

    # 4. Gas / Chemical / Air Quality
    if any(k in q for k in ["gas", "air", "ppm", "mq", "smoke", "carbon monoxide", "co", "h2s", "ammonia"]):
        lines = ["### 🌬️ Gas Sensor & Air Quality Analysis\n"]
        p3 = latest_by_pole.get(3, {})
        mq7 = p3.get("mq7")
        mq135 = p3.get("mq135")
        mq136 = p3.get("mq136")

        lines.append(f"- **MQ-7 (Carbon Monoxide):** {f'{mq7:.1f} ppm' if mq7 is not None else 'N/A'} (Threshold: >50 ppm)")
        lines.append(f"- **MQ-135 (Air Quality / NH3):** {f'{mq135:.1f} ppm' if mq135 is not None else 'N/A'} (Threshold: >150 ppm)")
        lines.append(f"- **MQ-136 (Hydrogen Sulfide Sewer Gas):** {f'{mq136:.1f} ppm' if mq136 is not None else 'N/A'} (Threshold: >15 ppm)")

        if gas_alerts:
            lines.append("\n⚠️ **Immediate Attention Needed:**")
            for alert in gas_alerts:
                lines.append(f"- {alert}")
        else:
            lines.append("\n✅ All gas concentrations are within safe occupational thresholds.")
        return "\n".join(lines)

    # 5. Pole Tilt / Collapse
    if any(k in q for k in ["tilt", "fallen", "fall", "collapse", "orientation", "gyro"]):
        lines = ["### 📐 Structural Pole Orientation Status\n"]
        for p in [1, 2, 3]:
            data = latest_by_pole.get(p, {})
            is_upright = data.get("is_upright")
            if is_upright is False:
                lines.append(f"- 🚨 **Pole {p}: TILTED / COLLAPSED!** SW-520D switch indicates tilt deviation from vertical.")
            elif is_upright is True:
                lines.append(f"- ✅ **Pole {p}: Vertically Upright & Secure.**")
            else:
                lines.append(f"- ❓ **Pole {p}: No orientation data available.**")
        return "\n".join(lines)

    # 6. Alerts Summary
    if any(k in q for k in ["alert", "warning", "unresolved", "incident", "issue"]):
        lines = ["### 🚨 Active Persistent Alerts Summary\n"]
        if not active_alerts:
            lines.append("✅ **No Unresolved Alerts:** The system currently has 0 active incident records.")
        else:
            lines.append(f"There are currently **{len(active_alerts)} unresolved incident(s)**:")
            for a in active_alerts[:5]:
                p = a.get("pole_id")
                sev = a.get("severity", "info").upper()
                title = a.get("title")
                val = a.get("trigger_value")
                unit = a.get("unit", "")
                val_str = f" ({val} {unit})" if val is not None else ""
                lines.append(f"- `[{sev}]` **Pole {p}:** {title}{val_str}")
        return "\n".join(lines)

    # 7. Mesh Architecture / painlessMesh explanation
    if any(k in q for k in ["mesh", "painlessmesh", "architecture", "hub", "relay", "esp32", "communication"]):
        return (
            "### 📡 NIRIKSHA Mesh Topology Overview\n"
            "- **Node 1 (ESP32):** Environmental & Flood Relay Node (2300ms cadence, HC-SR04, ZMPT101B, Tilt).\n"
            "- **Node 2 (ESP32):** Power Grid Monitoring Relay Node (2500ms cadence, PZEM-004T, Tilt).\n"
            "- **Node 3 (Root Hub ESP32):** Mesh Master & Sink (`mesh.setRoot(true)`), weather & air quality array, emits UART frames over USB to FastAPI.\n"
            "- **Radio Protocol:** 2.4 GHz RF ESP-NOW painlessMesh ad-hoc topology with staggered cadence to prevent RF packet collision.\n"
            "- **Storage & Streaming:** FastAPI decoupled in-memory batch buffers flushes every 300ms to PostgreSQL with WebSocket distribution to the React dashboard."
        )

    # 8. Work recommendations / Action items / What should I do / Status
    attention_items = []
    if voltage_hazards:
        attention_items.append(f"🔴 **Urgent Action (Pole {', '.join(map(str, voltage_hazards))}):** Water electrification detected (>5V). Dispatch electrical crew and ensure lockout relay activation.")
    if fallen_poles:
        attention_items.append(f"🚨 **Urgent Action (Pole {', '.join(map(str, fallen_poles))}):** Pole tilt / collapse indicated. Send structural inspection team.")
    if flood_poles:
        attention_items.append(f"🌊 **Priority Action (Pole {', '.join(map(str, flood_poles))}):** Inundation exceeds 100cm flood line. Initiate storm drain pumping.")
    if gas_alerts:
        attention_items.append(f"☣️ **Safety Action:** Environmental gas threshold breach: {'; '.join(gas_alerts)}.")

    if attention_items:
        return (
            "### 🛠️ Priority Action & Work Required\n\n"
            + "\n\n".join(attention_items)
            + "\n\n**Recommendation:** Address the safety hazards above first before conducting routine maintenance."
        )

    # If no hazards, dynamic operational overview
    return (
        "### 🟢 System Status & Work Assessment\n\n"
        "**All mesh poles (Pole 1, Pole 2, Pole 3) are communicating nominally with 0 active safety hazards.**\n\n"
        "**Current Node Overview:**\n"
        f"- **Pole 1 (Flood/Tilt):** Upright, water voltage safe ({latest_by_pole.get(1, {}).get('voltage', 'N/A')}V), water depth nominal ({latest_by_pole.get(1, {}).get('water_depth', 'N/A')}cm).\n"
        f"- **Pole 2 (Power Grid):** Upright, AC grid voltage {latest_by_pole.get(2, {}).get('voltage', 'N/A')}V, active load {latest_by_pole.get(2, {}).get('power', 'N/A')}W.\n"
        f"- **Pole 3 (Hub/Air):** Upright, temperature {latest_by_pole.get(3, {}).get('temperature', 'N/A')}°C, all MQ gas sensors below safety thresholds.\n\n"
        "**Where to work:** No urgent physical field intervention is currently required. Recommended routine tasks: check physical battery backups and calibrate sensor offsets if needed."
    )


import json
import logging
import urllib.request
import urllib.error
from datetime import datetime

logger = logging.getLogger("ai_assistant")

def get_ollama_host() -> str:
    return os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")

def get_ollama_model() -> str:
    return os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")

def save_ollama_config(host: str, model: str):
    """Updates in-memory environment and persists OLLAMA_HOST and OLLAMA_MODEL to backend/.env."""
    os.environ["OLLAMA_HOST"] = host.rstrip("/")
    os.environ["OLLAMA_MODEL"] = model.strip()

    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    try:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            keys_to_update = {
                "OLLAMA_HOST": host.rstrip("/"),
                "OLLAMA_MODEL": model.strip()
            }
            updated = set()
            for line in lines:
                matched = False
                for k, v in keys_to_update.items():
                    if line.startswith(f"{k}="):
                        new_lines.append(f"{k}={v}\n")
                        updated.add(k)
                        matched = True
                        break
                if not matched:
                    new_lines.append(line)
            for k, v in keys_to_update.items():
                if k not in updated:
                    new_lines.append(f"{k}={v}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
    except Exception as err:
        logger.warning(f"Failed to persist Ollama config to .env: {err}")

class OllamaConfigRequest(BaseModel):
    host: str
    model: str

SAVE_AI_MARKDOWN = os.getenv("SAVE_AI_MARKDOWN", "true").lower() in ("true", "1", "yes")
AI_MARKDOWN_DIR = os.getenv("AI_MARKDOWN_DIR", "data/ai_logs")
PROMPT_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "ollama_system_prompt.md")

def load_system_prompt_template() -> str:
    """Loads base system prompt instructions from markdown file with safe fallback."""
    try:
        if os.path.exists(PROMPT_FILE_PATH):
            with open(PROMPT_FILE_PATH, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    return content
    except Exception as e:
        logger.warning(f"Failed to read prompt markdown from {PROMPT_FILE_PATH}: {e}")
    return (
        "You are NIRIKSHA AI, an operational industrial safety engineer with full real-time access to physical sensor telemetry.\n"
        "You have complete visibility over all smart poles (Pole 1, Pole 2, Pole 3) and live hardware streams.\n"
        "CRITICAL INSTRUCTIONS:\n"
        "- NEVER say 'I don't have access to real-time data' or 'I cannot monitor physical locations' because you DO have live data below.\n"
        "- When the operator asks what the status is or where they have to work, inspect the live telemetry and alerts below and give a direct, practical answer.\n"
        "- If all sensors are safe, tell them all poles are nominal and state whether any maintenance is needed.\n"
        "- If any pole has high voltage, tilt, flood, or gas alerts, point directly to that pole as the priority work location."
    )

def save_chat_to_markdown(
    user_message: str,
    ai_reply: str,
    source: str,
    latest_by_pole: Dict[int, Dict[str, Any]],
    active_alerts_count: int
):
    """Saves user prompt and generated AI response into structured Markdown logs."""
    if not SAVE_AI_MARKDOWN:
        return
    try:
        base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), AI_MARKDOWN_DIR)
        os.makedirs(base_dir, exist_ok=True)
        
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
        file_path = os.path.join(base_dir, f"ai_chat_{date_str}.md")
        
        entry = (
            f"\n## 💬 Query Session - {timestamp_str}\n"
            f"- **Engine**: `{source}`\n"
            f"- **Active Poles**: {list(latest_by_pole.keys())}\n"
            f"- **Active Alerts**: {active_alerts_count}\n\n"
            f"### 👤 Operator Prompt\n"
            f"{user_message.strip()}\n\n"
            f"### 🤖 AI Response (Markdown)\n"
            f"{ai_reply.strip()}\n\n"
            f"---\n"
        )
        
        # If new file, add top-level document title
        if not os.path.exists(file_path):
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"# NIRIKSHA Telemetry AI Diagnostic Logs - {date_str}\n\nThis file automatically stores all operator queries and AI inferences.\n\n---\n")
                f.write(entry)
        else:
            with open(file_path, "a", encoding="utf-8") as f:
                f.write(entry)
    except Exception as err:
        logger.warning(f"Failed to save AI chat to markdown: {err}")

def query_ollama(
    prompt: str,
    history: List[ChatMessage],
    latest_by_pole: Dict[int, Dict[str, Any]],
    active_alerts: List[Dict[str, Any]]
) -> Optional[str]:
    """Queries local Ollama inference server with full real-time telemetry injected as context."""
    ollama_host = get_ollama_host()
    model_name = get_ollama_model()

    # Build refined live telemetry context
    telemetry_lines = []
    for pole_id in [1, 2, 3]:
        d = latest_by_pole.get(pole_id)
        if not d:
            telemetry_lines.append(f"Pole {pole_id}: Offline / No packets received yet")
            continue

        parts = []
        upright = d.get("is_upright")
        parts.append(f"State={'Upright' if upright is not False else 'FALLEN/TILTED'}")

        if pole_id == 1:
            v = d.get('voltage')
            depth = d.get('water_depth')
            parts.append(f"Water Leakage Potential={f'{v:.2f}V' if v is not None else 'N/A'}")
            parts.append(f"Flood Depth={f'{depth:.1f}cm' if depth is not None else 'N/A'}")
        elif pole_id == 2:
            v = d.get('voltage')
            c = d.get('current_ma')
            p = d.get('power')
            parts.append(f"PZEM Grid Voltage={f'{v:.1f}V' if v is not None else 'N/A'}")
            parts.append(f"Current={f'{c:.1f}mA' if c is not None else 'N/A'}")
            parts.append(f"Power={f'{p:.1f}W' if p is not None else 'N/A'}")
        elif pole_id == 3:
            t = d.get('temperature')
            h = d.get('humidity')
            parts.append(f"Temp={f'{t:.1f}°C' if t is not None else 'N/A'}")
            parts.append(f"Humidity={f'{h:.1f}%' if h is not None else 'N/A'}")
            parts.append(f"MQ7 CO={d.get('mq7')}ppm")
            parts.append(f"MQ135 Air={d.get('mq135')}ppm")
            parts.append(f"MQ136 H2S={d.get('mq136')}ppm")

        telemetry_lines.append(f"- Pole {pole_id}: " + ", ".join(parts))

    alerts_lines = []
    for a in active_alerts[:5]:
        p = a.get('pole_id')
        title = a.get('title')
        sev = a.get('severity', 'warning').upper()
        alerts_lines.append(f"- [{sev}] Pole {p}: {title}")

    base_instructions = load_system_prompt_template()
    system_prompt = (
        f"{base_instructions}\n\n"
        "LIVE TELEMETRY SNAPSHOT:\n"
        + ("\n".join(telemetry_lines) if telemetry_lines else "No node telemetry currently recorded.") + "\n\n"
        "ACTIVE INCIDENT ALERTS:\n"
        + ("\n".join(alerts_lines) if alerts_lines else "None. All parameters within nominal thresholds.") + "\n\n"
        "FORMAT: Concise GitHub Markdown (headers, bullet points, bold text). Answer immediately."
    )


    user_message_content = (
        f"{prompt.strip()}\n\n"
        "[CONTEXT FROM TELEMETRY & ALERTS]\n"
        + ("\n".join(telemetry_lines) if telemetry_lines else "No node telemetry currently recorded.") + "\n\n"
        + ("Active Alerts:\n" + "\n".join(alerts_lines) if alerts_lines else "No active alerts.")
    )

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-8:]:
        if h.role in ("user", "assistant"):
            messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": user_message_content})


    payload = {
        "model": model_name,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 400
        }
    }

    req = urllib.request.Request(
        f"{ollama_host}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15.0) as resp:
            if resp.status == 200:
                result = json.loads(resp.read().decode("utf-8"))
                reply = result.get("message", {}).get("content", "").strip()
                # If model hallucinates a canned refusal disclaimer or stalls asking operator for data, reject it
                refusal_phrases = [
                    "don't have access to real-time",
                    "cannot assist with that",
                    "don't have access to live",
                    "i am an ai language model",
                    "please provide me with",
                    "i'll need to review",
                    "need you to provide",
                    "to provide you with the current state, please"
                ]
                if reply and not any(phrase in reply.lower() for phrase in refusal_phrases):
                    return reply

    except Exception as e:
        logger.warning(f"Ollama chat inference failed: {e}")
    return None



def create_ai_assistant_router():
    router = APIRouter(prefix="/api/ai", tags=["ai-assistant"])

    @router.post("/chat", response_model=ChatResponse)
    async def chat_with_assistant(req: ChatRequest):
        try:
            # Gather fresh telemetry and alert context from database
            recent = await get_recent_telemetry(limit=60)
            latest_by_pole: Dict[int, Dict[str, Any]] = {}
            for r in reversed(recent):
                p_id = r.get("pole_id")
                if p_id and p_id not in latest_by_pole:
                    latest_by_pole[p_id] = r

            active_alerts = await get_alerts(status="UNRESOLVED", limit=20)
            stats = await get_telemetry_stats()

            # Attempt Ollama local LLM inference first
            reply_text = query_ollama(
                prompt=req.message,
                history=req.history or [],
                latest_by_pole=latest_by_pole,
                active_alerts=active_alerts
            )

            source = f"Ollama ({get_ollama_model()})"
            if not reply_text:
                # Fallback smoothly to offline heuristic rule engine
                source = "Offline Heuristic Rule Engine"
                reply_text = build_offline_ai_response(
                    query=req.message,
                    latest_by_pole=latest_by_pole,
                    active_alerts=active_alerts,
                    stats_data=stats
                )

            # Persist prompt and AI response to Markdown log
            save_chat_to_markdown(
                user_message=req.message,
                ai_reply=reply_text,
                source=source,
                latest_by_pole=latest_by_pole,
                active_alerts_count=len(active_alerts)
            )

            context_summary = {
                "engine": source,
                "active_poles": list(latest_by_pole.keys()),
                "active_alerts_count": len(active_alerts),
                "total_telemetry_records": stats.get("total_records", 0) if stats else 0
            }

            return ChatResponse(
                reply=reply_text,
                context_summary=context_summary,
                timestamp=time.time()
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI diagnostic error: {str(e)}")


    @router.get("/welcome")
    async def get_welcome_message():
        try:
            recent = await get_recent_telemetry(limit=30)
            latest_by_pole: Dict[int, Dict[str, Any]] = {}
            for r in reversed(recent):
                p_id = r.get("pole_id")
                if p_id and p_id not in latest_by_pole:
                    latest_by_pole[p_id] = r

            active_alerts = await get_alerts(status="UNRESOLVED", limit=10)

            welcome_prompt = "Greet the operator in 2 to 3 concise, professional sentences. Confirm that you are NIRIKSHA AI with live access to telemetry for Pole 1, Pole 2, and Pole 3, and invite their command."
            reply_text = query_ollama(
                prompt=welcome_prompt,
                history=[],
                latest_by_pole=latest_by_pole,
                active_alerts=active_alerts
            )

            source = f"Ollama ({get_ollama_model()})"
            if not reply_text:
                source = "Offline Heuristic Rule Engine"
                reply_text = (
                    "Hello Operator! I am **NIRIKSHA AI**, operational and connected with live telemetry streams across "
                    f"Poles 1, 2, and 3 ({len(active_alerts)} active alerts). Ask me to assess system health, inspect "
                    "hazard thresholds, or specify where physical maintenance is required."
                )

            return {
                "message": reply_text,
                "source": source,
                "timestamp": time.time()
            }
        except Exception as e:
            return {
                "message": "Hello Operator! I am NIRIKSHA AI, monitoring Poles 1, 2, and 3. How can I assist you?",
                "source": "Fallback",
                "timestamp": time.time()
            }

    @router.get("/config")
    async def get_ai_config():
        """Returns current Ollama AI engine host and model configuration."""
        return {
            "host": get_ollama_host(),
            "model": get_ollama_model()
        }

    @router.post("/config")
    async def update_ai_config(req: OllamaConfigRequest):
        """Updates and persists Ollama host and model configuration."""
        if not req.model or not req.model.strip():
            raise HTTPException(status_code=400, detail="Model name or pull tag cannot be empty.")
        if not req.host or not req.host.strip():
            raise HTTPException(status_code=400, detail="Ollama host endpoint cannot be empty.")
        save_ollama_config(req.host.strip(), req.model.strip())
        return {
            "status": "success",
            "message": f"Ollama configuration saved: {req.model.strip()} @ {req.host.strip()}",
            "host": get_ollama_host(),
            "model": get_ollama_model()
        }

    return router
