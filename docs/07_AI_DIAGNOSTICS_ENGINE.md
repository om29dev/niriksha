# 07. Offline AI Diagnostics & Inference Engine

NIRIKSHA incorporates an **offline machine reasoning engine** designed to assist municipal operators and emergency response crews during extreme weather, flooding, and utility failures. The AI assistant can diagnose complex multi-sensor hazards, explain root causes, and propose immediate mitigation steps without requiring an internet connection or external cloud LLM APIs.

---

## 1. Two-Tier Hybrid AI Architecture

The diagnostic engine is organized into a complementary two-tier pipeline: a deterministic rule engine operating at sub-millisecond speeds, backed by an on-premises local Large Language Model (LLM) managed via **Ollama**.

```d2
direction: right

request: Operator Diagnostic Query {
  shape: document
  style.fill: "#eff6ff"
}

ai_subsystem: Offline AI Diagnostic Subsystem {
  style.fill: "#ffffff"
  style.stroke: "#0d9488"
  style.stroke-width: 2

  tier1: Tier 1: Deterministic Rule Heuristics (diagnostics.py) {
    shape: step
    style.fill: "#f0fdf4"
    style.stroke: "#16a34a"
    sub_features: Specs {
      shape: table
      "Latency": "< 1 ms (Instantaneous)"
      "Reliability": "100% Deterministic Safety Evaluation"
      "Rules": "Voltage leaks, submersion, fire indices, tilt collapse"
    }
  }

  context_builder: Dynamic Telemetry Injector {
    shape: class
    style.fill: "#ede9fe"
    style.stroke: "#7c3aed"
    action: "Extracts latest snapshot of all poles\nInjects into ollama_system_prompt.md"
  }

  tier2: Tier 2: Local Ollama LLM Inference (ollama.py) {
    shape: step
    style.fill: "#ccfbf1"
    style.stroke: "#0d9488"
    sub_features: Specs {
      shape: table
      "Runtime": "Local Ollama Daemon (localhost:11434)"
      "Models": "Qwen 2.5 (0.5B / 1.5B) or Llama 3.2 (1B)"
      "Privacy": "Air-Gapped (Zero outbound WAN tokens)"
    }
  }

  circuit_breaker: Circuit Breaker & Fallback {
    shape: diamond
    style.fill: "#fef3c7"
    style.stroke: "#d97706"
    test: "Is Ollama responding within 5s?"
  }

  tier1 -> context_builder: "Structured Health Summary"
  context_builder -> circuit_breaker: "Prompt + Live Telemetry"
  circuit_breaker -> tier2: "Active (Route to Ollama)"
  circuit_breaker -> tier1: "Offline Fallback (Return Rule Report)"
}

request -> ai_subsystem.tier1: "Chat prompt / Trigger"

response: Markdown Diagnostic Response {
  shape: document
  style.fill: "#f8fafc"
}

ai_subsystem.tier2 -> response: "Natural Language Reasoning"
ai_subsystem.tier1 -> response: "Deterministic Safety Matrix"
```

---

## 2. Tier 1: Deterministic Domain Heuristics (`diagnostics.py`)

In safety-critical municipal systems, probabilistic neural networks must never be the sole gatekeeper for life-safety decisions. If an operator asks *"Is it safe to wade into the water near Pole 1?"*, the response must be bound by verified safety logic with zero hallucinations.

`diagnostics.py` evaluates the active telemetry snapshot against explicit municipal engineering rules:

```python
def evaluate_pole_safety(pole_data: Dict[str, Any]) -> Dict[str, Any]:
    pole_id = pole_data.get("pole_id", 1)
    volt = pole_data.get("voltage")
    depth = pole_data.get("water_depth")
    is_upright = pole_data.get("is_upright")
    fire_index = pole_data.get("fire_combustion_index", 0.0)

    hazards = []
    status = "SAFE"

    # Rule 1: Lethal Water Electrification
    if volt is not None and volt > 5.0:
        status = "CRITICAL_DANGER"
        hazards.append(
            f"LETHAL ELECTROCUTION HAZARD: AC voltage leak detected ({volt:.1f}V). "
            f"Water conductivity multiplier active. Immediate physical cordon required."
        )

    # Rule 2: Severe Urban Submersion
    if depth is not None and depth > 100.0:
        if status != "CRITICAL_DANGER":
            status = "WARNING"
        hazards.append(f"FLOOD WARNING: Water accumulation ({depth:.1f}cm) exceeds roadway clearance.")

    # Rule 3: Structural Collapse
    if is_upright is False:
        status = "CRITICAL_DANGER"
        hazards.append("STRUCTURAL FAILURE: Utility pole has toppled or tilted past 45° angle.")

    # Rule 4: Fire Outbreak
    if fire_index >= 75.0:
        status = "CRITICAL_DANGER"
        hazards.append(f"FIRE EMERGENCY: Multi-sensor fire index ({fire_index:.1f}%) indicates blaze signature.")

    return {
        "pole_id": pole_id,
        "safety_status": status,
        "hazards": hazards,
        "timestamp": time.time()
    }
```

---

## 3. Tier 2: Local Ollama LLM Integration (`ollama.py`)

When natural language conversation, incident summarization, or shift-handover reporting is required, the system invokes a lightweight local model via Ollama.

### 3.1 Recommended Lightweight Models
NIRIKSHA is designed to run efficiently on commodity industrial field laptops (Intel i5/i7, 8–16 GB RAM) without requiring discrete enterprise GPUs:
- **`qwen2.5:0.5b`** (Default Recommended): Superb diagnostic reasoning and markdown table generation with a RAM footprint under 600 MB.
- **`qwen2.5:1.5b`**: Enhanced reasoning for complex municipal reports (approx. 1.2 GB RAM).
- **`llama3.2:1b`**: High instruction-following fidelity with fast token generation.

### 3.2 Dynamic Telemetry Context Injection
Before dispatching a prompt to Ollama, `ollama_client.py` captures the instantaneous state of every pole in the mesh and formats a concise system context:

```markdown
### REAL-TIME FIELD TELEMETRY SNAPSHOT
- **Pole 1 (Flood Node)**: Water Depth: 24.5cm | Voltage: 0.0V | Tilt: Upright | MQ7: 12.4ppm | MQ2: 18.0ppm | Status: ONLINE
- **Pole 2 (Grid Node)**: Voltage: 231.4V | Current: 4.2A | Power: 965.8W | Frequency: 50.0Hz | Status: ONLINE
- **Pole 3 (Root Hub)**: Gateway Active | Baud: 115200 | Packets Buffered: 14 | Status: HEALTHY

### ACTIVE UNRESOLVED INCIDENTS
- None currently flagged.

You are NIRIKSHA-AI, an expert municipal electrical and flood diagnostic assistant.
Analyze the user's query against this live snapshot. Be concise, authoritative, and prioritize human safety.
```

---

## 4. UI Drawer & Multi-Session Architecture

The operator interface provides two access modes for the AI assistant:
1. **Global Slide-Over Drawer (`AiAssistantDrawer.tsx`)**: Can be toggled from the navigation bar on any screen. Displays an active sensor status ribbon at the top and provides quick prompt chips (e.g. *"Evaluate Flood Risk"*, *"Check Electrical Leakage"*).
2. **Dedicated Workspace View (`AiAssistantView.tsx`)**: Full-screen layout featuring a multi-session chat sidebar (`AiChatSidebar.tsx`), session renaming/deletion, and raw diagnostic log inspection.

### Offline Markdown Content Rendering (`MarkdownContent.tsx`)
LLM responses are rendered using a locally bundled markdown component supporting:
- Syntax-highlighted code and query blocks.
- Markdown comparison tables.
- Styled danger callouts (`CRITICAL`, `WARNING`, `SAFE`).
