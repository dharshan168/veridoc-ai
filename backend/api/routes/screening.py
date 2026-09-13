"""
VERIDOC AI — Screening API
Handles document upload, AI pipeline execution, history, and case retrieval.
"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from typing import Optional
import uuid
import datetime

from models.schemas import ApiResponse, DocumentType
from services.ocr_service import ocr_service
from services.validation_service import validation_service
from services.tampering_service import tampering_service
from services.face_service import face_service
from services.risk_engine import risk_engine
from utils.config import settings

router = APIRouter()

# ─── In-memory case store (demo) ──────────────────────────────────────────────
# In production, replace with async DB calls.

_case_store: dict = {}

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/history", response_model=ApiResponse)
async def get_history():
    """Return all completed screening cases."""
    cases = list(_case_store.values())
    # Include built-in demo cases in history
    cases = _DEMO_HISTORY + [c for c in cases if c["id"] not in {d["id"] for d in _DEMO_HISTORY}]
    return ApiResponse(success=True, data=cases)


@router.get("/{case_id}", response_model=ApiResponse)
async def get_case(case_id: str):
    """Retrieve a specific screening case by ID or case number."""
    # Check in-memory store
    case = _case_store.get(case_id)
    if not case:
        # Check demo cases
        case = next((c for c in _DEMO_HISTORY if c["id"] == case_id or c["caseId"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return ApiResponse(success=True, data=case)


@router.post("/{case_id}/decision", response_model=ApiResponse)
async def update_decision(case_id: str, payload: dict):
    """Record officer decision and notes for a specific case."""
    case = _case_store.get(case_id)
    if not case:
        case = next((c for c in _DEMO_HISTORY if c["id"] == case_id or c["caseId"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    decision_record = {
        "decision": payload.get("decision", "APPROVED"),
        "notes": payload.get("notes", ""),
        "officerId": payload.get("officerId", "OFF-001"),
        "officerName": payload.get("officerName", "Rajan Mehta"),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
    case["officerDecisionRecord"] = decision_record
    _case_store[case["id"]] = case
    return ApiResponse(success=True, data=case)


@router.post("/run", response_model=ApiResponse)
async def run_screening(
    document: UploadFile = File(...),
    document_type: str = Form(...),
    face_image: Optional[UploadFile] = File(None),
):
    """
    Run the full AI screening pipeline on an uploaded document.
    In demo mode, returns simulated results. In production, calls real AI services.
    """
    # ── Validate file type ──
    allowed_types = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if document.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type: {document.content_type}",
        )

    # ── Read file bytes ──
    doc_bytes = await document.read()
    face_bytes = await face_image.read() if face_image else None

    # ── Validate file size ──
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(doc_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max {settings.max_upload_mb}MB.",
        )

    # ── Generate case metadata ──
    case_id = f"VDC-{datetime.datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:6].upper()}"
    case_uuid = str(uuid.uuid4())[:8]
    created_at = datetime.datetime.utcnow().isoformat() + "Z"

    try:
        doc_type = DocumentType(document_type)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid document type: {document_type}")

    # ── Run AI services ──
    start_ms = _now_ms()

    ocr_result      = await ocr_service.extract(doc_bytes, doc_type)
    validation_result = await validation_service.validate(ocr_result, doc_type)
    tampering_result  = await tampering_service.analyze(doc_bytes)
    face_result       = await face_service.verify(doc_bytes, face_bytes) if face_bytes else None
    risk_assessment   = await risk_engine.compute(
        ocr_result, validation_result, tampering_result, face_result
    )

    total_ms = _now_ms() - start_ms
    completed_at = datetime.datetime.utcnow().isoformat() + "Z"

    # ── Build pipeline stages ──
    pipeline = [
        {"id": "upload",     "name": "Document Upload",      "status": "completed", "durationMs": 200},
        {"id": "preprocess", "name": "Image Preprocessing",  "status": "completed", "durationMs": 300},
        {"id": "ocr",        "name": "OCR Extraction",       "status": _status_from(ocr_result),        "durationMs": ocr_result.get("processing_time_ms", 800)},
        {"id": "validation", "name": "Document Validation",  "status": _status_from(validation_result), "durationMs": validation_result.get("processing_time_ms", 400)},
        {"id": "tampering",  "name": "Tampering Analysis",   "status": _status_from(tampering_result),  "durationMs": tampering_result.get("processing_time_ms", 1100)},
        {"id": "face",       "name": "Face Verification",    "status": _face_status(face_result),       "durationMs": (face_result or {}).get("processing_time_ms", 600)},
        {"id": "risk",       "name": "Risk Assessment",      "status": "completed",                     "durationMs": risk_assessment.get("processing_time_ms", 200)},
    ]

    case = {
        "id": case_uuid,
        "caseId": case_id,
        "documentType": document_type,
        "officerId": "OFF-001",
        "officerName": "Demo Officer",
        "createdAt": created_at,
        "completedAt": completed_at,
        "totalTimeMs": total_ms,
        "status": "completed",
        "pipeline": pipeline,
        "ocrResult": _snake_to_camel(ocr_result),
        "validationResult": _snake_to_camel(validation_result),
        "tamperingResult": _snake_to_camel(tampering_result),
        "faceVerificationResult": _snake_to_camel(face_result) if face_result else None,
        "riskAssessment": _snake_to_camel(risk_assessment),
    }

    _case_store[case_uuid] = case
    return ApiResponse(success=True, data=case)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _now_ms() -> int:
    return int(datetime.datetime.utcnow().timestamp() * 1000)

def _status_from(result: dict) -> str:
    if not result:
        return "completed"
    overall = result.get("overall_status") or result.get("overall_risk") or ""
    if overall in ("failed", "HIGH"):
        return "failed"
    if overall in ("warning", "MEDIUM"):
        return "warning"
    return "completed"

def _face_status(result: Optional[dict]) -> str:
    if not result:
        return "completed"
    return "failed" if not result.get("is_match") else "completed"

def _snake_to_camel(d):
    """Recursively convert snake_case dict keys to camelCase for frontend compatibility."""
    if not isinstance(d, dict):
        return d
    result = {}
    for k, v in d.items():
        parts = k.split("_")
        camel = parts[0] + "".join(p.capitalize() for p in parts[1:])
        if isinstance(v, dict):
            result[camel] = _snake_to_camel(v)
        elif isinstance(v, list):
            result[camel] = [_snake_to_camel(i) if isinstance(i, dict) else i for i in v]
        else:
            result[camel] = v
    return result


# ─── Demo history (mirrors frontend demo data) ────────────────────────────────

_DEMO_HISTORY = [
    {"id": "demo-001", "caseId": "VDC-2024-001847", "documentType": "passport",        "officerId": "OFF-001", "officerName": "Rajan Mehta",  "createdAt": "2024-09-11T08:23:15Z", "completedAt": "2024-09-11T08:23:19Z", "totalTimeMs": 3820, "status": "completed", "pipeline": [], "riskAssessment": {"totalScore": 8,  "riskLevel": "LOW",    "factors": [], "reasons": ["All checks passed"],           "recommendation": "Proceed",                             "processingTimeMs": 210}},
    {"id": "demo-002", "caseId": "VDC-2024-001848", "documentType": "passport",        "officerId": "OFF-001", "officerName": "Rajan Mehta",  "createdAt": "2024-09-11T09:14:32Z", "completedAt": "2024-09-11T09:14:36Z", "totalTimeMs": 4110, "status": "completed", "pipeline": [], "riskAssessment": {"totalScore": 67, "riskLevel": "MEDIUM", "factors": [], "reasons": ["Text manipulation detected"],    "recommendation": "Additional verification recommended", "processingTimeMs": 210}},
    {"id": "demo-003", "caseId": "VDC-2024-001849", "documentType": "passport",        "officerId": "OFF-001", "officerName": "Rajan Mehta",  "createdAt": "2024-09-11T10:47:08Z", "completedAt": "2024-09-11T10:47:12Z", "totalTimeMs": 3940, "status": "completed", "pipeline": [], "riskAssessment": {"totalScore": 89, "riskLevel": "HIGH",   "factors": [], "reasons": ["Face mismatch", "Photo replacement"], "recommendation": "Secondary inspection required",       "processingTimeMs": 210}},
    {"id": "hist-004", "caseId": "VDC-2024-001844", "documentType": "visa",             "officerId": "OFF-002", "officerName": "Sunita Rao",   "createdAt": "2024-09-11T07:15:22Z", "completedAt": "2024-09-11T07:15:26Z", "totalTimeMs": 3620, "status": "completed", "pipeline": [], "riskAssessment": {"totalScore": 12, "riskLevel": "LOW",    "factors": [], "reasons": ["All checks passed"],           "recommendation": "Proceed",                             "processingTimeMs": 180}},
    {"id": "hist-005", "caseId": "VDC-2024-001843", "documentType": "national_id",      "officerId": "OFF-001", "officerName": "Rajan Mehta",  "createdAt": "2024-09-11T06:58:11Z", "completedAt": "2024-09-11T06:58:14Z", "totalTimeMs": 2890, "status": "completed", "pipeline": [], "riskAssessment": {"totalScore": 4,  "riskLevel": "LOW",    "factors": [], "reasons": ["Document verified"],             "recommendation": "Proceed",                             "processingTimeMs": 140}},
    {"id": "hist-006", "caseId": "VDC-2024-001840", "documentType": "driving_licence",  "officerId": "OFF-003", "officerName": "Arun Kumar",   "createdAt": "2024-09-10T16:22:45Z", "completedAt": "2024-09-10T16:22:49Z", "totalTimeMs": 3100, "status": "completed", "pipeline": [], "riskAssessment": {"totalScore": 44, "riskLevel": "MEDIUM", "factors": [], "reasons": ["Expiry date inconsistency"],         "recommendation": "Additional verification recommended", "processingTimeMs": 190}},
    {"id": "hist-007", "caseId": "VDC-2024-001837", "documentType": "passport",         "officerId": "OFF-002", "officerName": "Sunita Rao",   "createdAt": "2024-09-10T15:10:33Z", "completedAt": "2024-09-10T15:10:37Z", "totalTimeMs": 4200, "status": "completed", "pipeline": [], "riskAssessment": {"totalScore": 77, "riskLevel": "HIGH",   "factors": [], "reasons": ["Photo replacement", "Face mismatch"],  "recommendation": "Secondary inspection required",       "processingTimeMs": 220}},
]
