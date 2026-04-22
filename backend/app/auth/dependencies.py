"""
FastAPI dependencies for authentication.
"""

from fastapi import Depends, Request, HTTPException, status

from app.db.engine import SessionLocal
from app.db.models import User
from app.auth.security import decode_access_token


def get_current_user(request: Request) -> User:
    """
    Reads access token from httpOnly cookie, validates it, and returns the User.
    Opens its own short-lived session so the connection is released immediately —
    not held open for the lifetime of the response (critical for streaming endpoints).
    Raises HTTP 401 if missing/invalid, HTTP 403 if account is inactive.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    user_id = decode_access_token(token)
    with SessionLocal() as db:
        user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled"
        )
    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Requires the current user to be an admin."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user
