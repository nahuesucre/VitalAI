from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient, PatientVisit, PatientVisitTask
from app.models.study import StudyVisit, StudyProcedure
from app.schemas.patient import PatientVisitCreate, PatientVisitResponse, PatientVisitUpdate, TaskResponse, TaskUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/patients/{patient_id}/visits", tags=["visits"])


@router.post("/", response_model=PatientVisitResponse, status_code=status.HTTP_201_CREATED)
async def create_visit(
    patient_id: UUID,
    data: PatientVisitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Sequential visit enforcement
    target_visit_result = await db.execute(
        select(StudyVisit).where(StudyVisit.id == data.study_visit_id)
    )
    target_study_visit = target_visit_result.scalar_one_or_none()
    if not target_study_visit:
        raise HTTPException(status_code=404, detail="Study visit not found")

    if target_study_visit.order_index > 1:
        prior_visits_result = await db.execute(
            select(StudyVisit).where(
                StudyVisit.study_id == target_study_visit.study_id,
                StudyVisit.order_index < target_study_visit.order_index,
            )
        )
        prior_study_visits = prior_visits_result.scalars().all()
        prior_visit_ids = [v.id for v in prior_study_visits]

        if prior_visit_ids:
            patient_visits_result = await db.execute(
                select(PatientVisit).where(
                    PatientVisit.patient_id == patient_id,
                    PatientVisit.study_visit_id.in_(prior_visit_ids),
                )
            )
            patient_visits = patient_visits_result.scalars().all()
            completed_ids = {pv.study_visit_id for pv in patient_visits if pv.visit_status == "completed"}

            for pv_id in prior_visit_ids:
                if pv_id not in completed_ids:
                    raise HTTPException(
                        status_code=400,
                        detail="Debe completar las visitas anteriores antes de crear esta visita."
                    )

    visit = PatientVisit(
        patient_id=patient_id,
        study_visit_id=data.study_visit_id,
        visit_date=data.visit_date,
        notes=data.notes,
        visit_status="planned",
        created_by=current_user.id,
    )
    db.add(visit)
    await db.flush()
    await db.refresh(visit)

    # Auto-create tasks from study procedures
    procs_result = await db.execute(
        select(StudyProcedure)
        .where(StudyProcedure.study_visit_id == data.study_visit_id)
        .order_by(StudyProcedure.order_index)
    )
    procedures = procs_result.scalars().all()

    for proc in procedures:
        task = PatientVisitTask(
            patient_visit_id=visit.id,
            study_procedure_id=proc.id,
            status="pending",
        )
        db.add(task)

    await db.flush()

    # Re-query with tasks loaded
    result = await db.execute(
        select(PatientVisit)
        .where(PatientVisit.id == visit.id)
        .options(selectinload(PatientVisit.tasks).selectinload(PatientVisitTask.study_procedure), selectinload(PatientVisit.study_visit))
    )
    visit = result.scalar_one()
    return _format_visit(visit)


@router.get("/", response_model=list[PatientVisitResponse])
async def list_visits(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PatientVisit)
        .where(PatientVisit.patient_id == patient_id)
        .options(selectinload(PatientVisit.tasks).selectinload(PatientVisitTask.study_procedure), selectinload(PatientVisit.study_visit))
        .order_by(PatientVisit.created_at)
    )
    visits = result.scalars().all()
    return [_format_visit(v) for v in visits]


@router.get("/{visit_id}", response_model=PatientVisitResponse)
async def get_visit(
    patient_id: UUID,
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PatientVisit)
        .where(PatientVisit.id == visit_id, PatientVisit.patient_id == patient_id)
        .options(selectinload(PatientVisit.tasks).selectinload(PatientVisitTask.study_procedure), selectinload(PatientVisit.study_visit))
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return _format_visit(visit)


@router.put("/{visit_id}", response_model=PatientVisitResponse)
async def update_visit(
    patient_id: UUID,
    visit_id: UUID,
    data: PatientVisitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PatientVisit)
        .where(PatientVisit.id == visit_id, PatientVisit.patient_id == patient_id)
        .options(selectinload(PatientVisit.tasks).selectinload(PatientVisitTask.study_procedure), selectinload(PatientVisit.study_visit))
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit.visit_status = data.visit_status
    if data.notes is not None:
        visit.notes = data.notes

    if data.visit_status == "completed":
        patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = patient_result.scalar_one()
        patient.enrollment_status = "enrolled"

    await db.flush()
    await db.refresh(visit)
    return _format_visit(visit)


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visit(
    patient_id: UUID,
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PatientVisit).where(PatientVisit.id == visit_id, PatientVisit.patient_id == patient_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    await db.delete(visit)


@router.put("/{visit_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    patient_id: UUID,
    visit_id: UUID,
    task_id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PatientVisitTask)
        .where(PatientVisitTask.id == task_id, PatientVisitTask.patient_visit_id == visit_id)
        .options(selectinload(PatientVisitTask.study_procedure))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = data.status
    if data.notes is not None:
        task.notes = data.notes
    if data.status == "completed":
        task.completed_by = current_user.id
        task.completed_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(task)
    return TaskResponse(
        id=task.id,
        patient_visit_id=task.patient_visit_id,
        study_procedure_id=task.study_procedure_id,
        procedure_name=task.study_procedure.procedure_name if task.study_procedure else None,
        is_required=task.study_procedure.is_required if task.study_procedure else None,
        is_critical=task.study_procedure.is_critical if task.study_procedure else None,
        status=task.status,
        notes=task.notes,
        completed_at=task.completed_at,
    )


def _format_visit(visit: PatientVisit) -> PatientVisitResponse:
    tasks = []
    for t in visit.tasks:
        tasks.append(TaskResponse(
            id=t.id,
            patient_visit_id=t.patient_visit_id,
            study_procedure_id=t.study_procedure_id,
            procedure_name=t.study_procedure.procedure_name if t.study_procedure else None,
            is_required=t.study_procedure.is_required if t.study_procedure else None,
            is_critical=t.study_procedure.is_critical if t.study_procedure else None,
            status=t.status,
            notes=t.notes,
            completed_at=t.completed_at,
        ))
    sv = visit.study_visit if hasattr(visit, "study_visit") and visit.study_visit else None
    return PatientVisitResponse(
        id=visit.id,
        patient_id=visit.patient_id,
        study_visit_id=visit.study_visit_id,
        visit_name=sv.visit_name if sv else None,
        visit_code=sv.visit_code if sv else None,
        visit_date=visit.visit_date,
        visit_status=visit.visit_status,
        notes=visit.notes,
        created_at=visit.created_at,
        tasks=tasks,
    )
