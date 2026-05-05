import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseError(Exception):
    pass


def _headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def insert_lead(
    *,
    phone: str,
    name: str | None = None,
    call_summary: str | None = None,
    appointment_requested: bool = False,
    preferred_time: str | None = None,
    status: str = "new",
    missed_call_count: int = 0,
) -> dict[str, Any]:
    """Insert one row into public.leads via the PostgREST endpoint.

    Uses the service_role key, which bypasses RLS. Returns the inserted row.
    """
    payload = {
        "phone": phone,
        "name": name,
        "call_summary": call_summary,
        "appointment_requested": appointment_requested,
        "preferred_time": preferred_time,
        "status": status,
        "missed_call_count": missed_call_count,
    }
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=_headers())
    except httpx.HTTPError as e:
        logger.exception("supabase network error: %s", e)
        raise SupabaseError(f"network error contacting Supabase: {e}") from e

    if resp.status_code >= 400:
        logger.error("supabase insert failed: status=%s body=%s", resp.status_code, resp.text)
        raise SupabaseError(f"supabase {resp.status_code}: {resp.text}")

    rows = resp.json()
    if not isinstance(rows, list) or not rows:
        logger.error("supabase insert returned no rows: %s", resp.text)
        raise SupabaseError(f"supabase returned no rows: {resp.text}")
    return rows[0]


async def count_recent_missed_calls(phone: str, hours: int) -> int:
    """Count how many missed-call rows exist for `phone` in the last `hours` hours."""
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/leads"
    params = {
        "select": "id",
        "phone": f"eq.{phone}",
        "status": "eq.missed",
        "created_at": f"gte.{since}",
    }
    headers = {**_headers(), "Prefer": "count=exact"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
    except httpx.HTTPError as e:
        logger.exception("supabase count network error: %s", e)
        raise SupabaseError(f"network error contacting Supabase: {e}") from e

    if resp.status_code >= 400:
        logger.error("supabase count failed: status=%s body=%s", resp.status_code, resp.text)
        raise SupabaseError(f"supabase {resp.status_code}: {resp.text}")

    # PostgREST returns the exact count in the Content-Range header: "0-N/total".
    content_range = resp.headers.get("content-range") or ""
    if "/" in content_range:
        try:
            return int(content_range.rsplit("/", 1)[1])
        except ValueError:
            pass
    rows = resp.json()
    return len(rows) if isinstance(rows, list) else 0
