from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class AlertResponse(BaseModel):
    id: UUID
    study_id: UUID
    patient_id: UUID | None
    patient_visit_id: UUID | None
    alert_type: str
    severity: str
    title: str
    description: str | None
    status: str
    created_at: datetime
    resolved_at: datetime | None

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: str  # open, acknowledged, resolved
