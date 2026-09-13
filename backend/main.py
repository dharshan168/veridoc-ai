from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import os

from api.routes import auth, dashboard, screening
from utils.config import settings

# ─── App lifecycle ────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[*] VERIDOC AI Backend starting...")
    print(f"    Mode: {'DEMO' if settings.demo_mode else 'PRODUCTION'}")
    print(f"    Host: {settings.host}:{settings.port}")
    yield
    print("[*] VERIDOC AI Backend shutting down.")

# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="VERIDOC AI",
    description="AI-Powered Identity & Document Screening System — Backend API",
    version="2.4.1",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(auth.router,       prefix="/api/auth",       tags=["Authentication"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(screening.router,  prefix="/api/screening",  tags=["Screening"])

# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["Health"])
async def health():
    return {
        "status": "operational",
        "version": "2.4.1",
        "demo_mode": settings.demo_mode,
        "services": {
            "ocr": "demo" if settings.demo_mode else "active",
            "face_verification": "demo" if settings.demo_mode else "active",
            "tampering_detection": "demo" if settings.demo_mode else "active",
            "database": "in-memory" if settings.demo_mode else "postgresql",
        }
    }

# ─── Static Frontend Serving (Unified Deployment) ─────────────────────────────

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

if os.path.exists(frontend_dist):
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
