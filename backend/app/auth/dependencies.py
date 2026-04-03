"""
FastAPI dependencies for authentication.
"""

from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.db.models import User
from app.auth.security import decode_access_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Reads access token from httpOnly cookie, validates it, and returns the User.
    Raises HTTP 401 if missing/invalid, HTTP 403 if account is inactive.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    user_id = decode_access_token(token)
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
