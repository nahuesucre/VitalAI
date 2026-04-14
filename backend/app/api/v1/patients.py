from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient, PatientScreening
from app.models.study import StudyRule
from app.schemas.patient import PatientCreate, PatientResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/studies/{study_id}/patients", tags=["patients"])


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    study_id: UUID,
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = Patient(
        study_id=study_id,
        subject_code=data.subject_code,
        sex=data.sex,
        birth_year=data.birth_year,
        notes=data.notes,
        created_by=current_user.id,
        screening_status="not_started",
        enrollment_status="screening",
    )
    db.add(patient)
    await db.flush()
    await db.refresh(patient)

    # Auto-initialize screening from study rules (inclusion/exclusion)
    rules_result = await db.execute(
        select(StudyRule).where(
            StudyRule.study_id == study_id,
            StudyRule.rule_type.in_(["inclusion", "exclusion"]),
        )
    )
    rules = rules_result.scalars().all()
    for rule in rules:
        screening_item = PatientScreening(
            patient_id=patient.id,
            study_rule_id=rule.id,
            criterion_name=rule.title,
            criterion_type=rule.rule_type,
            status="unknown",
        )
        db.add(screening_item)

    if rules:
        patient.screening_status = "in_progress"

    await db.flush()
    await db.refresh(patient)
    return patient


@router.get("/", response_model=list[PatientResponse])
async def list_patients(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient)
        .where(Patient.study_id == study_id)
        .order_by(Patient.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    study_id: UUID,
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.study_id == study_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
