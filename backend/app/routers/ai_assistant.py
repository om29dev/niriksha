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
        if (data.get("mq2") or 0) > 300:
            gas_alerts.append(f"Pole {p}: Combustible Gas / Smoke ({data.get('mq2')} ppm)")

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
        mq2 = p3.get("mq2")

        lines.append(f"- **MQ-7 (Carbon Monoxide):** {f'{mq7:.1f} ppm' if mq7 is not None else 'N/A'} (Threshold: >50 ppm)")
        lines.append(f"- **MQ-135 (Air Quality / NH3):** {f'{mq135:.1f} ppm' if mq135 is not None else 'N/A'} (Threshold: >150 ppm)")
        lines.append(f"- **MQ-136 (Hydrogen Sulfide Sewer Gas):** {f'{mq136:.1f} ppm' if mq136 is not None else 'N/A'} (Threshold: >15 ppm)")
        lines.append(f"- **MQ-2 (Combustible Gas & Smoke):** {f'{mq2:.1f} ppm' if mq2 is not None else 'N/A'} (Threshold: >300 ppm)")

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

    # Default fallback with guided suggestions
    return (
        f"Hello! I am the **NIRIKSHA Telemetry & Safety AI Assistant**. I continuously monitor your air-gapped mesh nodes (Poles 1, 2, and 3).\n\n"
        f"You can ask me about:\n"
        f"- **Fleet Health:** *\"Diagnose current system health across all poles\"*\n"
        f"- **Electrical Hazards:** *\"Are there any high voltage or electrocution risks?\"*\n"
        f"- **Flood Levels:** *\"What is the current water submersion depth on Pole 1?\"*\n"
        f"- **Air Quality:** *\"Inspect gas and toxic chemical sensor levels\"*\n"
        f"- **Structural Integrity:** *\"Check if any poles have collapsed or tilted\"*\n"
        f"- **Incidents:** *\"Summarize all active alerts and warnings\"*"
    )


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

            reply_text = build_offline_ai_response(
                query=req.message,
                latest_by_pole=latest_by_pole,
                active_alerts=active_alerts,
                stats_data=stats
            )

            context_summary = {
                "active_poles": list(latest_by_pole.keys()),
                "unresolved_alerts_count": len(active_alerts),
                "evaluated_at": time.time()
            }

            return ChatResponse(
                reply=reply_text,
                context_summary=context_summary,
                timestamp=time.time()
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI diagnostic error: {str(e)}")

    return router
