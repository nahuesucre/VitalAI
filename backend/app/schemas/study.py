from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


# --- Study ---
class StudyCreate(BaseModel):
    name: str
    sponsor: str | None = None
    phase: str | None = None
    study_type: str | None = None
    description: str | None = None


class StudyUpdate(BaseModel):
    name: str | None = None
    sponsor: str | None = None
    phase: str | None = None
    study_type: str | None = None
    description: str | None = None
    status: str | None = None


class StudyResponse(BaseModel):
    id: UUID
    name: str
    sponsor: str | None
    phase: str | None
    study_type: str | None
    description: str | None
    status: str
    created_by: UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Document ---
class DocumentResponse(BaseModel):
    id: UUID
    study_id: UUID
    document_type: str
    title: str | None
    version: str | None
    file_path: str | None
    processing_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Visit ---
class VisitResponse(BaseModel):
    id: UUID
    study_id: UUID
    visit_code: str | None
    visit_name: str
    order_index: int
    day_nominal: int | None
    window_min_days: int | None
    window_max_days: int | None
    description: str | None
    is_confirmed: bool
    procedures: list["ProcedureResponse"] = []

    class Config:
        from_attributes = True


class VisitUpdate(BaseModel):
    visit_code: str | None = None
    visit_name: str | None = None
    order_index: int | None = None
    day_nominal: int | None = None
    window_min_days: int | None = None
    window_max_days: int | None = None
    description: str | None = None


# --- Procedure ---
class ProcedureResponse(BaseModel):
    id: UUID
    study_visit_id: UUID
    procedure_code: str | None
    procedure_name: str
    description: str | None
    is_required: bool
    is_critical: bool
    order_index: int

    class Config:
        from_attributes = True


class ProcedureUpdate(BaseModel):
    procedure_name: str | None = None
    description: str | None = None
    is_required: bool | None = None
    is_critical: bool | None = None


# --- Rule ---
class RuleResponse(BaseModel):
    id: UUID
    study_id: UUID
    rule_type: str
    title: str
    description: str | None
    source_excerpt: str | None
    is_confirmed: bool

    class Config:
        from_attributes = True


class RuleUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    rule_type: str | None = None
