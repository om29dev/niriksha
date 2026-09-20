from typing import List, Dict, Any


def build_offline_ai_response(
    query: str,
    latest_by_pole: Dict[int, Dict[str, Any]],
    active_alerts: List[Dict[str, Any]],
    stats_data: Dict[str, Any]
) -> str:
    """Evaluates query intents against current hardware telemetry snapshot."""
    q = query.lower().strip()

    voltage_hazards = [p for p, data in latest_by_pole.items() if (data.get("voltage") or 0) > 5.0]
    fallen_poles = [p for p, data in latest_by_pole.items() if data.get("is_upright") is False]
    flood_poles = [p for p, data in latest_by_pole.items() if (data.get("water_depth") or 0) > 100.0]

    gas_alerts = []
    for p, data in latest_by_pole.items():
        if (data.get("mq7") or 0) > 50:
            gas_alerts.append(f"Pole {p}: CO high ({data.get('mq7')} ppm)")
        if (data.get("mq135") or 0) > 150:
            gas_alerts.append(f"Pole {p}: Poor air quality ({data.get('mq135')} ppm)")
        if (data.get("mq136") or 0) > 15:
            gas_alerts.append(f"Pole {p}: H2S sewer gas breach ({data.get('mq136')} ppm)")

    # 1. Overall System Health / Diagnostics
    if any(k in q for k in ["health", "status", "overview", "diagnos", "system state", "condition"]):
        lines = ["### 🩺 NIRIKSHA Fleet Diagnostic Assessment\n"]
        if not voltage_hazards and not fallen_poles and not flood_poles and not gas_alerts:
            lines.append("✅ **Fleet Condition: OPTIMAL**")
            lines.append("All poles communicating upright with safe environmental and electrical telemetry.\n")
        else:
            lines.append("⚠️ **Fleet Condition: HAZARD ALERTS ACTIVE**\n")
            if voltage_hazards:
                lines.append(f"- 🔴 **Electrocution Hazard:** Leakage potential on Pole {', '.join(map(str, voltage_hazards))}.")
            if fallen_poles:
                lines.append(f"- 🚨 **Structural Tilt:** Pole collapse detected on Pole {', '.join(map(str, fallen_poles))}.")
            if flood_poles:
                lines.append(f"- 🌊 **Submersion:** Water depth > 100cm on Pole {', '.join(map(str, flood_poles))}.")
            if gas_alerts:
                lines.append(f"- ☣️ **Gas Breach:** {'; '.join(gas_alerts)}")

        lines.append("\n**Current Mesh Telemetry Snapshot:**")
        for p in [1, 2, 3]:
            d = latest_by_pole.get(p)
            if d:
                v = d.get("voltage")
                w = d.get("water_depth")
                pwr = d.get("power")
                t = d.get("temperature")
                up = "Upright" if d.get("is_upright") is not False else "TILTED/COLLAPSED"
                lines.append(f"- **Pole {p}**: {up} | Volt: {f'{v:.1f}V' if v is not None else 'N/A'} | Depth: {f'{w:.1f}cm' if w is not None else 'N/A'} | Power: {f'{pwr:.1f}W' if pwr is not None else 'N/A'} | Temp: {f'{t:.1f}°C' if t is not None else 'N/A'}")
            else:
                lines.append(f"- **Pole {p}**: No recent packet received.")
        return "\n".join(lines)

    # 2. Voltage & Electrical Safety
    if any(k in q for k in ["volt", "electric", "shock", "current", "power", "energy"]):
        lines = ["### ⚡ Electrical Safety Diagnostic\n"]
        p1 = latest_by_pole.get(1, {})
        p2 = latest_by_pole.get(2, {})
        v1 = p1.get("voltage")
        v2 = p2.get("voltage")
        p2_power = p2.get("power")
        lines.append(f"- **Pole 1 (Water Leakage Potential):** {f'{v1:.2f} V' if v1 is not None else 'No reading'}")
        if v1 is not None and v1 > 5.0:
            lines.append("  ⚠️ **DANGER:** Lethal potential detected in street water (>5.0V).")
        else:
            lines.append("  ✅ Safe baseline (< 5.0V threshold).")
        lines.append("- **Pole 2 (PZEM AC Grid Telemetry):**")
        lines.append(f"  - AC Voltage: {f'{v2:.1f} V' if v2 is not None else 'Not Connected'}")
        lines.append(f"  - Active Power: {f'{p2_power:.1f} W' if p2_power is not None else 'Not Connected'}")
        return "\n".join(lines)

    # 3. Water Submersion & Flood
    if any(k in q for k in ["water", "depth", "flood", "submersion"]):
        lines = ["### 🌊 Water Depth & Inundation Analysis\n"]
        depth = latest_by_pole.get(1, {}).get("water_depth")
        lines.append(f"- **Pole 1 Ultrasonic Depth Sensor:** {f'{depth:.1f} cm' if depth is not None else 'Not connected'}")
        if depth is not None:
            if depth > 100:
                lines.append("⚠️ **CRITICAL INUNDATION:** Water depth has surpassed the 100cm flood threshold.")
            elif depth > 50:
                lines.append("🟡 **WARNING:** Moderate water accumulation (50cm - 100cm).")
            else:
                lines.append("✅ Water level within normal drainage limits (< 50cm).")
        return "\n".join(lines)

    # 4. Gas & Air Quality
    if any(k in q for k in ["gas", "air", "ppm", "mq", "smoke", "carbon monoxide", "co", "h2s"]):
        lines = ["### 🌬️ Gas Sensor Analysis (Pole 3)\n"]
        p3 = latest_by_pole.get(3, {})
        mq7 = p3.get("mq7")
        mq135 = p3.get("mq135")
        mq136 = p3.get("mq136")
        lines.append(f"- **MQ-7 (CO):** {f'{mq7:.1f} ppm' if mq7 is not None else 'N/A'} (Limit: >50 ppm)")
        lines.append(f"- **MQ-135 (Air Quality):** {f'{mq135:.1f} ppm' if mq135 is not None else 'N/A'} (Limit: >150 ppm)")
        lines.append(f"- **MQ-136 (H2S Sewer Gas):** {f'{mq136:.1f} ppm' if mq136 is not None else 'N/A'} (Limit: >15 ppm)")
        if gas_alerts:
            lines.append("\n⚠️ **Immediate Attention:** " + "; ".join(gas_alerts))
        else:
            lines.append("\n✅ All gas concentrations within nominal thresholds.")
        return "\n".join(lines)

    # 5. Pole Tilt & Physical Integrity
    if any(k in q for k in ["tilt", "fallen", "fall", "collapse", "orientation"]):
        lines = ["### 📐 Structural Orientation Status\n"]
        for p in [1, 2, 3]:
            data = latest_by_pole.get(p, {})
            up = data.get("is_upright")
            if up is False:
                lines.append(f"- 🚨 **Pole {p}: TILTED / COLLAPSED!** SW-520D indicates inclination from vertical.")
            elif up is True:
                lines.append(f"- ✅ **Pole {p}: Vertically Upright & Secure.**")
            else:
                lines.append(f"- ❓ **Pole {p}: No orientation data available.**")
        return "\n".join(lines)

    # 6. Default Guidance
    lines = [
        "### 🤖 NIRIKSHA Telemetry Assistant\n",
        "I can assess real-time infrastructure conditions across the fleet. Try querying:",
        "- *'Assess overall fleet health'*",
        "- *'Check voltage leakage and electrocution safety'*",
        "- *'What is the current water submersion level?'*",
        "- *'Are there any toxic gas breaches?'*",
        "- *'Verify pole tilt and structural stability'*"
    ]
    return "\n".join(lines)
