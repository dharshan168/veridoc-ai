"""
VERIDOC AI — OCR Service
Extracts text fields from identity documents.

PRODUCTION INTEGRATION:
  Replace the demo implementation below with real OCR using:
  - Tesseract (pytesseract) for basic OCR
  - Google Cloud Vision API
  - AWS Textract
  - Azure Form Recognizer
  - Custom trained model (e.g. TrOCR, Donut)
"""
import asyncio
import random
from typing import Optional
from models.schemas import DocumentType

class OCRService:

    async def extract(self, image_bytes: bytes, doc_type: DocumentType) -> dict:
        """
        Extract text fields from a document image.
        Demo mode: returns realistic simulated fields with slight randomization.
        """
        # Simulate processing time
        await asyncio.sleep(0.8)

        if doc_type == DocumentType.passport:
            return self._mock_passport()
        elif doc_type == DocumentType.visa:
            return self._mock_visa()
        elif doc_type == DocumentType.national_id:
            return self._mock_national_id()
        elif doc_type == DocumentType.driving_licence:
            return self._mock_driving_licence()
        else:
            return self._mock_permit()

    def _mock_passport(self) -> dict:
        confidence = round(random.uniform(92, 99), 1)
        return {
            "document_type": "passport",
            "overall_confidence": confidence,
            "processing_time_ms": random.randint(700, 1100),
            "fields": [
                {"label": "Full Name",        "value": "ARJUN SHARMA",                       "confidence": round(random.uniform(95, 99), 1), "flagged": False},
                {"label": "Passport Number",  "value": "P4729183",                           "confidence": round(random.uniform(93, 99), 1), "flagged": False},
                {"label": "Nationality",      "value": "IND",                                "confidence": round(random.uniform(97, 99), 1), "flagged": False},
                {"label": "Date of Birth",    "value": "14-06-1988",                         "confidence": round(random.uniform(92, 98), 1), "flagged": False},
                {"label": "Date of Expiry",   "value": "13-06-2034",                         "confidence": round(random.uniform(93, 99), 1), "flagged": False},
                {"label": "Gender",           "value": "M",                                  "confidence": round(random.uniform(98, 99), 1), "flagged": False},
                {"label": "Place of Birth",   "value": "MUMBAI",                             "confidence": round(random.uniform(90, 97), 1), "flagged": False},
                {"label": "Issuing Authority","value": "MUMBAI REGIONAL PASSPORT OFFICE",    "confidence": round(random.uniform(88, 95), 1), "flagged": False},
            ],
            "mrz_data": {
                "line1": "P<INDSHARMA<<ARJUN<<<<<<<<<<<<<<<<<<<<<<<<",
                "line2": "P47291831IND8806144M3406131<<<<<<<<<<<<6",
                "parsed": {
                    "documentType": "P",
                    "issuingCountry": "IND",
                    "surname": "SHARMA",
                    "givenNames": "ARJUN",
                    "passportNumber": "P4729183",
                    "nationality": "IND",
                    "dateOfBirth": "880614",
                    "sex": "M",
                    "expiryDate": "340613",
                },
            },
        }

    def _mock_visa(self) -> dict:
        return {
            "document_type": "visa",
            "overall_confidence": round(random.uniform(90, 97), 1),
            "processing_time_ms": random.randint(600, 900),
            "fields": [
                {"label": "Visa Number",    "value": "V20249182743",    "confidence": round(random.uniform(90, 98), 1), "flagged": False},
                {"label": "Visa Type",      "value": "Tourist (T-2)",   "confidence": round(random.uniform(93, 99), 1), "flagged": False},
                {"label": "Valid From",     "value": "01-09-2024",      "confidence": round(random.uniform(92, 98), 1), "flagged": False},
                {"label": "Valid Until",    "value": "01-09-2025",      "confidence": round(random.uniform(91, 97), 1), "flagged": False},
                {"label": "Stay Duration",  "value": "30 Days",         "confidence": round(random.uniform(90, 97), 1), "flagged": False},
                {"label": "Entry Type",     "value": "Single Entry",    "confidence": round(random.uniform(93, 99), 1), "flagged": False},
            ],
            "mrz_data": None,
        }

    def _mock_national_id(self) -> dict:
        return {
            "document_type": "national_id",
            "overall_confidence": round(random.uniform(93, 99), 1),
            "processing_time_ms": random.randint(500, 800),
            "fields": [
                {"label": "Name",        "value": "PRIYA NAIR",    "confidence": round(random.uniform(94, 99), 1), "flagged": False},
                {"label": "ID Number",   "value": "4829 3821 9021","confidence": round(random.uniform(92, 98), 1), "flagged": False},
                {"label": "DOB",         "value": "22-03-1995",    "confidence": round(random.uniform(91, 97), 1), "flagged": False},
                {"label": "Address",     "value": "KOCHI, KERALA", "confidence": round(random.uniform(85, 93), 1), "flagged": False},
                {"label": "Gender",      "value": "Female",        "confidence": round(random.uniform(96, 99), 1), "flagged": False},
            ],
            "mrz_data": None,
        }

    def _mock_driving_licence(self) -> dict:
        return {
            "document_type": "driving_licence",
            "overall_confidence": round(random.uniform(88, 96), 1),
            "processing_time_ms": random.randint(500, 800),
            "fields": [
                {"label": "Name",          "value": "ARUN KUMAR",    "confidence": round(random.uniform(91, 97), 1), "flagged": False},
                {"label": "Licence No.",   "value": "DL-0320110149722","confidence": round(random.uniform(88, 95), 1), "flagged": False},
                {"label": "DOB",           "value": "15-08-1985",    "confidence": round(random.uniform(90, 97), 1), "flagged": False},
                {"label": "Issue Date",    "value": "11-03-2011",    "confidence": round(random.uniform(88, 95), 1), "flagged": False},
                {"label": "Expiry Date",   "value": "10-03-2031",    "confidence": round(random.uniform(87, 94), 1), "flagged": False},
                {"label": "Vehicle Class", "value": "LMV, MCWG",     "confidence": round(random.uniform(85, 93), 1), "flagged": False},
            ],
            "mrz_data": None,
        }

    def _mock_permit(self) -> dict:
        return {
            "document_type": "permit",
            "overall_confidence": round(random.uniform(87, 95), 1),
            "processing_time_ms": random.randint(400, 700),
            "fields": [
                {"label": "Permit Number", "value": "WP/2024/MH/18291", "confidence": round(random.uniform(88, 95), 1), "flagged": False},
                {"label": "Name",          "value": "VIKRAM DESAI",     "confidence": round(random.uniform(90, 97), 1), "flagged": False},
                {"label": "Permit Type",   "value": "Work Permit",      "confidence": round(random.uniform(92, 98), 1), "flagged": False},
                {"label": "Valid Until",   "value": "31-12-2025",       "confidence": round(random.uniform(88, 95), 1), "flagged": False},
            ],
            "mrz_data": None,
        }


# ─── Singleton ────────────────────────────────────────────────────────────────
ocr_service = OCRService()
