"""
Authentication endpoints: register, login, logout, refresh, me, invite management.
"""

import re
import uuid
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from app.limiter import limiter
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from app.config import settings
from app.db.engine import get_db
from app.db.models import User
from app.auth.security import verify_password, hash_password, create_access_token
from app.auth.dependencies import get_current_user, get_current_admin
from app.db import crud

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _set_auth_cookies(response: Response, user: User, db: Session) -> None:
    """Issue access token cookie and create+store a refresh token cookie."""
    access_token = create_access_token(user.id)
    response.set_cookie(
        "access_token", access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True, samesite="lax", secure=settings.ENVIRONMENT == "production",
    )

    refresh_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    crud.create_refresh_token(db, user.id, refresh_token, expires_at)
    response.set_cookie(
        "refresh_token", refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True, samesite="lax", secure=settings.ENVIRONMENT == "production",
    )


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    invite_code: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        errors = []
        if len(v) < 8:
            errors.append("at least 8 characters")
        if not re.search(r"[A-Z]", v):
            errors.append("one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("one number")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]", v):
            errors.append("one special character")
        if errors:
            raise ValueError("Password must contain: " + ", ".join(errors))
        return v


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    is_admin: bool


class InviteResponse(BaseModel):
    code: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, body: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if settings.REGISTRATION_MODE == "invite":
        if not body.invite_code:
            raise HTTPException(status_code=400, detail="Invite code required")
        invite = crud.get_invite_code(db, body.invite_code)
        if invite is None or invite.used_by is not None:
            raise HTTPException(status_code=400, detail="Invalid or already-used invite code")

    if crud.get_user_by_email(db, body.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if crud.get_user_by_username(db, body.username):
        raise HTTPException(status_code=409, detail="Username already taken")

    user = crud.create_user(db, body.email, body.username, hash_password(body.password))

    if settings.REGISTRATION_MODE == "invite" and body.invite_code:
        crud.use_invite_code(db, body.invite_code, user.id)

    _set_auth_cookies(response, user, db)
    return UserResponse(user_id=user.id, username=user.username, email=user.email, is_admin=user.is_admin)


@router.post("/login", response_model=UserResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, body.username_or_email) \
        or crud.get_user_by_username(db, body.username_or_email)

    if user is None or not verify_password(body.password, user.hashed_pw):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    _set_auth_cookies(response, user, db)
    log.info("User %r logged in", user.username)
    return UserResponse(user_id=user.id, username=user.username, email=user.email, is_admin=user.is_admin)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        crud.delete_refresh_token(db, refresh_token)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")


@router.post("/refresh")
@limiter.limit("20/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    stored = crud.get_refresh_token(db, token)
    if stored is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        crud.delete_refresh_token(db, token)
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or disabled")

    access_token = create_access_token(user.id)
    response.set_cookie(
        "access_token", access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True, samesite="lax", secure=settings.ENVIRONMENT == "production",
    )
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        user_id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_admin=current_user.is_admin,
    )


@router.post("/invite")
def create_invite(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    code = str(uuid.uuid4())[:8].upper()
    inv = crud.create_invite_code(db, code, admin.id)
    log.info("Admin %r created invite code %r", admin.username, code)
    return {
        "code":       inv.code,
        "used":       False,
        "used_at":    None,
        "created_at": inv.created_at.isoformat(),
    }


@router.get("/invites")
def list_invites(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    codes = crud.list_invite_codes(db, admin.id)
    return [
        {
            "code":       c.code,
            "used":       c.used_by is not None,
            "used_at":    c.used_at.isoformat() if c.used_at else None,
            "created_at": c.created_at.isoformat(),
        }
        for c in codes
    ]
