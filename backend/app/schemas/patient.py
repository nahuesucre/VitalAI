from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date


# --- Patient ---
class PatientCreate(BaseModel):
    subject_code: str
    sex: str | None = None
    birth_year: int | None = None
    notes: str | None = None


class PatientResponse(BaseModel):
    id: UUID
    study_id: UUID
    subject_code: str
    sex: str | None
    birth_year: int | None
    screening_status: str
    enrollment_status: str
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Screening ---
class ScreeningItemResponse(BaseModel):
    id: UUID
    patient_id: UUID
    study_rule_id: UUID | None
    criterion_name: str
    criterion_type: str | None
    status: str
    notes: str | None
    updated_at: datetime

    class Config:
        from_attributes = True


class ScreeningItemUpdate(BaseModel):
    status: str  # met, not_met, unknown, pending
    notes: str | None = None


# --- Patient Visit ---
class PatientVisitCreate(BaseModel):
    study_visit_id: UUID
    visit_date: date | None = None
    notes: str | None = None


class PatientVisitResponse(BaseModel):
    id: UUID
    patient_id: UUID
    study_visit_id: UUID
    visit_date: date | None
    visit_status: str
    notes: str | None
    created_at: datetime
    tasks: list["TaskResponse"] = []

    class Config:
        from_attributes = True


# --- Task ---
class TaskResponse(BaseModel):
    id: UUID
    patient_visit_id: UUID
    study_procedure_id: UUID
    procedure_name: str | None = None
    is_required: bool | None = None
    is_critical: bool | None = None
    status: str
    notes: str | None
    completed_at: datetime | None

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    status: str  # pending, completed, not_applicable, missing
    notes: str | None = None
