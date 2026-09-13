"""
VERIDOC AI — Dashboard API
Provides aggregate statistics and recent case summaries.
"""
from fastapi import APIRouter
from models.schemas import ApiResponse
from utils.config import settings

router = APIRouter()

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=ApiResponse)
async def get_stats():
    """Return dynamic aggregate screening statistics."""
    from api.routes.screening import _case_store, _DEMO_HISTORY
    
    all_cases = list(_case_store.values()) + [
        c for c in _DEMO_HISTORY if c["id"] not in _case_store
    ]
    
    total = len(all_cases)
    suspicious = sum(1 for c in all_cases if (c.get("riskAssessment") or {}).get("riskLevel") == "MEDIUM")
    high_risk = sum(1 for c in all_cases if (c.get("riskAssessment") or {}).get("riskLevel") == "HIGH")
    verified = sum(1 for c in all_cases if (c.get("riskAssessment") or {}).get("riskLevel") == "LOW")
    
    times = [c["totalTimeMs"] for c in all_cases if c.get("totalTimeMs")]
    avg_time = int(sum(times) / len(times)) if times else 3750

    return ApiResponse(
        success=True,
        data={
            "total_screened": total,
            "suspicious": suspicious,
            "high_risk": high_risk,
            "verified": verified,
            "avg_screening_time_ms": avg_time,
            "today_screened": max(total, 4),
        }
    )

@router.get("/recent", response_model=ApiResponse)
async def get_recent():
    """Return the most recent screening cases."""
    from api.routes.screening import _case_store, _DEMO_HISTORY
    
    all_cases = list(_case_store.values()) + [
        c for c in _DEMO_HISTORY if c["id"] not in _case_store
    ]
    return ApiResponse(success=True, data=all_cases[:7])
