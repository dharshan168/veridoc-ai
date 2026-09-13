"""
VERIDOC AI — Risk Engine
Computes an explainable risk score from all AI service results.

Risk Score Breakdown (configurable via Settings):
  - OCR Anomalies:         0–20 pts
  - Document Validation:   0–20 pts
  - Tampering Probability: 0–30 pts
  - Face Verification:     0–25 pts
  - Expiry / Blacklist:    0–5  pts
  ─────────────────────────────────
  Maximum:                 100 pts

Risk Thresholds:
   0–29  → LOW RISK
  30–59  → MEDIUM RISK
  60–100 → HIGH RISK
"""
import asyncio
from typing import Optional

# ─── Configurable weights ─────────────────────────────────────────────────────

WEIGHTS = {
    "ocr_anomalies":       20,
    "document_validation": 20,
    "tampering":           30,
    "face_verification":   25,
    "expiry_blacklist":     5,
}

RISK_THRESHOLDS = {
    "LOW":    (0,  29),
    "MEDIUM": (30, 59),
    "HIGH":   (60, 100),
}

class RiskEngine:

    async def compute(
        self,
        ocr_result:        dict,
        validation_result: dict,
        tampering_result:  dict,
        face_result:       Optional[dict],
    ) -> dict:
        """
        Compute the overall risk score from AI service outputs.
        Returns an explainable breakdown with contributing factors and reasons.
        """
        await asyncio.sleep(0.2)

        factors = []
        reasons = []
        total   = 0.0

        # ── 1. OCR Anomalies ──────────────────────────────────────────────────
        ocr_conf = ocr_result.get("overall_confidence", 95)
        ocr_flagged = sum(1 for f in ocr_result.get("fields", []) if f.get("flagged"))

        if ocr_conf >= 95 and ocr_flagged == 0:
            ocr_score = 1
            ocr_level = "LOW"
            ocr_desc  = "High OCR confidence across all fields. No flagged anomalies."
        elif ocr_conf >= 85 or ocr_flagged <= 1:
            ocr_score = round(WEIGHTS["ocr_anomalies"] * 0.4)
            ocr_level = "MEDIUM"
            ocr_desc  = f"Reduced OCR confidence ({ocr_conf:.1f}%) or {ocr_flagged} flagged field(s)."
            if ocr_flagged > 0:
                reasons.append(f"OCR flagged {ocr_flagged} suspicious field(s)")
        else:
            ocr_score = round(WEIGHTS["ocr_anomalies"] * 0.85)
            ocr_level = "HIGH"
            ocr_desc  = f"Low OCR confidence ({ocr_conf:.1f}%) with {ocr_flagged} flagged fields."
            reasons.append(f"Low OCR confidence ({ocr_conf:.1f}%) — document image quality may be poor or text may have been altered")

        factors.append({
            "id": "r1", "name": "OCR Anomalies", "score": ocr_score,
            "max_score": WEIGHTS["ocr_anomalies"], "description": ocr_desc, "level": ocr_level,
        })
        total += ocr_score

        # ── 2. Document Validation ────────────────────────────────────────────
        v_failed  = validation_result.get("failed_count", 0)
        v_warned  = validation_result.get("warning_count", 0)
        v_overall = validation_result.get("overall_status", "passed")

        if v_overall == "passed":
            val_score = 0
            val_level = "LOW"
            val_desc  = "All validation checks passed successfully."
        elif v_overall == "warning":
            val_score = round(WEIGHTS["document_validation"] * (0.3 + v_warned * 0.1))
            val_score = min(val_score, WEIGHTS["document_validation"] - 2)
            val_level = "MEDIUM"
            val_desc  = f"{v_warned} validation warning(s) detected."
            reasons.append(f"Document validation: {v_warned} warning(s) — {self._failed_check_names(validation_result)}")
        else:
            val_score = round(WEIGHTS["document_validation"] * (0.6 + v_failed * 0.15))
            val_score = min(val_score, WEIGHTS["document_validation"])
            val_level = "HIGH"
            val_desc  = f"{v_failed} validation failure(s) detected."
            reasons.append(f"Document validation FAILED: {self._failed_check_names(validation_result)}")

        factors.append({
            "id": "r2", "name": "Document Validation", "score": val_score,
            "max_score": WEIGHTS["document_validation"], "description": val_desc, "level": val_level,
        })
        total += val_score

        # ── 3. Tampering Probability ──────────────────────────────────────────
        tamp_prob  = tampering_result.get("overall_probability", 10)
        tamp_risk  = tampering_result.get("overall_risk", "LOW")
        high_inds  = [i for i in tampering_result.get("indicators", []) if i.get("status") == "HIGH"]

        tamp_score = round((tamp_prob / 100) * WEIGHTS["tampering"])
        tamp_level = tamp_risk

        if high_inds:
            tamp_desc = f"High tampering probability ({tamp_prob}%). {len(high_inds)} high-severity indicator(s)."
            for ind in high_inds:
                reasons.append(f"{ind['name'].upper()} DETECTED: {ind['probability']}% probability")
        elif tamp_prob > 30:
            tamp_desc = f"Moderate tampering indicators ({tamp_prob}% overall probability)."
            reasons.append(f"Moderate tampering indicators detected ({tamp_prob}%)")
        else:
            tamp_desc = f"Low tampering probability ({tamp_prob}%). Document appears unaltered."

        factors.append({
            "id": "r3", "name": "Tampering Probability", "score": tamp_score,
            "max_score": WEIGHTS["tampering"], "description": tamp_desc, "level": tamp_level,
        })
        total += tamp_score

        # ── 4. Face Verification ──────────────────────────────────────────────
        if face_result:
            face_sim   = face_result.get("similarity_score", 95)
            is_match   = face_result.get("is_match", True)
            face_conf  = face_result.get("confidence", 90)

            if is_match and face_sim >= 85:
                face_score = round(WEIGHTS["face_verification"] * 0.08)
                face_level = "LOW"
                face_desc  = f"Strong face match ({face_sim:.1f}% similarity, {face_conf:.1f}% confidence)."
            elif is_match:
                face_score = round(WEIGHTS["face_verification"] * 0.35)
                face_level = "MEDIUM"
                face_desc  = f"Partial face match ({face_sim:.1f}% similarity)."
                reasons.append(f"Reduced face match confidence ({face_sim:.1f}%)")
            else:
                face_score = round(WEIGHTS["face_verification"] * 0.96)
                face_level = "HIGH"
                face_desc  = f"FACE MISMATCH — {face_sim:.1f}% similarity (below threshold)."
                reasons.append(f"FACE MISMATCH: Live person does not match document photograph ({face_sim:.1f}% similarity)")
        else:
            face_score = 0
            face_level = "LOW"
            face_desc  = "No live face image provided — face verification skipped."

        factors.append({
            "id": "r4", "name": "Face Verification", "score": face_score,
            "max_score": WEIGHTS["face_verification"], "description": face_desc, "level": face_level,
        })
        total += face_score

        # ── 5. Expiry / Blacklist ─────────────────────────────────────────────
        blacklist_warned = any(
            "blacklist" in c.get("name", "").lower() and c.get("status") != "passed"
            for c in validation_result.get("checks", [])
        )
        exp_failed = any(
            "expiry" in c.get("name", "").lower() and c.get("status") == "failed"
            for c in validation_result.get("checks", [])
        )

        if blacklist_warned or exp_failed:
            exp_score = WEIGHTS["expiry_blacklist"]
            exp_level = "HIGH"
            exp_desc  = "Document flagged: expired or on watchlist."
            reasons.append("Document is expired or flagged in watchlist/blacklist check")
        else:
            exp_score = 1
            exp_level = "LOW"
            exp_desc  = "Document is within validity period and not on watchlist."

        factors.append({
            "id": "r5", "name": "Expiry / Blacklist", "score": exp_score,
            "max_score": WEIGHTS["expiry_blacklist"], "description": exp_desc, "level": exp_level,
        })
        total += exp_score

        # ── Final score ───────────────────────────────────────────────────────
        total_score = min(100, max(0, round(total)))
        risk_level  = self._score_to_level(total_score)
        recommendation = {
            "LOW":    "Document appears consistent. Proceed with standard verification procedures.",
            "MEDIUM": "Additional verification recommended. Request supporting documents and conduct manual inspection.",
            "HIGH":   "Secondary manual inspection required immediately. Do not allow passage without supervisory clearance.",
        }[risk_level]

        if not reasons:
            reasons = ["All AI checks passed with acceptable confidence levels"]

        return {
            "total_score": total_score,
            "risk_level": risk_level,
            "factors": factors,
            "reasons": reasons,
            "recommendation": recommendation,
            "processing_time_ms": 210,
        }

    def _score_to_level(self, score: float) -> str:
        if score <= 29:
            return "LOW"
        if score <= 59:
            return "MEDIUM"
        return "HIGH"

    def _failed_check_names(self, validation_result: dict) -> str:
        failed = [
            c["name"] for c in validation_result.get("checks", [])
            if c.get("status") in ("failed", "warning")
        ]
        return ", ".join(failed[:3]) or "unknown"


# ─── Singleton ────────────────────────────────────────────────────────────────
risk_engine = RiskEngine()
