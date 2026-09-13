"""
VERIDOC AI — Pydantic Schemas
All API request/response models.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class DocumentType(str, Enum):
    passport        = "passport"
    visa            = "visa"
    national_id     = "national_id"
    driving_licence = "driving_licence"
    permit          = "permit"

class RiskLevel(str, Enum):
    LOW    = "LOW"
    MEDIUM = "MEDIUM"
    HIGH   = "HIGH"

class ScreeningStatus(str, Enum):
    pending    = "pending"
    processing = "processing"
    completed  = "completed"
    failed     = "failed"

class ValidationStatus(str, Enum):
    passed  = "passed"
    warning = "warning"
    failed  = "failed"

class PipelineStageStatus(str, Enum):
    pending    = "pending"
    processing = "processing"
    completed  = "completed"
    warning    = "warning"
    failed     = "failed"

class TamperingStatus(str, Enum):
    LOW    = "LOW"
    MEDIUM = "MEDIUM"
    HIGH   = "HIGH"


# ─── Officer ──────────────────────────────────────────────────────────────────

class Officer(BaseModel):
    id: str
    officer_id: str
    name: str
    rank: str
    unit: str
    last_login: str


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    officer_id: str
    password: str

class LoginResponse(BaseModel):
    token: str
    officer: Officer
    demo_mode: bool


# ─── OCR ──────────────────────────────────────────────────────────────────────

class OCRField(BaseModel):
    label: str
    value: str
    confidence: float = Field(ge=0, le=100)
    flagged: bool = False

class MRZData(BaseModel):
    line1: str
    line2: str
    parsed: Dict[str, str]

class OCRResult(BaseModel):
    document_type: DocumentType
    overall_confidence: float
    fields: List[OCRField]
    mrz_data: Optional[MRZData] = None
    processing_time_ms: int


# ─── Validation ───────────────────────────────────────────────────────────────

class ValidationCheck(BaseModel):
    id: str
    name: str
    category: str
    status: ValidationStatus
    message: str
    detail: Optional[str] = None
    expected_value: Optional[str] = None
    actual_value: Optional[str] = None

class ValidationResult(BaseModel):
    overall_status: ValidationStatus
    passed_count: int
    warning_count: int
    failed_count: int
    checks: List[ValidationCheck]
    processing_time_ms: int


# ─── Tampering ────────────────────────────────────────────────────────────────

class Region(BaseModel):
    x: int
    y: int
    width: int
    height: int

class TamperingIndicator(BaseModel):
    id: str
    name: str
    probability: float = Field(ge=0, le=100)
    status: TamperingStatus
    explanation: str
    region: Optional[Region] = None

class TamperingResult(BaseModel):
    overall_risk: RiskLevel
    overall_probability: float
    indicators: List[TamperingIndicator]
    heatmap_available: bool = False
    processing_time_ms: int
    disclaimer: str = (
        "Results are AI-assisted indicators only. This system does not definitively "
        "prove document authenticity or forgery. Use as one input in a multi-factor "
        "verification process."
    )


# ─── Face Verification ────────────────────────────────────────────────────────

class FaceVerificationResult(BaseModel):
    similarity_score: float = Field(ge=0, le=100)
    is_match: bool
    confidence: float = Field(ge=0, le=100)
    explanation: str
    face_detected_in_document: bool
    face_detected_in_live: bool
    processing_time_ms: int


# ─── Risk Assessment ─────────────────────────────────────────────────────────

class RiskFactor(BaseModel):
    id: str
    name: str
    score: float
    max_score: float
    description: str
    level: RiskLevel

class RiskAssessment(BaseModel):
    total_score: float
    risk_level: RiskLevel
    factors: List[RiskFactor]
    reasons: List[str]
    recommendation: str
    processing_time_ms: int


# ─── Pipeline ─────────────────────────────────────────────────────────────────

class PipelineStage(BaseModel):
    id: str
    name: str
    status: PipelineStageStatus
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None


# ─── Screening Case ───────────────────────────────────────────────────────────

class ScreeningCase(BaseModel):
    id: str
    case_id: str
    document_type: DocumentType
    officer_id: str
    officer_name: str
    created_at: str
    completed_at: Optional[str] = None
    total_time_ms: Optional[int] = None
    status: ScreeningStatus
    demo_type: Optional[str] = None
    pipeline: List[PipelineStage] = []
    ocr_result: Optional[OCRResult] = None
    validation_result: Optional[ValidationResult] = None
    tampering_result: Optional[TamperingResult] = None
    face_verification_result: Optional[FaceVerificationResult] = None
    risk_assessment: Optional[RiskAssessment] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_screened: int
    suspicious: int
    high_risk: int
    verified: int
    avg_screening_time_ms: int
    today_screened: int


# ─── Generic Response ─────────────────────────────────────────────────────────

class ApiResponse(BaseModel):
    success: bool
    data: Any
    message: Optional[str] = None
    error: Optional[str] = None
