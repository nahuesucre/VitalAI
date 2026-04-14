from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, studies, structure, patients, screening, visits, alerts, metrics, chat
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (for SQLite dev mode)
    await init_db()
    # Seed demo data
    from app.db.seed import seed
    await seed()
    yield


app = FastAPI(
    title="TrialFlow AI",
    description="Clinical trial operations platform powered by AI",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(studies.router, prefix="/api/v1")
app.include_router(structure.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1")
app.include_router(screening.router, prefix="/api/v1")
app.include_router(visits.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "trialflow-ai"}


# Document parsing endpoint (triggers AI extraction)
from uuid import UUID
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.core.deps import get_current_user
from app.services.document_parser import parse_document


@app.post("/api/v1/studies/{study_id}/documents/{doc_id}/parse")
async def trigger_parse(
    study_id: UUID,
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await parse_document(doc_id, db)
        return {"status": "completed", "data": result}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# Alert check endpoint
from app.services.alert_engine import run_alerts_for_visit
from sqlalchemy import select
from app.models.patient import PatientVisit, Patient


@app.post("/api/v1/patients/{patient_id}/visits/{visit_id}/check-alerts")
async def check_alerts(
    patient_id: UUID,
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get study_id from patient
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        return {"alerts": []}
    new_alerts = await run_alerts_for_visit(visit_id, patient.study_id, db)
    return {"alerts_created": len(new_alerts)}
