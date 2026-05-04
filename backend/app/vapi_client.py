import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

VAPI_BASE_URL = "https://api.vapi.ai"

# In-process idempotency set. Replaced by a DB row in a later slice.
_triggered_call_sids: set[str] = set()


class VapiCallbackError(Exception):
    pass


async def trigger_callback(to_number: str, idempotency_key: str) -> dict | None:
    """Place an outbound call from the Twilio number (registered with Vapi) to `to_number`.

    Returns the Vapi response dict on success, or None if this idempotency_key was already used.
    Raises VapiCallbackError on HTTP failure.
    """
    if idempotency_key in _triggered_call_sids:
        logger.info("vapi callback skipped (already triggered): key=%s", idempotency_key)
        return None
    _triggered_call_sids.add(idempotency_key)

    payload = {
        "assistantId": settings.vapi_assistant_id,
        "phoneNumberId": settings.vapi_phone_number_id,
        "customer": {"number": to_number},
    }
    headers = {
        "Authorization": f"Bearer {settings.vapi_api_key}",
        "Content-Type": "application/json",
    }

    logger.info("vapi callback dispatch: to=%s key=%s", to_number, idempotency_key)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{VAPI_BASE_URL}/call", json=payload, headers=headers)
    except httpx.HTTPError as e:
        # roll back idempotency so a retry can succeed
        _triggered_call_sids.discard(idempotency_key)
        logger.exception("vapi network error: %s", e)
        raise VapiCallbackError(f"network error contacting Vapi: {e}") from e

    if resp.status_code >= 400:
        _triggered_call_sids.discard(idempotency_key)
        logger.error("vapi error: status=%s body=%s", resp.status_code, resp.text)
        raise VapiCallbackError(f"vapi returned {resp.status_code}: {resp.text}")

    data = resp.json()
    logger.info("vapi callback accepted: callId=%s", data.get("id"))
    return data
