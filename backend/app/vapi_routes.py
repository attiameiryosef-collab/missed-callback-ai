import json
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


def _pick(d: Any, *keys: str) -> Any:
    """Return the first present, non-empty value among `keys` in dict `d`.

    Tolerant: returns None if `d` is not a dict or no key matches. Used to
    accept several naming variants (snake_case / camelCase / alt names) so a
    small mismatch in the Vapi structured-data schema doesn't drop everything
    to NULL.
    """
    if not isinstance(d, dict):
        return None
    for k in keys:
        if k in d and d[k] not in (None, ""):
            return d[k]
    return None


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

    try:
        body = await request.json()
    except Exception as e:
        logger.exception("vapi webhook: invalid JSON body: %s", e)
        return {"ok": False, "error": "invalid json"}

    # Vapi wraps server messages as { "message": { ... } } but be defensive.
    message = body.get("message") if isinstance(body, dict) else None
    if not isinstance(message, dict):
        message = body if isinstance(body, dict) else {}

    msg_type = message.get("type")

    # Every event passes through — log type so we can see what Vapi is sending.
    logger.info("vapi webhook received: type=%s message_keys=%s",
                msg_type,
                list(message.keys()) if isinstance(message, dict) else type(message).__name__)

    if msg_type != "end-of-call-report":
        return {"ok": True, "ignored": True, "type": msg_type}

    call = message.get("call") if isinstance(message.get("call"), dict) else {}
    customer = message.get("customer")
    if not isinstance(customer, dict):
        customer = call.get("customer") if isinstance(call.get("customer"), dict) else {}
    analysis = message.get("analysis") if isinstance(message.get("analysis"), dict) else {}
    structured = analysis.get("structuredData") if isinstance(analysis.get("structuredData"), dict) else {}

    # Structured logging of the actual analysis shape Vapi sent. This is the
    # single most important diagnostic — inspect this in Railway logs to see
    # whether Vapi's analysis plan / structured data extractor is configured.
    logger.info(
        "vapi end-of-call shape: customer_keys=%s analysis_keys=%s structured_keys=%s ended_reason=%s",
        list(customer.keys()) if isinstance(customer, dict) else type(customer).__name__,
        list(analysis.keys()) if isinstance(analysis, dict) else type(analysis).__name__,
        list(structured.keys()) if isinstance(structured, dict) else type(structured).__name__,
        message.get("endedReason"),
    )
    try:
        logger.info(
            "vapi end-of-call structuredData=%s summary_preview=%s",
            json.dumps(structured, ensure_ascii=False)[:800],
            (analysis.get("summary") or "")[:200] if isinstance(analysis, dict) else "",
        )
    except Exception:
        # Never let logging break the insert path.
        logger.exception("vapi end-of-call: failed to log structuredData")

    phone = ""
    if isinstance(customer, dict):
        phone = (customer.get("number") or "").strip()

    raw_summary = None
    if isinstance(analysis, dict):
        raw_summary = analysis.get("summary")
    if not raw_summary:
        raw_summary = message.get("summary")
    summary = raw_summary.strip() if isinstance(raw_summary, str) else None

    # Accept several common naming variants so a tiny Vapi schema mismatch
    # (e.g. `customerName` vs `name`) doesn't silently null everything out.
    name = _pick(structured, "name", "customer_name", "customerName", "caller_name", "full_name")
    appointment_val = _pick(
        structured,
        "appointment_requested",
        "appointmentRequested",
        "wants_appointment",
        "requested_appointment",
    )
    appointment_requested = _coerce_bool(appointment_val) if appointment_val is not None else False
    preferred_time = _pick(
        structured,
        "preferred_time",
        "preferredTime",
        "appointment_time",
        "appointmentTime",
        "requested_time",
    )

    if not phone:
        logger.warning("vapi end-of-call missing customer.number; skipping insert")
        return {"ok": True, "inserted": False, "reason": "missing phone"}

    # Never persist NULL for call_summary — synthesize a short fallback when
    # Vapi didn't return one (e.g. analysis plan not configured, or call too
    # short to summarize).
    if not summary:
        ended_reason = message.get("endedReason") or call.get("endedReason") or "unknown"
        summary = f"Callback completed (endedReason={ended_reason}). No analysis summary returned by Vapi."
        logger.info("vapi end-of-call: using fallback summary (no analysis.summary present)")

    logger.info(
        "vapi end-of-call extracted: phone=%s name=%s appt=%s preferred_time=%s summary_len=%s",
        phone, name, appointment_requested, preferred_time, len(summary),
    )

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
