from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()
load_dotenv(".env.local")
load_dotenv("../.env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_agent_model: str = Field(default="gpt-4.1", alias="OPENAI_AGENT_MODEL")
    openai_extraction_model: str = Field(default="gpt-4.1", alias="OPENAI_EXTRACTION_MODEL")

    convex_url: str | None = Field(default=None, alias="CONVEX_URL")
    next_public_convex_url: str | None = Field(default=None, alias="NEXT_PUBLIC_CONVEX_URL")
    convex_auth_token: str | None = Field(default=None, alias="CONVEX_AUTH_TOKEN")

    @property
    def resolved_convex_url(self) -> str:
        url = self.convex_url or self.next_public_convex_url
        if url is None:
            raise RuntimeError("Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL for the agent service.")
        return url.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()
