import logging
from typing import List, Dict, Any, Optional
from app.db.connection import get_pool

logger = logging.getLogger("db.alerts_repo")


async def record_alert_if_new(
    pole_id: int,
    alert_type: str,
    severity: str,
    title: str,
    description: str,
    trigger_value: Optional[float] = None,
    unit: str = ""
) -> Optional[Dict[str, Any]]:
    """Inserts an alert if an active UNRESOLVED alert of the same type does not exist on this pole."""
    pool = get_pool()
    if not pool:
        return None

    try:
        async with pool.acquire() as conn:
            existing = await conn.fetchrow("""
                SELECT id FROM alerts
                WHERE pole_id = $1 AND alert_type = $2 AND status = 'UNRESOLVED'
                LIMIT 1
            """, pole_id, alert_type)
            if existing:
                return None

            row = await conn.fetchrow("""
                INSERT INTO alerts (
                    pole_id, alert_type, severity, title, description,
                    trigger_value, unit, status, triggered_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'UNRESOLVED', CURRENT_TIMESTAMP)
                RETURNING id, pole_id, alert_type, severity, title, description,
                          trigger_value, unit, status, triggered_at, resolved_at, resolved_by
            """, pole_id, alert_type, severity, title, description, trigger_value, unit)

            alert_dict = dict(row)
            if alert_dict.get("triggered_at"):
                alert_dict["triggered_at"] = alert_dict["triggered_at"].isoformat()
            if alert_dict.get("resolved_at"):
                alert_dict["resolved_at"] = alert_dict["resolved_at"].isoformat()
            return alert_dict
    except Exception as e:
        logger.error(f"Failed to record alert: {e}")
        return None


async def get_alerts(
    status: Optional[str] = None,
    pole_id: Optional[int] = None,
    severity: Optional[str] = None,
    limit: int = 200
) -> List[Dict[str, Any]]:
    """Queries alerts with optional filtering."""
    pool = get_pool()
    if not pool:
        return []

    try:
        async with pool.acquire() as conn:
            query = """
                SELECT id, pole_id, alert_type, severity, title, description,
                       trigger_value, unit, status, triggered_at, resolved_at, resolved_by
                FROM alerts
            """
            conditions, args, idx = [], [], 1
            if status and status.upper() != "ALL":
                conditions.append(f"status = ${idx}")
                args.append(status.upper())
                idx += 1
            if pole_id is not None:
                conditions.append(f"pole_id = ${idx}")
                args.append(pole_id)
                idx += 1
            if severity and severity.lower() != "all":
                conditions.append(f"severity = ${idx}")
                args.append(severity.lower())
                idx += 1

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += f" ORDER BY triggered_at DESC LIMIT ${idx}"
            args.append(limit)

            rows = await conn.fetch(query, *args)
            result = []
            for r in rows:
                item = dict(r)
                if item.get("triggered_at"):
                    item["triggered_at"] = item["triggered_at"].isoformat()
                if item.get("resolved_at"):
                    item["resolved_at"] = item["resolved_at"].isoformat()
                result.append(item)
            return result
    except Exception as e:
        logger.error(f"Failed to fetch alerts: {e}")
        return []


async def resolve_alert(alert_id: int, resolved_by: str = "Operator") -> Optional[Dict[str, Any]]:
    """Marks a single alert as RESOLVED."""
    pool = get_pool()
    if not pool:
        return None

    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                UPDATE alerts
                SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1
                WHERE id = $2
                RETURNING id, pole_id, alert_type, severity, title, description,
                          trigger_value, unit, status, triggered_at, resolved_at, resolved_by
            """, resolved_by, alert_id)
            if not row:
                return None
            item = dict(row)
            if item.get("triggered_at"):
                item["triggered_at"] = item["triggered_at"].isoformat()
            if item.get("resolved_at"):
                item["resolved_at"] = item["resolved_at"].isoformat()
            return item
    except Exception as e:
        logger.error(f"Failed to resolve alert {alert_id}: {e}")
        return None


async def resolve_multiple_alerts(alert_ids: List[int], resolved_by: str = "Operator") -> List[Dict[str, Any]]:
    """Marks multiple alerts as RESOLVED."""
    pool = get_pool()
    if not pool or not alert_ids:
        return []

    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                UPDATE alerts
                SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1
                WHERE id = ANY($2::bigint[]) AND status = 'UNRESOLVED'
                RETURNING id, pole_id, alert_type, severity, title, description,
                          trigger_value, unit, status, triggered_at, resolved_at, resolved_by
            """, resolved_by, alert_ids)
            result = []
            for r in rows:
                item = dict(r)
                if item.get("triggered_at"):
                    item["triggered_at"] = item["triggered_at"].isoformat()
                if item.get("resolved_at"):
                    item["resolved_at"] = item["resolved_at"].isoformat()
                result.append(item)
            return result
    except Exception as e:
        logger.error(f"Failed to resolve multiple alerts: {e}")
        return []


async def resolve_all_alerts(pole_id: Optional[int] = None, resolved_by: str = "Operator") -> int:
    """Resolves all active unresolved alerts."""
    pool = get_pool()
    if not pool:
        return 0

    try:
        async with pool.acquire() as conn:
            query = "UPDATE alerts SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 WHERE status = 'UNRESOLVED'"
            args = [resolved_by]
            if pole_id is not None:
                query += " AND pole_id = $2"
                args.append(pole_id)
            result = await conn.execute(query, *args)
            parts = result.split()
            return int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    except Exception as e:
        logger.error(f"Failed to resolve all alerts: {e}")
        return 0


async def clear_all_alerts():
    """Truncates alerts table."""
    pool = get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute("TRUNCATE TABLE alerts;")
                logger.info("Alerts table truncated.")
        except Exception as e:
            logger.error(f"Failed to truncate alerts: {e}")
