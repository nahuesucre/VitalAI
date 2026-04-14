from contextlib import asynccontextmanager
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.api.v1 import auth, studies, structure, patients, screening, visits, alerts, metrics, chat
from app.db.session import init_db, get_db
from app.models.user import User
from app.models.patient import Patient
from app.core.deps import get_current_user
from app.services.document_parser import parse_document
from app.services.alert_engine import run_alerts_for_visit
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    from app.db.seed import seed
    await seed()
    yield


app = FastAPI(
    title="VitalAI",
    description="Clinical trial operations platform powered by AI",
    version="0.1.0",
    lifespan=lifespan,
)

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
    return {"status": "ok", "service": "vitalai"}


@app.post("/api/v1/studies/{study_id}/documents/{doc_id}/parse")
async def trigger_parse(
    study_id: UUID,
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Run parsing in a thread to avoid blocking the event loop
        result = await parse_document(doc_id, db)
        return {"status": "completed", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")


@app.post("/api/v1/patients/{patient_id}/visits/{visit_id}/check-alerts")
async def check_alerts(
    patient_id: UUID,
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        return {"alerts": []}
    new_alerts = await run_alerts_for_visit(visit_id, patient.study_id, db)
    return {"alerts_created": len(new_alerts)}
