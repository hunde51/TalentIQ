from starlette.requests import Request
from slowapi import Limiter

from app.core.config import get_settings
from app.core.security import decode_token

settings = get_settings()


def user_or_ip_key(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1].strip()
        if token:
            try:
                claims = decode_token(token)
                user_id = claims.get("sub")
                if user_id:
                    return f"user:{user_id}"
            except Exception:
                pass

    client_host = request.client.host if request.client else "unknown"
    return f"ip:{client_host}"


limiter = Limiter(key_func=user_or_ip_key, default_limits=[settings.rate_limit_default])
