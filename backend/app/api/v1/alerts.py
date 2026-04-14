from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/studies/{study_id}/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    study_id: UUID,
    patient_id: UUID | None = None,
    alert_type: str | None = None,
    severity: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Alert).where(Alert.study_id == study_id)
    if patient_id:
        query = query.where(Alert.patient_id == patient_id)
    if alert_type:
        query = query.where(Alert.alert_type == alert_type)
    if severity:
        query = query.where(Alert.severity == severity)
    if status:
        query = query.where(Alert.status == status)
    query = query.order_by(Alert.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    study_id: UUID,
    alert_id: UUID,
    data: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.study_id == study_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = data.status
    if data.status == "resolved":
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by = current_user.id

    await db.flush()
    await db.refresh(alert)
    return alert
