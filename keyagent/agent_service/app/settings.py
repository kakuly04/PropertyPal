from functools import lru_cache
import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ENV = Path(__file__).resolve().parents[2] / ".env.local"
SERVICE_ENV = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ENV, SERVICE_ENV),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    keyagent_agent_model: str = "gpt-4.1"
    openai_api_key: str | None = None
    convex_url: str | None = None
    convex_site_url: str | None = None
    next_public_convex_site_url: str | None = None
    keyagent_default_org_id: str | None = "demo"
    keyagent_webhook_secret: str | None = None
    resend_api_key: str | None = None
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_whatsapp_from: str | None = None
    twilio_whatsapp_number: str | None = None
    elevenlabs_api_key: str | None = None

    @property
    def resolved_twilio_whatsapp_from(self) -> str | None:
        return self.twilio_whatsapp_from or self.twilio_whatsapp_number

    @property
    def resolved_convex_site_url(self) -> str | None:
        return self.convex_site_url or self.next_public_convex_site_url


@lru_cache
def get_settings() -> Settings:
    settings = Settings()

    if settings.openai_api_key:
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key

    return settings
