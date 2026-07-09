"""
auth.py
-------
Organizer authentication for protected endpoints.

We use a single API key (not JWT) because this MVP has no user accounts.
JWT would add token issuance/refresh/storage complexity with no benefit until
we build a real organizer login flow in Phase 2.
"""

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import ORGANIZER_API_KEY

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_organizer_key(api_key: str | None = Security(api_key_header)) -> None:
    if not ORGANIZER_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Organizer uploads are disabled: ORGANIZER_API_KEY is not configured on the server.",
        )
    if not api_key or api_key != ORGANIZER_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")
