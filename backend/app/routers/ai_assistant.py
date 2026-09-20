import time
from typing import Dict, Any
from fastapi import APIRouter, HTTPException

from app.db import get_recent_telemetry, get_alerts, get_telemetry_stats
from app.ai.schemas import ChatRequest, ChatResponse, OllamaConfigRequest
from app.ai.diagnostics import build_offline_ai_response
from app.ai.ollama import (
    query_ollama,
    save_chat_to_markdown,
    get_ollama_host,
    get_ollama_model,
    save_ollama_config,
)


def create_ai_assistant_router():
    router = APIRouter(prefix="/api/ai", tags=["ai-assistant"])

    @router.post("/chat", response_model=ChatResponse)
    async def chat_with_assistant(req: ChatRequest):
        try:
            recent = await get_recent_telemetry(limit=60)
            latest_by_pole: Dict[int, Dict[str, Any]] = {}
            for r in reversed(recent):
                p_id = r.get("pole_id")
                if p_id and p_id not in latest_by_pole:
                    latest_by_pole[p_id] = r

            active_alerts = await get_alerts(status="UNRESOLVED", limit=20)
            stats = await get_telemetry_stats()

            # 1. Attempt local Ollama inference
            reply_text = query_ollama(
                prompt=req.message,
                history=req.history or [],
                latest_by_pole=latest_by_pole,
                active_alerts=active_alerts
            )

            source = f"Ollama ({get_ollama_model()})"
            if not reply_text:
                # 2. Fallback to heuristic diagnostic engine
                source = "Offline Heuristic Rule Engine"
                reply_text = build_offline_ai_response(
                    query=req.message,
                    latest_by_pole=latest_by_pole,
                    active_alerts=active_alerts,
                    stats_data=stats
                )

            # 3. Log to audit markdown file
            save_chat_to_markdown(
                user_message=req.message,
                ai_reply=reply_text,
                source=source,
                latest_by_pole=latest_by_pole,
                active_alerts_count=len(active_alerts)
            )

            return ChatResponse(
                reply=reply_text,
                context_summary={
                    "engine": source,
                    "active_poles": list(latest_by_pole.keys()),
                    "active_alerts_count": len(active_alerts),
                    "total_telemetry_records": stats.get("sample_count", 0)
                },
                timestamp=time.time()
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Diagnostic error: {e}")

    @router.get("/welcome")
    async def get_welcome_message():
        active_alerts = await get_alerts(status="UNRESOLVED", limit=10)
        return {
            "message": (
                "Hello Operator! I am **NIRIKSHA AI**, actively monitoring Poles 1, 2, and 3 "
                f"({len(active_alerts)} active alerts). Ask me to assess system health, inspect "
                "hazard thresholds, or identify equipment requiring field maintenance."
            ),
            "source": "Offline Heuristic Rule Engine",
            "timestamp": time.time()
        }

    @router.get("/config")
    async def get_ai_config():
        return {"host": get_ollama_host(), "model": get_ollama_model()}

    @router.post("/config")
    async def update_ai_config(req: OllamaConfigRequest):
        if not req.model.strip() or not req.host.strip():
            raise HTTPException(status_code=400, detail="Host and model cannot be blank.")
        save_ollama_config(req.host.strip(), req.model.strip())
        return {"status": "success", "host": get_ollama_host(), "model": get_ollama_model()}

    return router
