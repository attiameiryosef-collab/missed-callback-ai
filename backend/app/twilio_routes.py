import asyncio
import logging

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse

from app.config import settings
from app.security import validate_twilio_signature
from app.supabase_client import (
    SupabaseError,
    count_recent_missed_calls,
    insert_lead,
)
from app.vapi_client import VapiCallbackError, trigger_callback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/twilio", tags=["twilio"])

# DialCallStatus values that we treat as a "missed call" worth recovering.
MISSED_STATUSES = {"no-answer", "busy", "failed"}


def _twiml_response(twiml: VoiceResponse) -> Response:
    return Response(content=str(twiml), media_type="application/xml")


@router.post("/voice", dependencies=[Depends(validate_twilio_signature)])
async def inbound_voice() -> Response:
    """Inbound voice webhook.

    Forwards the call to the owner's private phone for DIAL_TIMEOUT_SECONDS,
    presenting the Twilio number as the caller ID. When the dial leg ends,
    Twilio POSTs the result to /twilio/dial-status.
    """
    action_url = f"{settings.public_base_url.rstrip('/')}/twilio/dial-status"

    twiml = VoiceResponse()
    dial = twiml.dial(
        timeout=settings.dial_timeout_seconds,
        action=action_url,
        method="POST",
        caller_id=settings.twilio_phone_number,
    )
    dial.number(settings.owner_private_phone)
    return _twiml_response(twiml)


async def _delayed_callback(
    *,
    to_number: str,
    idempotency_key: str,
    missed_call_count: int,
) -> None:
    """Sleep CALLBACK_DELAY_SECONDS, then place the Vapi callback.

    Runs as a fire-and-forget task so the Twilio webhook can return immediately.
    """
    try:
        await asyncio.sleep(settings.callback_delay_seconds)
        await trigger_callback(
            to_number=to_number,
            idempotency_key=idempotency_key,
            missed_call_count=missed_call_count,
            business_name=settings.business_name or None,
            callback_reason="missed_call",
        )
    except VapiCallbackError as e:
        logger.error("vapi callback failed for key=%s: %s", idempotency_key, e)
    except Exception:
        logger.exception("delayed callback crashed for key=%s", idempotency_key)


@router.post("/dial-status", dependencies=[Depends(validate_twilio_signature)])
async def dial_status(request: Request) -> Response:
    """Dial action callback.

    Twilio posts here when the <Dial> verb completes, with DialCallStatus
    indicating how the bridge ended. If the owner did not answer, we:
      1. count how many times this number has missed us recently (24h window),
      2. write a 'missed' lead row carrying that count,
      3. schedule the Vapi callback after CALLBACK_DELAY_SECONDS.
    """
    form = await request.form()
    dial_status = (form.get("DialCallStatus") or "").lower()
    parent_call_sid = form.get("CallSid") or ""
    original_caller = form.get("From") or ""

    logger.info(
        "dial-status: status=%s parentCallSid=%s from=%s",
        dial_status, parent_call_sid, original_caller,
    )

    if dial_status in MISSED_STATUSES and original_caller and parent_call_sid:
        missed_call_count = 1
        try:
            prior = await count_recent_missed_calls(
                phone=original_caller,
                hours=settings.repeat_call_window_hours,
            )
            missed_call_count = prior + 1
            await insert_lead(
                phone=original_caller,
                status="missed",
                missed_call_count=missed_call_count,
            )
        except SupabaseError as e:
            # Don't block the callback on a logging failure — proceed with count=1.
            logger.error("supabase missed-call tracking failed: %s", e)

        asyncio.create_task(
            _delayed_callback(
                to_number=original_caller,
                idempotency_key=parent_call_sid,
                missed_call_count=missed_call_count,
            )
        )

    twiml = VoiceResponse()
    twiml.hangup()
    return _twiml_response(twiml)
