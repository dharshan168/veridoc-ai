# VERIDOC AI
### AI-Powered Identity & Document Screening System
> Smart India Hackathon 2026 · Problem Statement ID: 26188

---

## Overview

VERIDOC AI is a professional-grade border security screening platform that uses AI to detect fake identities and tampered documents. It assists security personnel by automatically analyzing documents, extracting information, detecting suspicious alterations, comparing faces, and generating an explainable risk score.

**This is an assistive screening tool for authorized personnel — not an automated decision system.**

---

## Architecture

```
Veridoc AI/
├── frontend/               # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── App.tsx         # Router
│       ├── pages/          # All 7 pages
│       ├── components/     # Reusable UI components
│       ├── context/        # React context (Auth)
│       ├── services/       # API client (axios + demo fallbacks)
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Demo data (3 pre-built cases)
│
└── backend/                # Python + FastAPI
    ├── main.py             # App entry point
    ├── api/routes/         # Auth, Dashboard, Screening endpoints
    ├── services/           # Modular AI services (OCR, Validation, Tampering, Face, Risk)
    ├── models/             # Pydantic schemas
    └── utils/              # Config, demo data store
```

---

## Features

### Frontend Pages
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Officer authentication with demo access |
| Dashboard | `/` | KPIs, charts, recent cases |
| New Screening | `/screening/new` | 4-step screening workflow + demo quick-launch |
| Case Details | `/case/:id` | Tabbed view: Overview, OCR, Validation, Tampering, Face, Risk |
| Screening Report | `/screening/:id/report` | Printable/downloadable case report |
| History | `/history` | Searchable, filterable case table |
| Settings | `/settings` | Risk engine weights, system info |

### AI Pipeline Modules
| Module | Description |
|--------|-------------|
| OCR Extraction | Extracts fields from passport, visa, national ID, driving licence, permit |
| Document Validation | Validates formats, dates, MRZ, expiry, blacklist |
| Tampering Detection | Analyzes for photo replacement, text manipulation, stamp forgery, metadata anomalies |
| Face Verification | Compares document photo vs live image |
| Risk Engine | Explainable 0–100 score with configurable weights |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Charts | Recharts |
| HTTP Client | Axios |
| Backend Framework | FastAPI (Python) |
| API Server | Uvicorn |
| Validation | Pydantic v2 |
| Auth | JWT (PyJWT) |
| Database (prod) | PostgreSQL (asyncpg + SQLAlchemy) |

---

## Installation

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- pip

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env as needed

# Run
python main.py
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for all available variables.

**Required for production:**
- `SECRET_KEY` — Random 256-bit hex string
- `DATABASE_URL` — PostgreSQL connection string

**Optional (AI services):**
- `OPENAI_API_KEY` — For GPT-based OCR enhancement
- `DEEPFACE_MODEL` — DeepFace model (default: VGG-Face)
- `TESSERACT_PATH` — Tesseract binary path

---

## Demo Mode

The application works **fully without any API keys or database**.

### Frontend Demo Login
- Officer ID: `DEMO001`
- Password: `demo123`

Or click **Load Demo Mode** on the login screen.

### Pre-built Demo Cases

| Case | Description | Risk Score |
|------|-------------|------------|
| Case 1 | Valid Indian passport — all checks pass | **8 / LOW** |
| Case 2 | Tampered passport — DOB manipulation, MRZ mismatch | **67 / MEDIUM** |
| Case 3 | Face mismatch + photo replacement + invalid passport number | **89 / HIGH** |

From the **New Screening** page, click the demo case buttons for instant results with no file upload required.

---

## API Documentation

With the backend running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Officer login |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/recent` | Recent screening cases |
| POST | `/api/screening/run` | Run full AI screening pipeline |
| GET | `/api/screening/history` | All cases |
| GET | `/api/screening/{id}` | Single case by ID |
| GET | `/api/health` | System health check |

---

## Future AI Model Integration

All AI services are modular and can be replaced independently:

### OCR (Production)
```python
# backend/services/ocr_service.py
import pytesseract
from PIL import Image
# Replace _mock_passport() with real Tesseract/Cloud Vision calls
```

### Tampering Detection (Production)
```python
# backend/services/tampering_service.py
import cv2
import numpy as np
# Implement ELA (Error Level Analysis):
# from PIL import Image
# image.save('/tmp/resaved.jpg', quality=90)
# ela = ImageChops.difference(original, resaved)
```

### Face Verification (Production)
```python
# backend/services/face_service.py
from deepface import DeepFace
result = DeepFace.verify(
    img1_path=doc_image_path,
    img2_path=live_image_path,
    model_name="VGG-Face",
)
```

### Database (Production)
```python
# Replace utils/demo_store.py with:
from sqlalchemy.ext.asyncio import AsyncSession
# Full ORM models in models/db_models.py
```

---

## Risk Score Methodology

```
Score Component         Max Points
─────────────────────────────────
OCR Anomalies               20
Document Validation         20
Tampering Probability       30
Face Verification           25
Expiry / Blacklist           5
─────────────────────────────────
TOTAL                      100

Risk Levels:
  0 – 29  →  LOW RISK     (Standard verification)
 30 – 59  →  MEDIUM RISK  (Additional verification recommended)
 60 – 100 →  HIGH RISK    (Secondary manual inspection required)
```

Weights are configurable via the **Settings → Risk Engine** page.

---

## SIH Presentation Workflow (3–5 min)

1. **Open** the application → Login page appears
2. **Click** "Load Demo Mode" → Instant login as Rajan Mehta / OFF-001
3. **Dashboard** → Show live metrics: 1,849 screened, 89 high-risk, charts
4. **New Screening** → Click "Load Identity Mismatch Demo" (Case 3)
5. **Pipeline Animation** → Watch 7 stages: OCR → Validation → Tampering → Face → Risk
6. **Click** "View Full Results"
7. **OCR Tab** → Show extracted passport fields, MRZ data
8. **Validation Tab** → Show 3 failed checks (invalid passport number, MRZ mismatch, check digit failure)
9. **Tampering Tab** → Show HIGH indicators: Photo replacement 89%, Text manipulation 71%
10. **Face Tab** → Show 31.4% similarity → IDENTITY MISMATCH
11. **Risk Tab** → Show 89/100 HIGH RISK with "Why flagged?" reasons
12. **Full Report** → Professional case report → Download/Print
13. **History** → Show searchable table with all 7 demo records

---

## Security Considerations

- ✅ All secrets via environment variables — no hardcoded credentials
- ✅ Input validation on file type, size, and format
- ✅ JWT authentication with configurable expiry
- ✅ CORS configured for known frontend origins
- ✅ No real government database access
- ✅ Demo data clearly labeled throughout UI
- ✅ AI results presented as indicators, not verdicts
- ✅ Safe filename handling (no path traversal)

---

## License

Built for Smart India Hackathon 2026.  
For educational and demonstration purposes only.  
Not for deployment in real border security operations without proper authorization and testing.

---

*VERIDOC AI — "AI-Powered Identity & Document Screening"*
