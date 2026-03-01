from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.models.audit_log_model import AuditLog


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        path = request.url.path
        if path.startswith("/docs") or path.startswith("/openapi") or path == "/health":
            return response

        method = request.method.upper()
        # Log all mutating requests and search/match actions.
        should_log = method in {"POST", "PUT", "PATCH", "DELETE"} or path.startswith("/search")
        if not should_log:
            return response

        user_id = _extract_user_id(request)
        action = _infer_action(method, path)
        ip_addr = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        details = {
            "query": dict(request.query_params),
        }

        async with AsyncSessionLocal() as session:
            session.add(
                AuditLog(
                    user_id=user_id,
                    action=action,
                    method=method,
                    path=path,
                    status_code=response.status_code,
                    ip_address=ip_addr,
                    user_agent=user_agent,
                    details=details,
                )
            )
            await session.commit()

        return response


def _extract_user_id(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None

    token = auth.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        claims = decode_token(token)
        return claims.get("sub")
    except Exception:
        return None


def _infer_action(method: str, path: str) -> str:
    clean = path.strip("/").replace("/", ".") or "root"
    return f"{method.lower()}:{clean}"
