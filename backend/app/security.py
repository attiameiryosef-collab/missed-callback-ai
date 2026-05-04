import logging

from fastapi import HTTPException, Request, status
from twilio.request_validator import RequestValidator

from app.config import settings

logger = logging.getLogger(__name__)

_validator = RequestValidator(settings.twilio_auth_token)


async def validate_twilio_signature(request: Request) -> None:
    """FastAPI dependency that rejects Twilio webhooks with a missing or invalid signature.

    Twilio signs every webhook with HMAC-SHA1 over the full URL plus the
    sorted form parameters. We rebuild the URL using PUBLIC_BASE_URL so the
    signature still verifies behind Railway's proxy (which terminates TLS
    and rewrites Host).
    """
    if not settings.verify_twilio_signature:
        return

    signature = request.headers.get("X-Twilio-Signature")
    if not signature:
        logger.warning("twilio webhook rejected: missing X-Twilio-Signature header")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="missing signature")

    url = f"{settings.public_base_url.rstrip('/')}{request.url.path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    form = await request.form()
    params = {k: v for k, v in form.multi_items()}

    if not _validator.validate(url, params, signature):
        logger.warning("twilio webhook rejected: invalid signature for url=%s", url)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="invalid signature")
