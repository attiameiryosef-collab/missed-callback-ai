import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.config import settings
from app.supabase_client import SupabaseError, insert_lead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vapi", tags=["vapi"])


def _verify_vapi_secret(request: Request) -> None:
    """Reject Vapi webhooks whose x-vapi-secret header doesn't match our shared secret.

    If VAPI_SERVER_SECRET is empty (default) we skip verification — useful for
    initial wiring before the secret is configured on the assistant.
    """
    expected = settings.vapi_server_secret
    if not expected:
        return
    incoming = request.headers.get("x-vapi-secret") or request.headers.get("X-Vapi-Secret")
    if incoming != expected:
        logger.warning("vapi webhook rejected: invalid x-vapi-secret")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="invalid secret")


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "1", "y"}
    return bool(value)


@router.post("/end-of-call")
async def end_of_call(request: Request) -> dict[str, Any]:
    """End-of-call webhook from Vapi.

    Configure on the Vapi assistant under "Server URL" → POST <PUBLIC_BASE_URL>/vapi/end-of-call.
    Set the "Server URL Secret" to the same value as VAPI_SERVER_SECRET.

    To populate `name`, `appointment_requested`, `preferred_time`, configure a
    structured-data extraction schema on the assistant with those keys. Vapi
    will fill `message.analysis.structuredData` after each call.
    """
    _verify_vapi_secret(request)

    body = await request.json()
    # Vapi wraps server messages as { "message": { ... } }
    message = body.get("message", body)
    msg_type = message.get("type")

    if msg_type != "end-of-call-report":
        logger.info("vapi event ignored: type=%s", msg_type)
        return {"ok": True, "ignored": True, "type": msg_type}

    call = message.get("call") or {}
    customer = message.get("customer") or call.get("customer") or {}
    analysis = message.get("analysis") or {}
    structured = analysis.get("structuredData") or {}

    phone = (customer.get("number") or "").strip()
    summary = (analysis.get("summary") or message.get("summary") or "").strip() or None
    name = structured.get("name") or None
    appointment_requested = _coerce_bool(structured.get("appointment_requested", False))
    preferred_time = structured.get("preferred_time") or None

    if not phone:
        logger.warning("vapi end-of-call missing customer.number; skipping insert")
        return {"ok": True, "inserted": False, "reason": "missing phone"}

    try:
        row = await insert_lead(
            phone=phone,
            name=name,
            call_summary=summary,
            appointment_requested=appointment_requested,
            preferred_time=preferred_time,
            status="completed",
        )
    except SupabaseError as e:
        logger.error("failed to insert lead for phone=%s: %s", phone, e)
        # Don't 500 — Vapi would just retry and we don't want duplicate rows.
        return {"ok": False, "inserted": False, "error": str(e)}

    logger.info("lead inserted: id=%s phone=%s", row.get("id"), phone)
    return {"ok": True, "inserted": True, "lead_id": row.get("id")}
