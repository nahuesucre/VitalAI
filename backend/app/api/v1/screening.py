from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient, PatientScreening
from app.schemas.patient import ScreeningItemResponse, ScreeningItemUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/patients/{patient_id}/screening", tags=["screening"])


@router.get("/", response_model=list[ScreeningItemResponse])
async def get_screening(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PatientScreening)
        .where(PatientScreening.patient_id == patient_id)
        .order_by(PatientScreening.criterion_type, PatientScreening.criterion_name)
    )
    return result.scalars().all()


@router.put("/{item_id}", response_model=ScreeningItemResponse)
async def update_screening_item(
    patient_id: UUID,
    item_id: UUID,
    data: ScreeningItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PatientScreening).where(
            PatientScreening.id == item_id,
            PatientScreening.patient_id == patient_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Screening item not found")

    item.status = data.status
    if data.notes is not None:
        item.notes = data.notes
    item.updated_by = current_user.id
    item.updated_at = datetime.now(timezone.utc)

    await db.flush()

    # Update patient screening status based on all items
    all_items_result = await db.execute(
        select(PatientScreening).where(PatientScreening.patient_id == patient_id)
    )
    all_items = all_items_result.scalars().all()

    patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = patient_result.scalar_one()

    if all(i.status == "met" for i in all_items if i.criterion_type == "inclusion") and \
       all(i.status == "not_met" for i in all_items if i.criterion_type == "exclusion"):
        patient.screening_status = "eligible"
    elif any(i.status == "not_met" for i in all_items if i.criterion_type == "inclusion") or \
         any(i.status == "met" for i in all_items if i.criterion_type == "exclusion"):
        patient.screening_status = "not_eligible"
    elif any(i.status == "unknown" for i in all_items):
        patient.screening_status = "in_progress"
    else:
        patient.screening_status = "pending_review"

    await db.flush()
    await db.refresh(item)
    return item
