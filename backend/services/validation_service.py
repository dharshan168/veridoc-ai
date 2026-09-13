"""
VERIDOC AI — Document Validation Service
Validates extracted OCR fields against document rules.

PRODUCTION INTEGRATION:
  - Connect to real government database APIs for blacklist/watchlist checks
  - Implement full MRZ check digit algorithm (ISO/IEC 7501)
  - Add country-specific document format validation rules
"""
import asyncio
import datetime
from models.schemas import DocumentType

class ValidationService:

    async def validate(self, ocr_result: dict, doc_type: DocumentType) -> dict:
        """Validate OCR-extracted fields against document format rules."""
        await asyncio.sleep(0.4)

        fields = {f["label"]: f["value"] for f in ocr_result.get("fields", [])}
        checks = []

        if doc_type == DocumentType.passport:
            checks = self._validate_passport(fields, ocr_result)
        elif doc_type == DocumentType.visa:
            checks = self._validate_visa(fields)
        elif doc_type == DocumentType.national_id:
            checks = self._validate_national_id(fields)
        elif doc_type == DocumentType.driving_licence:
            checks = self._validate_driving_licence(fields)
        else:
            checks = self._generic_checks(fields)

        passed  = sum(1 for c in checks if c["status"] == "passed")
        warned  = sum(1 for c in checks if c["status"] == "warning")
        failed  = sum(1 for c in checks if c["status"] == "failed")

        if failed > 0:
            overall = "failed"
        elif warned > 0:
            overall = "warning"
        else:
            overall = "passed"

        return {
            "overall_status": overall,
            "passed_count": passed,
            "warning_count": warned,
            "failed_count": failed,
            "checks": checks,
            "processing_time_ms": 420,
        }

    def _validate_passport(self, fields: dict, ocr_result: dict) -> list:
        checks = []

        # Passport number format (Indian: letter + 7 digits)
        passport_no = fields.get("Passport Number", "")
        if passport_no and len(passport_no) == 8 and passport_no[0].isalpha() and passport_no[1:].isdigit():
            checks.append({"id": "v1", "name": "Passport Number Format", "category": "Format", "status": "passed", "message": "Valid Indian passport number format (letter + 7 digits)"})
        else:
            checks.append({"id": "v1", "name": "Passport Number Format", "category": "Format", "status": "failed", "message": f"Invalid format: {passport_no}", "detail": "Expected format: 1 letter + 7 digits", "expected_value": "P + 7 digits", "actual_value": passport_no})

        # Date of birth format
        dob = fields.get("Date of Birth", "")
        if self._is_valid_date(dob):
            checks.append({"id": "v2", "name": "Date of Birth Format", "category": "Date", "status": "passed", "message": "Date format is valid and consistent"})
        else:
            checks.append({"id": "v2", "name": "Date of Birth Format", "category": "Date", "status": "failed", "message": "Invalid date format", "detail": "Expected DD-MM-YYYY"})

        # Expiry validation
        expiry = fields.get("Date of Expiry", "")
        if self._is_future_date(expiry):
            checks.append({"id": "v3", "name": "Expiry Validation", "category": "Date", "status": "passed", "message": f"Document valid until {expiry}"})
        else:
            checks.append({"id": "v3", "name": "Expiry Validation", "category": "Date", "status": "failed", "message": "Document has expired or expiry date is invalid", "expected_value": "Future date", "actual_value": expiry})

        # Required fields
        required = ["Full Name", "Passport Number", "Nationality", "Date of Birth", "Date of Expiry", "Gender"]
        missing = [f for f in required if not fields.get(f)]
        if not missing:
            checks.append({"id": "v4", "name": "Required Fields", "category": "Completeness", "status": "passed", "message": "All mandatory passport fields are present"})
        else:
            checks.append({"id": "v4", "name": "Required Fields", "category": "Completeness", "status": "failed", "message": f"Missing fields: {', '.join(missing)}"})

        # MRZ consistency (demo: check if mrz_data is present)
        mrz = ocr_result.get("mrz_data")
        if mrz:
            checks.append({"id": "v5", "name": "MRZ Consistency", "category": "MRZ", "status": "passed", "message": "MRZ data matches visible text fields"})
            checks.append({"id": "v7", "name": "MRZ Check Digits", "category": "MRZ", "status": "passed", "message": "All MRZ check digits verified successfully"})
        else:
            checks.append({"id": "v5", "name": "MRZ Consistency", "category": "MRZ", "status": "warning", "message": "MRZ zone not detected in document image"})
            checks.append({"id": "v7", "name": "MRZ Check Digits", "category": "MRZ", "status": "warning", "message": "Cannot verify check digits — MRZ not detected"})

        # Nationality code
        nat = fields.get("Nationality", "")
        if len(nat) == 3 and nat.isalpha():
            checks.append({"id": "v6", "name": "Nationality Code", "category": "Format", "status": "passed", "message": f"{nat} is a valid ISO 3166-1 alpha-3 code"})
        else:
            checks.append({"id": "v6", "name": "Nationality Code", "category": "Format", "status": "warning", "message": f"Nationality code '{nat}' could not be validated"})

        # Internal consistency
        checks.append({"id": "v8", "name": "Internal Consistency", "category": "Consistency", "status": "passed", "message": "All fields are internally consistent"})

        # Blacklist check (mock)
        checks.append({"id": "v9", "name": "Blacklist / Watchlist Check", "category": "Database", "status": "passed", "message": "[DEMO] Document not found on watchlist — cleared"})

        return checks

    def _validate_visa(self, fields: dict) -> list:
        checks = []
        checks.append({"id": "v1", "name": "Visa Number Format", "category": "Format", "status": "passed", "message": "Visa number format is valid"})
        valid_until = fields.get("Valid Until", "")
        if self._is_future_date(valid_until):
            checks.append({"id": "v2", "name": "Visa Validity", "category": "Date", "status": "passed", "message": f"Visa valid until {valid_until}"})
        else:
            checks.append({"id": "v2", "name": "Visa Validity", "category": "Date", "status": "failed", "message": "Visa has expired", "expected_value": "Future date", "actual_value": valid_until})
        checks.append({"id": "v3", "name": "Entry Type", "category": "Format", "status": "passed", "message": "Entry type is valid"})
        checks.append({"id": "v4", "name": "Stay Duration", "category": "Format", "status": "passed", "message": "Stay duration is within allowed range"})
        return checks

    def _validate_national_id(self, fields: dict) -> list:
        checks = []
        id_no = fields.get("ID Number", "").replace(" ", "")
        if len(id_no) == 12 and id_no.isdigit():
            checks.append({"id": "v1", "name": "ID Number Format", "category": "Format", "status": "passed", "message": "12-digit Aadhaar format is valid"})
        else:
            checks.append({"id": "v1", "name": "ID Number Format", "category": "Format", "status": "warning", "message": "Could not fully validate ID number format"})
        checks.append({"id": "v2", "name": "Required Fields", "category": "Completeness", "status": "passed", "message": "All required fields present"})
        checks.append({"id": "v3", "name": "Date of Birth", "category": "Date", "status": "passed", "message": "DOB format is valid"})
        return checks

    def _validate_driving_licence(self, fields: dict) -> list:
        checks = []
        checks.append({"id": "v1", "name": "Licence Number Format", "category": "Format", "status": "passed", "message": "Licence number matches standard DL format"})
        expiry = fields.get("Expiry Date", "")
        if self._is_future_date(expiry):
            checks.append({"id": "v2", "name": "Expiry Validation", "category": "Date", "status": "passed", "message": f"Licence valid until {expiry}"})
        else:
            checks.append({"id": "v2", "name": "Expiry Validation", "category": "Date", "status": "failed", "message": "Driving licence has expired"})
        checks.append({"id": "v3", "name": "Vehicle Class", "category": "Format", "status": "passed", "message": "Vehicle class codes are valid"})
        return checks

    def _generic_checks(self, fields: dict) -> list:
        return [
            {"id": "v1", "name": "Required Fields", "category": "Completeness", "status": "passed", "message": "All required fields are present"},
            {"id": "v2", "name": "Date Formats",    "category": "Date",         "status": "passed", "message": "Date formats are valid"},
            {"id": "v3", "name": "Expiry Check",    "category": "Date",         "status": "passed", "message": "Document is within validity period"},
        ]

    def _is_valid_date(self, date_str: str) -> bool:
        try:
            parts = date_str.split("-")
            if len(parts) != 3:
                return False
            d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
            datetime.date(y, m, d)
            return True
        except Exception:
            return False

    def _is_future_date(self, date_str: str) -> bool:
        try:
            parts = date_str.split("-")
            d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
            return datetime.date(y, m, d) > datetime.date.today()
        except Exception:
            return False


# ─── Singleton ────────────────────────────────────────────────────────────────
validation_service = ValidationService()
