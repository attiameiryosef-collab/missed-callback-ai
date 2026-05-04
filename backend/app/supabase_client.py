import logging
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
