from typing import Any

import httpx

from ..settings import get_settings


class ConvexToolClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def base_url(self) -> str:
        url = self.settings.resolved_convex_site_url
        if not url:
            raise RuntimeError("Set NEXT_PUBLIC_CONVEX_SITE_URL or CONVEX_SITE_URL for Convex HTTP tools.")
        return url.rstrip("/")

    @property
    def headers(self) -> dict[str, str]:
        if not self.settings.keyagent_webhook_secret:
            return {}
        return {"x-keyagent-secret": self.settings.keyagent_webhook_secret}

    async def post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{self.base_url}{path}", json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()

        if not data.get("ok"):
            raise RuntimeError(str(data))

        return data


convex_tools = ConvexToolClient()
