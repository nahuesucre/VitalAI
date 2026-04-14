"""Rule-based alert detection engine. No LLM needed."""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.patient import Patient, PatientScreening, PatientVisit, PatientVisitTask
from app.models.study import StudyProcedure
from app.models.alert import Alert


async def check_visit_alerts(patient_visit_id: UUID, study_id: UUID, db: AsyncSession) -> list[Alert]:
    """Check for alerts on a specific patient visit."""
    alerts = []

    # Get visit with tasks
    visit_result = await db.execute(
        select(PatientVisit).where(PatientVisit.id == patient_visit_id)
    )
    visit = visit_result.scalar_one_or_none()
    if not visit:
        return alerts

    # Get all tasks for this visit
    tasks_result = await db.execute(
        select(PatientVisitTask, StudyProcedure)
        .join(StudyProcedure, StudyProcedure.id == PatientVisitTask.study_procedure_id)
        .where(PatientVisitTask.patient_visit_id == patient_visit_id)
    )
    task_rows = tasks_result.all()

    for task, procedure in task_rows:
        # Critical procedure not completed
        if procedure.is_critical and task.status in ("pending", "missing"):
            alert = Alert(
                study_id=study_id,
                patient_id=visit.patient_id,
                patient_visit_id=patient_visit_id,
                alert_type="critical_missing",
                severity="high",
                title=f"Critical procedure not completed: {procedure.procedure_name}",
                description=f"The procedure '{procedure.procedure_name}' is marked as critical and has status '{task.status}'.",
            )
            alerts.append(alert)

        # Required procedure missing
        elif procedure.is_required and task.status == "missing":
            alert = Alert(
                study_id=study_id,
                patient_id=visit.patient_id,
                patient_visit_id=patient_visit_id,
                alert_type="missing_procedure",
                severity="medium",
                title=f"Required procedure missing: {procedure.procedure_name}",
                description=f"The required procedure '{procedure.procedure_name}' was marked as missing.",
            )
            alerts.append(alert)

    return alerts


async def check_screening_alerts(patient_id: UUID, study_id: UUID, db: AsyncSession) -> list[Alert]:
    """Check for screening-related alerts."""
    alerts = []

    screening_result = await db.execute(
        select(PatientScreening).where(PatientScreening.patient_id == patient_id)
    )
    items = screening_result.scalars().all()

    unknown_count = sum(1 for item in items if item.status == "unknown")
    if unknown_count > 0:
        alert = Alert(
            study_id=study_id,
            patient_id=patient_id,
            alert_type="incomplete_screening",
            severity="medium",
            title=f"Screening incomplete: {unknown_count} criteria pending",
            description=f"Patient has {unknown_count} screening criteria that have not been evaluated yet.",
        )
        alerts.append(alert)

    # Check if any exclusion criterion is met (patient should not be enrolled)
    exclusion_met = [item for item in items if item.criterion_type == "exclusion" and item.status == "met"]
    for item in exclusion_met:
        alert = Alert(
            study_id=study_id,
            patient_id=patient_id,
            alert_type="exclusion_met",
            severity="high",
            title=f"Exclusion criterion met: {item.criterion_name[:100]}",
            description=f"The exclusion criterion '{item.criterion_name}' is met. Patient may not be eligible.",
        )
        alerts.append(alert)

    return alerts


async def run_alerts_for_visit(patient_visit_id: UUID, study_id: UUID, db: AsyncSession) -> list[Alert]:
    """Run all alert checks for a visit and save new alerts. Also resolve stale alerts."""
    from datetime import datetime, timezone

    new_alerts = await check_visit_alerts(patient_visit_id, study_id, db)
    new_titles = {a.title for a in new_alerts}

    # Resolve old alerts that no longer apply
    existing_result = await db.execute(
        select(Alert).where(
            Alert.patient_visit_id == patient_visit_id,
            Alert.status == "open",
        )
    )
    existing_alerts = existing_result.scalars().all()
    for existing in existing_alerts:
        if existing.title not in new_titles:
            existing.status = "resolved"
            existing.resolved_at = datetime.now(timezone.utc)

    # Add new alerts (avoid duplicates)
    for alert in new_alerts:
        already = await db.execute(
            select(Alert).where(
                Alert.patient_visit_id == patient_visit_id,
                Alert.alert_type == alert.alert_type,
                Alert.title == alert.title,
                Alert.status == "open",
            )
        )
        if not already.scalar_one_or_none():
            db.add(alert)

    await db.flush()
    return new_alerts
