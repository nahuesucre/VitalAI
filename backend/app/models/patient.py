import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Integer, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    study_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    subject_code: Mapped[str] = mapped_column(String(100), nullable=False)
    sex: Mapped[str | None] = mapped_column(String(20))
    birth_year: Mapped[int | None] = mapped_column(Integer)
    screening_status: Mapped[str] = mapped_column(String(50), default="not_started")
    enrollment_status: Mapped[str] = mapped_column(String(50), default="screening")
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    study: Mapped["Study"] = relationship(back_populates="patients")
    screening_items: Mapped[list["PatientScreening"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
    visits: Mapped[list["PatientVisit"]] = relationship(back_populates="patient", cascade="all, delete-orphan")


class PatientScreening(Base):
    __tablename__ = "patient_screening"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    study_rule_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("study_rules.id"))
    criterion_name: Mapped[str] = mapped_column(String(500), nullable=False)
    criterion_type: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50), default="unknown")
    notes: Mapped[str | None] = mapped_column(Text)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    patient: Mapped["Patient"] = relationship(back_populates="screening_items")


class PatientVisit(Base):
    __tablename__ = "patient_visits"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    study_visit_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("study_visits.id"), nullable=False)
    visit_date: Mapped[date | None] = mapped_column(Date)
    visit_status: Mapped[str] = mapped_column(String(50), default="planned")
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    patient: Mapped["Patient"] = relationship(back_populates="visits")
    study_visit: Mapped["StudyVisit"] = relationship()
    tasks: Mapped[list["PatientVisitTask"]] = relationship(back_populates="patient_visit", cascade="all, delete-orphan")


class PatientVisitTask(Base):
    __tablename__ = "patient_visit_tasks"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    patient_visit_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patient_visits.id", ondelete="CASCADE"), nullable=False)
    study_procedure_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("study_procedures.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    notes: Mapped[str | None] = mapped_column(Text)
    completed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    patient_visit: Mapped["PatientVisit"] = relationship(back_populates="tasks")
    study_procedure: Mapped["StudyProcedure"] = relationship()


# Avoid circular imports
from app.models.study import Study, StudyVisit, StudyProcedure
