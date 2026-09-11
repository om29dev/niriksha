"""
API Router for Persistent PostgreSQL Alerts (Querying, Resolving, Auditing).
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_alerts, resolve_alert, resolve_multiple_alerts, resolve_all_alerts, clear_all_alerts
from app.connection_manager import ws_manager

class ResolveRequest(BaseModel):
    resolved_by: str = "Operator"

class ResolveMultipleRequest(BaseModel):
    alert_ids: List[int]
    resolved_by: str = "Operator"

def create_alerts_router():
    router = APIRouter(prefix="/api/alerts", tags=["alerts"])

    @router.get("")
    async def fetch_alerts(
        status: Optional[str] = None,
        pole_id: Optional[int] = None,
        severity: Optional[str] = None,
        limit: int = 200
    ):
        """Returns alerts stored in PostgreSQL with optional status/pole/severity filtering."""
        data = await get_alerts(status=status, pole_id=pole_id, severity=severity, limit=limit)
        return {"alerts": data}

    @router.post("/resolve-multiple")
    async def resolve_batch(req: ResolveMultipleRequest):
        """Marks multiple selected persistent alerts as RESOLVED in PostgreSQL."""
        results = await resolve_multiple_alerts(req.alert_ids, resolved_by=req.resolved_by)
        for item in results:
            await ws_manager.broadcast({
                "type": "ALERT_RESOLVED",
                "alert": item
            })
        return {"status": "success", "resolved_alerts": results, "count": len(results)}

    @router.post("/{alert_id}/resolve")
    async def resolve_single_alert(alert_id: int, req: ResolveRequest):
        """Marks a persistent alert as RESOLVED in PostgreSQL."""
        result = await resolve_alert(alert_id, resolved_by=req.resolved_by)
        if not result:
            raise HTTPException(status_code=404, detail="Alert not found or already resolved.")
        
        # Broadcast alert resolution event over WebSockets
        await ws_manager.broadcast({
            "type": "ALERT_RESOLVED",
            "alert": result
        })
        return {"status": "success", "alert": result}

    @router.post("/resolve-all")
    async def resolve_all(req: ResolveRequest, pole_id: Optional[int] = None):
        """Resolves all currently active/unresolved alerts."""
        count = await resolve_all_alerts(pole_id=pole_id, resolved_by=req.resolved_by)
        await ws_manager.broadcast({
            "type": "ALL_ALERTS_RESOLVED",
            "pole_id": pole_id,
            "count": count
        })
        return {"status": "success", "resolved_count": count}

    @router.post("/reset")
    async def reset_alerts():
        """Clears all stored alerts from the database."""
        await clear_all_alerts()
        await ws_manager.broadcast({"type": "ALERTS_CLEARED"})
        return {"status": "success", "message": "Alerts table truncated."}

    return router
