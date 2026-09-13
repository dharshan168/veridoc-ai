"""
VERIDOC AI — Authentication API
Handles officer login and token management.
"""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta
import jwt
import hashlib

from models.schemas import LoginRequest, LoginResponse, ApiResponse
from utils.config import settings
from utils.demo_store import get_officer_by_id

router = APIRouter()

# ─── Demo credentials ─────────────────────────────────────────────────────────

DEMO_CREDENTIALS = {
    "DEMO001": "demo123",
    "OFF-001": "officer123",
    "OFF-002": "officer123",
    "OFF-003": "officer123",
}

# ─── Token helpers ────────────────────────────────────────────────────────────

def create_token(officer_id: str) -> str:
    payload = {
        "sub": officer_id,
        "exp": datetime.utcnow() + timedelta(hours=settings.access_token_expire_hours),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/login", response_model=ApiResponse)
async def login(body: LoginRequest):
    """
    Authenticate an officer with ID and password.
    In demo mode, accepts DEMO001/demo123 or any officer ID with 'officer123'.
    """
    officer_id = body.officer_id.strip().upper()
    password   = body.password.strip()

    # Check demo credentials
    valid = (
        DEMO_CREDENTIALS.get(officer_id) == password or
        DEMO_CREDENTIALS.get(body.officer_id.strip()) == password
    )

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid officer ID or password.",
        )

    officer = get_officer_by_id(officer_id) or get_officer_by_id(body.officer_id.strip())
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Officer record not found.",
        )

    token = create_token(officer.officer_id)

    return ApiResponse(
        success=True,
        data=LoginResponse(
            token=token,
            officer=officer,
            demo_mode=settings.demo_mode,
        ).model_dump(),
    )

@router.post("/logout")
async def logout():
    """Logout — client should discard the token."""
    return ApiResponse(success=True, data=None, message="Logged out successfully.")
