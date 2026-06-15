from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings


def get_client_ip(request: Request) -> str:
    """Prefer proxy headers when the API sits behind nginx."""
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
    if request.client:
        return request.client.host
    return get_remote_address(request)


limiter = Limiter(
    key_func=get_client_ip,
    default_limits=[settings.rate_limit_default],
    enabled=settings.rate_limit_enabled,
)
