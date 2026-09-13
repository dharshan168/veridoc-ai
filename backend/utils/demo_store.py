"""
VERIDOC AI — Demo Data Store
In-memory repository used when DEMO_MODE=true.
Replace with real database queries for production.
"""
from typing import List, Optional
from models.schemas import ScreeningCase, DashboardStats, Officer
import datetime

# ─── Demo Officers ────────────────────────────────────────────────────────────

DEMO_OFFICERS: List[Officer] = [
    Officer(
        id="1",
        officer_id="OFF-001",
        name="Rajan Mehta",
        rank="Senior Border Security Officer",
        unit="CISF — International Border Unit",
        last_login="2024-09-11T06:00:00Z",
    ),
    Officer(
        id="2",
        officer_id="OFF-002",
        name="Sunita Rao",
        rank="Border Security Officer",
        unit="CISF — Arrivals Terminal",
        last_login="2024-09-11T07:00:00Z",
    ),
    Officer(
        id="3",
        officer_id="OFF-003",
        name="Arun Kumar",
        rank="Border Security Officer",
        unit="CISF — Departures Terminal",
        last_login="2024-09-10T15:00:00Z",
    ),
    # Demo officer for quick login
    Officer(
        id="demo",
        officer_id="DEMO001",
        name="Rajan Mehta",
        rank="Senior Border Security Officer",
        unit="CISF — International Border Unit",
        last_login=datetime.datetime.utcnow().isoformat() + "Z",
    ),
]

# ─── Demo Stats ───────────────────────────────────────────────────────────────

DEMO_STATS = DashboardStats(
    total_screened=1849,
    suspicious=247,
    high_risk=89,
    verified=1602,
    avg_screening_time_ms=3750,
    today_screened=47,
)

# ─── Lookup helpers ───────────────────────────────────────────────────────────

def get_officer_by_id(officer_id: str) -> Optional[Officer]:
    return next((o for o in DEMO_OFFICERS if o.officer_id == officer_id), None)

def get_all_officers() -> List[Officer]:
    return DEMO_OFFICERS

def get_demo_stats() -> DashboardStats:
    return DEMO_STATS
