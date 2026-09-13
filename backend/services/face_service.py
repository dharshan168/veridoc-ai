"""
VERIDOC AI — Face Verification Service
Compares document photograph with live face image.

PRODUCTION INTEGRATION:
  Replace demo with real face verification:
  - DeepFace library (VGG-Face, FaceNet, ArcFace, Dlib)
  - AWS Rekognition
  - Azure Face API
  - InsightFace
  - OpenCV Haar cascade for face detection
"""
import asyncio
import random
from typing import Optional

class FaceService:

    async def verify(self, document_bytes: bytes, live_bytes: Optional[bytes]) -> Optional[dict]:
        """
        Compare face in document with live face image.
        Returns None if no live image provided.
        Demo mode: returns a high-confidence match result.
        """
        if not live_bytes:
            return None

        await asyncio.sleep(0.6)

        # Demo: simulate a strong match (document with a real live image)
        similarity = round(random.uniform(88, 97), 1)
        confidence = round(random.uniform(85, 95), 1)
        is_match   = similarity >= 70

        return {
            "similarity_score": similarity,
            "is_match": is_match,
            "confidence": confidence,
            "explanation": (
                "The face in the document closely matches the provided live image. "
                "Key biometric markers including facial geometry, eye spacing, and "
                "facial structure are highly consistent. [DEMO — Simulated result]"
                if is_match else
                "The face in the document does NOT match the provided live image. "
                "Significant differences detected in key biometric markers. [DEMO]"
            ),
            "face_detected_in_document": True,
            "face_detected_in_live": True,
            "processing_time_ms": random.randint(500, 800),
        }


# ─── Singleton ────────────────────────────────────────────────────────────────
face_service = FaceService()
