from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Any

import httpx

from app.config import settings

SYDNEY_TZ = ZoneInfo("Australia/Sydney")


class TfNSWClient:
    """HTTP client for Transport for NSW Trip Planner API (v1/tp)."""

    def __init__(self) -> None:
        self._base_url = settings.tfnsw_base_url.rstrip("/")
        self._api_key = settings.tfnsw_api_key
        self._client: httpx.AsyncClient | None = None

    def _auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"apikey {self._api_key}"}

    def _http_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=45.0)
        return self._client

    async def get(self, endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
        if not self._api_key:
            raise RuntimeError("TFNSW_API_KEY is not configured")

        url = f"{self._base_url}/{endpoint}"
        try:
            response = await self._http_client().get(
                url, params=params, headers=self._auth_headers()
            )
        except httpx.RequestError as exc:
            raise RuntimeError(f"TfNSW request failed: {exc}") from exc

        if response.status_code == 401:
            raise RuntimeError("TfNSW API key is invalid or expired")
        if response.status_code >= 400:
            raise RuntimeError(f"TfNSW API error: HTTP {response.status_code}")

        data = response.json()
        if isinstance(data, dict) and data.get("error"):
            message = data["error"].get("message") or data["error"].get("code") or "Unknown error"
            raise RuntimeError(f"TfNSW API error: {message}")

        return data

    async def get_url_bytes(self, url: str, timeout: float = 120.0) -> bytes:
        if not self._api_key:
            raise RuntimeError("TFNSW_API_KEY is not configured")

        try:
            response = await self._http_client().get(url, headers=self._auth_headers(), timeout=timeout)
        except httpx.RequestError as exc:
            raise RuntimeError(f"TfNSW request failed: {exc}") from exc

        if response.status_code == 401:
            raise RuntimeError("TfNSW API key is invalid or expired")
        if response.status_code >= 400:
            raise RuntimeError(f"TfNSW download error: HTTP {response.status_code}")

        return response.content

    @staticmethod
    def itd_params_from_datetime(dt: datetime) -> dict[str, str]:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=SYDNEY_TZ)
        local = dt.astimezone(SYDNEY_TZ)
        return {"itdDate": local.strftime("%Y%m%d"), "itdTime": local.strftime("%H%M")}
