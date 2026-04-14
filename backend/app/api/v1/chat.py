import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.models.study import Study, StudyDocument, StudyVisit, StudyProcedure, StudyRule
from app.models.patient import Patient, PatientScreening, PatientVisit, PatientVisitTask
from app.models.alert import Alert
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import llm_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context_parts = []
    context_labels = []

    # Study info
    study_result = await db.execute(select(Study).where(Study.id == data.study_id))
    study = study_result.scalar_one_or_none()
    if study:
        context_parts.append(f"Study: {study.name} (Phase {study.phase}, Sponsor: {study.sponsor})")
        context_labels.append("study_info")

    # Study structure (visits + procedures)
    visits_result = await db.execute(
        select(StudyVisit).where(StudyVisit.study_id == data.study_id).order_by(StudyVisit.order_index)
    )
    visits = visits_result.scalars().all()
    if visits:
        visit_summary = []
        for v in visits:
            procs_result = await db.execute(
                select(StudyProcedure).where(StudyProcedure.study_visit_id == v.id).order_by(StudyProcedure.order_index)
            )
            procs = procs_result.scalars().all()
            proc_names = ", ".join(p.procedure_name for p in procs)
            window = ""
            if v.window_min_days is not None or v.window_max_days is not None:
                window = f" (window: {v.window_min_days or 0} to {v.window_max_days or 0} days)"
            visit_summary.append(f"- {v.visit_code or v.visit_name}: {v.visit_name}{window}\n  Procedures: {proc_names}")
        context_parts.append("Study visits:\n" + "\n".join(visit_summary))
        context_labels.append("study_structure")

    # Rules
    rules_result = await db.execute(
        select(StudyRule).where(StudyRule.study_id == data.study_id)
    )
    rules = rules_result.scalars().all()
    if rules:
        rules_text = "\n".join(f"- [{r.rule_type}] {r.title}" for r in rules)
        context_parts.append(f"Study rules/criteria:\n{rules_text}")
        context_labels.append("study_rules")

    # Document excerpts (truncated for context window)
    docs_result = await db.execute(
        select(StudyDocument).where(StudyDocument.study_id == data.study_id)
    )
    docs = docs_result.scalars().all()
    for doc in docs:
        if doc.extracted_text:
            excerpt = doc.extracted_text[:4000]
            context_parts.append(f"Document ({doc.document_type}) excerpt:\n{excerpt}")
            context_labels.append(f"document_{doc.document_type}")

    # Load ALL patients and their visits for this study
    all_patients_result = await db.execute(
        select(Patient).where(Patient.study_id == data.study_id)
    )
    all_patients = all_patients_result.scalars().all()
    if all_patients:
        patient_summaries = []
        for pat in all_patients:
            # Get visits for this patient
            pat_visits_result = await db.execute(
                select(PatientVisit, StudyVisit)
                .join(StudyVisit, StudyVisit.id == PatientVisit.study_visit_id)
                .where(PatientVisit.patient_id == pat.id)
                .order_by(StudyVisit.order_index)
            )
            pat_visits = pat_visits_result.all()

            visit_info = []
            for pv, sv in pat_visits:
                # Count tasks
                tasks_result = await db.execute(
                    select(PatientVisitTask).where(PatientVisitTask.patient_visit_id == pv.id)
                )
                tasks = tasks_result.scalars().all()
                done = sum(1 for t in tasks if t.status == "completed")
                total = len(tasks)
                visit_info.append(
                    f"  - {sv.visit_code or sv.visit_name} ({sv.visit_name}): status={pv.visit_status}, "
                    f"date={pv.visit_date}, procedures={done}/{total} completed"
                )

            # Find next visit (first study visit not yet created for this patient)
            created_visit_ids = {pv.study_visit_id for pv, _ in pat_visits}
            next_visit = None
            for v in visits:
                if v.id not in created_visit_ids:
                    next_visit = v
                    break

            summary = (
                f"Patient {pat.subject_code}: sex={pat.sex}, screening={pat.screening_status}, "
                f"enrollment={pat.enrollment_status}"
            )
            if visit_info:
                summary += "\n  Visits:\n" + "\n".join(visit_info)
            else:
                summary += "\n  No visits yet."
            if next_visit:
                summary += f"\n  Next visit due: {next_visit.visit_code or next_visit.visit_name} ({next_visit.visit_name})"

            patient_summaries.append(summary)

        context_parts.append("All patients in study:\n" + "\n".join(patient_summaries))
        context_labels.append("all_patients")

    # Specific patient context (if provided)
    if data.patient_id:
        screening_result = await db.execute(
            select(PatientScreening).where(PatientScreening.patient_id == data.patient_id)
        )
        screening = screening_result.scalars().all()
        if screening:
            screening_text = "\n".join(
                f"- [{s.criterion_type}] {s.criterion_name}: {s.status}" for s in screening
            )
            context_parts.append(f"Patient screening detail:\n{screening_text}")
            context_labels.append("patient_screening")

    # Visit context (if provided)
    if data.patient_visit_id:
        visit_result = await db.execute(
            select(PatientVisit).where(PatientVisit.id == data.patient_visit_id)
        )
        pv = visit_result.scalar_one_or_none()
        if pv:
            tasks_result = await db.execute(
                select(PatientVisitTask, StudyProcedure)
                .join(StudyProcedure, StudyProcedure.id == PatientVisitTask.study_procedure_id)
                .where(PatientVisitTask.patient_visit_id == data.patient_visit_id)
            )
            task_rows = tasks_result.all()
            tasks_text = "\n".join(
                f"- {proc.procedure_name}: {task.status} {'(CRITICAL)' if proc.is_critical else ''}"
                for task, proc in task_rows
            )
            context_parts.append(
                f"Current visit: {pv.visit_status}, Date: {pv.visit_date}\nTasks:\n{tasks_text}"
            )
            context_labels.append("visit_detail")

    # Active alerts
    alerts_result = await db.execute(
        select(Alert).where(Alert.study_id == data.study_id, Alert.status == "open")
    )
    open_alerts = alerts_result.scalars().all()
    if open_alerts:
        alerts_text = "\n".join(
            f"- [{a.severity.upper()}] {a.title}" for a in open_alerts
        )
        context_parts.append(f"Active alerts:\n{alerts_text}")
        context_labels.append("alerts")

    # Build context and call LLM
    context = "\n\n---\n\n".join(context_parts)
    history = [{"role": m.role, "content": m.content} for m in data.conversation_history]

    response_text = await asyncio.to_thread(
        llm_service.chat,
        data.message,
        context,
        history,
    )

    return ChatResponse(response=response_text, context_used=context_labels)
