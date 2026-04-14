import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Study(Base):
    __tablename__ = "studies"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sponsor: Mapped[str | None] = mapped_column(String(255))
    phase: Mapped[str | None] = mapped_column(String(50))
    study_type: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    documents: Mapped[list["StudyDocument"]] = relationship(back_populates="study", cascade="all, delete-orphan")
    visits: Mapped[list["StudyVisit"]] = relationship(back_populates="study", cascade="all, delete-orphan")
    rules: Mapped[list["StudyRule"]] = relationship(back_populates="study", cascade="all, delete-orphan")
    patients: Mapped[list["Patient"]] = relationship(back_populates="study", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="study", cascade="all, delete-orphan")


class StudyDocument(Base):
    __tablename__ = "study_documents"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    study_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    version: Mapped[str | None] = mapped_column(String(50))
    file_path: Mapped[str | None] = mapped_column(Text)
    file_url: Mapped[str | None] = mapped_column(Text)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    processing_status: Mapped[str] = mapped_column(String(50), default="pending")
    extracted_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    study: Mapped["Study"] = relationship(back_populates="documents")


class StudyVisit(Base):
    __tablename__ = "study_visits"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    study_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    visit_code: Mapped[str | None] = mapped_column(String(50))
    visit_name: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    day_nominal: Mapped[int | None] = mapped_column(Integer)
    window_min_days: Mapped[int | None] = mapped_column(Integer)
    window_max_days: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    study: Mapped["Study"] = relationship(back_populates="visits")
    procedures: Mapped[list["StudyProcedure"]] = relationship(back_populates="visit", cascade="all, delete-orphan")


class StudyProcedure(Base):
    __tablename__ = "study_procedures"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    study_visit_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("study_visits.id", ondelete="CASCADE"), nullable=False)
    procedure_code: Mapped[str | None] = mapped_column(String(100))
    procedure_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    visit: Mapped["StudyVisit"] = relationship(back_populates="procedures")


class StudyRule(Base):
    __tablename__ = "study_rules"

    id: Mapped[uuid.UUID] = mapped_column(default=uuid.uuid4, primary_key=True)
    study_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    source_document_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("study_documents.id"))
    source_excerpt: Mapped[str | None] = mapped_column(Text)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    study: Mapped["Study"] = relationship(back_populates="rules")


# Import here to avoid circular imports — Patient and Alert are in their own files
from app.models.patient import Patient
from app.models.alert import Alert
