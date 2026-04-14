from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient, PatientVisit, PatientVisitTask
from app.models.alert import Alert
from app.models.study import StudyProcedure
from app.schemas.metrics import MetricsOverview
from app.core.deps import get_current_user

router = APIRouter(prefix="/studies/{study_id}/metrics", tags=["metrics"])


@router.get("/overview", response_model=MetricsOverview)
async def get_metrics(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Patients by screening status
    patients_result = await db.execute(
        select(Patient.screening_status, func.count(Patient.id))
        .where(Patient.study_id == study_id)
        .group_by(Patient.screening_status)
    )
    patients_by_status = dict(patients_result.all())

    # Total patients
    total_patients_result = await db.execute(
        select(func.count(Patient.id)).where(Patient.study_id == study_id)
    )
    total_patients = total_patients_result.scalar() or 0

    # Visits by status
    visits_result = await db.execute(
        select(PatientVisit.visit_status, func.count(PatientVisit.id))
        .join(Patient, Patient.id == PatientVisit.patient_id)
        .where(Patient.study_id == study_id)
        .group_by(PatientVisit.visit_status)
    )
    visits_by_status = dict(visits_result.all())

    total_visits_result = await db.execute(
        select(func.count(PatientVisit.id))
        .join(Patient, Patient.id == PatientVisit.patient_id)
        .where(Patient.study_id == study_id)
    )
    total_visits = total_visits_result.scalar() or 0

    # Alerts by type
    alerts_type_result = await db.execute(
        select(Alert.alert_type, func.count(Alert.id))
        .where(Alert.study_id == study_id, Alert.status == "open")
        .group_by(Alert.alert_type)
    )
    alerts_by_type = dict(alerts_type_result.all())

    # Alerts by severity
    alerts_severity_result = await db.execute(
        select(Alert.severity, func.count(Alert.id))
        .where(Alert.study_id == study_id, Alert.status == "open")
        .group_by(Alert.severity)
    )
    alerts_by_severity = dict(alerts_severity_result.all())

    # Total open alerts
    total_alerts_result = await db.execute(
        select(func.count(Alert.id))
        .where(Alert.study_id == study_id, Alert.status == "open")
    )
    total_alerts_open = total_alerts_result.scalar() or 0

    # Common missing procedures (scoped to study)
    missing_result = await db.execute(
        select(StudyProcedure.procedure_name, func.count(PatientVisitTask.id))
        .join(PatientVisitTask, PatientVisitTask.study_procedure_id == StudyProcedure.id)
        .join(PatientVisit, PatientVisit.id == PatientVisitTask.patient_visit_id)
        .join(Patient, Patient.id == PatientVisit.patient_id)
        .where(PatientVisitTask.status == "missing", Patient.study_id == study_id)
        .group_by(StudyProcedure.procedure_name)
        .order_by(func.count(PatientVisitTask.id).desc())
        .limit(10)
    )
    common_missing = [{"name": name, "count": count} for name, count in missing_result.all()]

    return MetricsOverview(
        patients_by_status=patients_by_status,
        visits_by_status=visits_by_status,
        alerts_by_type=alerts_by_type,
        alerts_by_severity=alerts_by_severity,
        common_missing_procedures=common_missing,
        total_patients=total_patients,
        total_visits=total_visits,
        total_alerts_open=total_alerts_open,
    )
