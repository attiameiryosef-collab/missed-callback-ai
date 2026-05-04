import logging

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse

from app.config import settings
from app.security import validate_twilio_signature
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


@router.post("/dial-status", dependencies=[Depends(validate_twilio_signature)])
async def dial_status(request: Request) -> Response:
    """Dial action callback.

    Twilio posts here when the <Dial> verb completes, with DialCallStatus
    indicating how the bridge ended. If the owner did not answer, fire the
    Vapi callback to the original caller.
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
        try:
            await trigger_callback(
                to_number=original_caller,
                idempotency_key=parent_call_sid,
            )
        except VapiCallbackError as e:
            # Don't 500 back to Twilio — it's already too late to retry the dial.
            logger.error("vapi callback failed for parentCallSid=%s: %s", parent_call_sid, e)

    twiml = VoiceResponse()
    twiml.hangup()
    return _twiml_response(twiml)
