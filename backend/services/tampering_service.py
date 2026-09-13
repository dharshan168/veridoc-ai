"""
VERIDOC AI — Tampering Detection Service
Analyzes documents for signs of digital manipulation.

PRODUCTION INTEGRATION:
  Replace demo with real computer vision models:
  - ELA (Error Level Analysis) using Pillow
  - CNN-based forgery detection (e.g. ManTraNet, MVSS-Net)
  - JPEG ghost analysis via OpenCV
  - Metadata forensics via ExifRead
  - Copy-move detection
"""
import asyncio
import random

DISCLAIMER = (
    "Results are AI-assisted indicators only. This system does not definitively "
    "prove document authenticity or forgery. Use as one input in a multi-factor "
    "verification process authorized by a qualified officer."
)

class TamperingService:

    async def analyze(self, image_bytes: bytes) -> dict:
        """
        Analyze a document image for signs of tampering.
        Demo mode: returns simulated forensic indicators with low probabilities
        (consistent with a typical clean document upload).
        """
        await asyncio.sleep(1.1)

        # In demo mode, simulate a mostly-clean document
        indicators = [
            {
                "id": "t1",
                "name": "Photo Replacement",
                "probability": round(random.uniform(5, 15), 1),
                "status": "LOW",
                "explanation": "No significant inconsistencies detected in photo region. JPEG compression artifacts are uniform across document boundaries.",
                "region": None,
            },
            {
                "id": "t2",
                "name": "Text Manipulation",
                "probability": round(random.uniform(3, 12), 1),
                "status": "LOW",
                "explanation": "Font characteristics are consistent throughout. No pixel-level anomalies detected in text regions. Character spacing is uniform.",
                "region": None,
            },
            {
                "id": "t3",
                "name": "Stamp Forgery",
                "probability": round(random.uniform(8, 18), 1),
                "status": "LOW",
                "explanation": "Official stamps appear genuine. Ink density and distribution pattern are consistent with authentic documents from issuing authority.",
                "region": None,
            },
            {
                "id": "t4",
                "name": "Image Compression Anomaly",
                "probability": round(random.uniform(4, 10), 1),
                "status": "LOW",
                "explanation": "Compression levels are uniform across the document. No evidence of selective re-compression or double JPEG compression.",
                "region": None,
            },
            {
                "id": "t5",
                "name": "Metadata Anomaly",
                "probability": round(random.uniform(3, 8), 1),
                "status": "LOW",
                "explanation": "Image metadata is consistent with an unmodified original scan. No software editing signatures detected.",
                "region": None,
            },
        ]

        overall_prob = round(sum(i["probability"] for i in indicators) / len(indicators), 1)
        overall_risk = "LOW" if overall_prob < 30 else ("MEDIUM" if overall_prob < 60 else "HIGH")

        return {
            "overall_risk": overall_risk,
            "overall_probability": overall_prob,
            "indicators": indicators,
            "heatmap_available": False,  # Set True when real model generates heatmaps
            "processing_time_ms": random.randint(900, 1300),
            "disclaimer": DISCLAIMER,
        }


# ─── Singleton ────────────────────────────────────────────────────────────────
tampering_service = TamperingService()
