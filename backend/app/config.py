from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    twilio_account_sid: str = Field(...)
    twilio_auth_token: str = Field(...)
    twilio_phone_number: str = Field(...)
    owner_private_phone: str = Field(...)

    vapi_api_key: str = Field(...)
    vapi_assistant_id: str = Field(...)
    vapi_phone_number_id: str = Field(...)
    # Shared secret sent by Vapi as the `x-vapi-secret` header on server webhooks.
    # Empty string disables verification (useful only for local debugging).
    vapi_server_secret: str = ""

    supabase_url: str = Field(...)
    supabase_service_role_key: str = Field(...)

    public_base_url: str = Field(...)
    dial_timeout_seconds: int = 15
    # How long to wait after a missed call before triggering the AI callback.
    callback_delay_seconds: int = 30
    # Window used when counting how many times this number has called recently.
    repeat_call_window_hours: int = 24
    # Optional — surfaced to the Vapi assistant as {{business_name}}.
    business_name: str = ""
    verify_twilio_signature: bool = True
    log_level: str = "INFO"


settings = Settings()  # type: ignore[call-arg]
