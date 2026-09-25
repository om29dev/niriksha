---
name: ollama-ai-engine
description: >-
  Operational and architectural specifications for the offline Ollama local LLM inference engine in NIRIKSHA.
  Covers lightweight model selection (Qwen 2.5 0.5B / Llama 3.2 1B), prompt engineering with dynamic real-time
  mesh telemetry injection, service lifecycle management (manage.ps1), Windows binary discovery, and graceful fallback.
---

# Ollama AI Engine Skill

This skill documents the integration, operation, prompt crafting, and failure recovery for the **Ollama Local LLM Inference Engine** in the NIRIKSHA industrial IoT safety platform.

---

## 🏛️ System Philosophy & Offline Standard

1. **Complete Air-Gapped Autonomy:**
   - Inference runs strictly on local CPU/GPU through Ollama's local HTTP daemon (`http://127.0.0.1:11434/api/chat`).
   - Never query or leak telemetry packets to external third-party cloud APIs.
   - All models are pulled ahead of time and served entirely on premises.

2. **Model Selection Standard:**
   - **Default Recommended Model:** `qwen2.5:0.5b` (~397 MB).
     - Exceptional instruction following for low parameter counts.
     - Fast CPU token generation (~20-40 tokens/sec on standard developer laptops).
     - Fits entirely in lightweight RAM without competing with PostgreSQL or FastAPI processes.
   - **Alternative High-Fidelity Model:** `llama3.2:1b` (~1.3 GB) or `qwen2.5:1.5b` (~986 MB) when workstation has dedicated VRAM.

3. **Dynamic Discovery & Lifecycle Management:**
   - Ollama binaries on Windows are typically located in:
     - `$env:LOCALAPPDATA\Programs\Ollama\ollama.exe`
     - `$env:LOCALAPPDATA\Ollama\ollama.exe`
     - `C:\Program Files\Ollama\ollama.exe`
   - Orchestrated seamlessly via `.\manage.ps1 start`, `.\manage.ps1 stop`, `.\manage.ps1 restart`, and `.\manage.ps1 status`.
   - Never kill unrelated development processes; target port `11434` or named processes cleanly.

---

## ⚙️ Configuration & Environment (`backend/.env`)

```ini
# Ollama Local LLM Configuration
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:0.5b
SAVE_AI_MARKDOWN=true
AI_MARKDOWN_DIR=data/ai_logs
```

- `OLLAMA_HOST`: The endpoint where the local Ollama daemon listens.
- `OLLAMA_MODEL`: Target model tag. Retrieved dynamically at runtime via `get_ollama_model()`.
- `SAVE_AI_MARKDOWN`: Flag determining if session inferences are archived to daily Markdown log files.

---

## 🧠 System Prompt Crafting & Real-Time Context Injection

When calling `/api/chat`, the backend (`backend/app/routers/ai_assistant.py`) injects live multi-pole telemetry directly into the system message before dispatching to Ollama:

```python
system_prompt = (
    "You are NIRIKSHA AI, an intelligent industrial safety engineer and telemetry expert operating completely offline.\n"
    "You analyze smart pole infrastructure and answer operator questions directly, knowledgeably, and conversationally.\n\n"
    "FLEET HARDWARE ARCHITECTURE:\n"
    "- Pole 1: Flood Depth Monitoring (HC-SR04 ultrasonic) and Water Electrification Hazard probe (>5.0V is hazardous lethal risk).\n"
    "- Pole 2: Power Grid Monitoring (PZEM-004T AC voltage, current mA, and active power W).\n"
    "- Pole 3: Master Hub & Gas Array (MQ-7 Carbon Monoxide >50ppm, MQ-135 Air Quality >150ppm, MQ-136 Sewer H2S >15ppm, MQ-2 Combustible Gas >300ppm, DHT11 Temperature & Humidity).\n\n"
    "CURRENT LIVE TELEMETRY SNAPSHOT:\n"
    + ("\n".join(telemetry_lines) if telemetry_lines else "No node telemetry currently recorded.") + "\n\n"
    "ACTIVE INCIDENT ALERTS:\n"
    + ("\n".join(alerts_lines) if alerts_lines else "None. All parameters within nominal thresholds.") + "\n\n"
    "RESPONSE GUIDELINES:\n"
    "1. Never give canned or generic greeting lists unless specifically asked for help.\n"
    "2. Directly address the user's specific question or command.\n"
    "3. Incorporate real numbers from the live telemetry snapshot above when diagnosing conditions.\n"
    "4. Keep answers concise, clear, and actionable using GitHub Markdown (bullet points, bold highlights, headers)."
)
```

---

## 🛡️ Inference Execution & Fault Tolerance

```python
payload = {
    "model": model_name,
    "messages": messages,
    "stream": False,
    "options": {
        "temperature": 0.4,
        "num_predict": 400
    }
}
```

- **Timeout Safety:** Requests enforce a 15.0-second HTTP timeout to prevent thread starvation.
- **Graceful Fallback:** If Ollama is offline or uninstalled, the query automatically cascades to the deterministic `Offline Heuristic Rule Engine` without interrupting the operator.
