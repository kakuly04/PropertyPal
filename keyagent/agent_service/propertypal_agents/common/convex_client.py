from typing import Any, Literal

import httpx

from .config import get_settings


ConvexOperation = Literal["query", "mutation", "action"]


class ConvexClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.resolved_convex_url
        self.auth_token = settings.convex_auth_token

    async def query(self, function_path: str, args: dict[str, Any]) -> Any:
        return await self._call("query", function_path, args)

    async def mutation(self, function_path: str, args: dict[str, Any]) -> Any:
        return await self._call("mutation", function_path, args)

    async def action(self, function_path: str, args: dict[str, Any]) -> Any:
        return await self._call("action", function_path, args)

    async def storage_url(self, storage_id: str) -> str:
        # Convex serves storage by storage id; callers can override this later
        # with a signed URL action if the deployment requires one.
        return f"{self.base_url}/api/storage/{storage_id}"

    async def _call(self, operation: ConvexOperation, function_path: str, args: dict[str, Any]) -> Any:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/api/{operation}",
                headers=headers,
                json={"path": function_path, "args": _drop_none(args), "format": "json"},
            )
            response.raise_for_status()

        data = response.json()
        if data.get("status") == "error":
            raise RuntimeError(data.get("errorMessage") or data.get("error") or str(data))
        if "value" in data:
            return data["value"]
        return data


def convex() -> ConvexClient:
    return ConvexClient()


def _drop_none(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _drop_none(item) for key, item in value.items() if item is not None}
    if isinstance(value, list):
        return [_drop_none(item) for item in value]
    return value
