import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.config import settings
from app.supabase_client import SupabaseError, insert_call, insert_lead

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


def _first_str(*candidates: Any) -> str | None:
    """Return the first non-empty string in `candidates`."""
    for c in candidates:
        if isinstance(c, str) and c.strip():
            return c.strip()
    return None


def _coerce_duration_seconds(*sources: dict[str, Any]) -> int | None:
    """Look across sources for a duration value in s/ms/min and return seconds."""
    for src in sources:
        if not isinstance(src, dict):
            continue
        for key in ("durationSeconds", "duration_seconds"):
            v = src.get(key)
            if isinstance(v, (int, float)):
                return int(round(float(v)))
        for key in ("durationMs", "duration_ms"):
            v = src.get(key)
            if isinstance(v, (int, float)):
                return int(round(float(v) / 1000.0))
        for key in ("durationMinutes", "duration_minutes"):
            v = src.get(key)
            if isinstance(v, (int, float)):
                return int(round(float(v) * 60.0))
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

    # Additional fields for the calls table. Vapi puts these in several places
    # across event shapes, so look in all the usual suspects.
    artifact = message.get("artifact") if isinstance(message.get("artifact"), dict) else {}

    ended_reason = _first_str(
        message.get("endedReason"),
        call.get("endedReason"),
        artifact.get("endedReason"),
    )

    transcript = _first_str(
        message.get("transcript"),
        artifact.get("transcript"),
        call.get("transcript"),
    )

    recording_url = _first_str(
        message.get("recordingUrl"),
        message.get("recording_url"),
        artifact.get("recordingUrl"),
        artifact.get("recording_url"),
        call.get("recordingUrl"),
    )

    duration_seconds = _coerce_duration_seconds(message, artifact, call)

    # Never persist NULL for call_summary — synthesize a short fallback when
    # Vapi didn't return one (e.g. analysis plan not configured, or call too
    # short to summarize).
    if not summary:
        summary = f"Callback completed (endedReason={ended_reason or 'unknown'}). No analysis summary returned by Vapi."
        logger.info("vapi end-of-call: using fallback summary (no analysis.summary present)")

    logger.info(
        "vapi end-of-call extracted: phone=%s name=%s appt=%s preferred_time=%s "
        "summary_len=%s transcript_len=%s recording=%s duration=%s ended_reason=%s",
        phone, name, appointment_requested, preferred_time,
        len(summary),
        len(transcript) if transcript else 0,
        bool(recording_url),
        duration_seconds,
        ended_reason,
    )

    # 1. Always record the conversation in `calls` — this is the dashboard's
    # source of truth.
    call_row: dict[str, Any] = {}
    try:
        call_row = await insert_call(
            phone=phone,
            call_summary=summary,
            transcript=transcript,
            recording_url=recording_url,
            duration_seconds=duration_seconds,
            ended_reason=ended_reason,
            appointment_requested=appointment_requested,
            preferred_time=preferred_time,
            status="completed",
        )
        logger.info("call inserted: id=%s phone=%s", call_row.get("id"), phone)
    except SupabaseError as e:
        logger.error("failed to insert call for phone=%s: %s", phone, e)
        # Don't 500 — Vapi would just retry and we don't want duplicate rows.
        return {"ok": False, "inserted": False, "error": str(e)}

    # 2. Only promote to `leads` if the conversation actually produced an
    # opportunity: an appointment ask, or at least a caller name. Otherwise
    # the call is just a logged conversation — not a sales lead.
    has_name = bool(name and isinstance(name, str) and name.strip())
    is_lead = appointment_requested or has_name

    lead_id: str | None = None
    if is_lead:
        try:
            lead_row = await insert_lead(
                phone=phone,
                name=name,
                call_summary=summary,
                appointment_requested=appointment_requested,
                preferred_time=preferred_time,
                status="completed",
            )
            lead_id = lead_row.get("id")
            logger.info("lead inserted: id=%s phone=%s (appt=%s name=%s)",
                        lead_id, phone, appointment_requested, bool(name))
        except SupabaseError as e:
            # The call row already landed — don't fail the whole webhook.
            logger.error("failed to insert lead for phone=%s: %s", phone, e)
    else:
        logger.info("vapi end-of-call: no opportunity (no appt, no name) — skipping leads insert")

    return {
        "ok": True,
        "inserted": True,
        "call_id": call_row.get("id"),
        "lead_id": lead_id,
        "is_lead": is_lead,
    }
