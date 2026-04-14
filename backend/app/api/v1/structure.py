from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.study import StudyVisit, StudyProcedure, StudyRule
from app.schemas.study import (
    VisitResponse, VisitUpdate,
    ProcedureResponse, ProcedureUpdate,
    RuleResponse, RuleUpdate,
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/studies/{study_id}/structure", tags=["structure"])


# --- Visits ---

@router.get("/visits", response_model=list[VisitResponse])
async def list_visits(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyVisit)
        .where(StudyVisit.study_id == study_id)
        .options(selectinload(StudyVisit.procedures))
        .order_by(StudyVisit.order_index)
    )
    return result.scalars().all()


@router.put("/visits/{visit_id}", response_model=VisitResponse)
async def update_visit(
    study_id: UUID,
    visit_id: UUID,
    data: VisitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyVisit)
        .where(StudyVisit.id == visit_id, StudyVisit.study_id == study_id)
        .options(selectinload(StudyVisit.procedures))
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(visit, field, value)
    await db.flush()
    await db.refresh(visit)
    return visit


@router.delete("/visits/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visit(
    study_id: UUID,
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyVisit).where(StudyVisit.id == visit_id, StudyVisit.study_id == study_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    await db.delete(visit)


# --- Procedures ---

@router.get("/visits/{visit_id}/procedures", response_model=list[ProcedureResponse])
async def list_procedures(
    study_id: UUID,
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyProcedure)
        .where(StudyProcedure.study_visit_id == visit_id)
        .order_by(StudyProcedure.order_index)
    )
    return result.scalars().all()


@router.put("/procedures/{procedure_id}", response_model=ProcedureResponse)
async def update_procedure(
    study_id: UUID,
    procedure_id: UUID,
    data: ProcedureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyProcedure).where(StudyProcedure.id == procedure_id)
    )
    proc = result.scalar_one_or_none()
    if not proc:
        raise HTTPException(status_code=404, detail="Procedure not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(proc, field, value)
    await db.flush()
    await db.refresh(proc)
    return proc


# --- Rules ---

@router.get("/rules", response_model=list[RuleResponse])
async def list_rules(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyRule)
        .where(StudyRule.study_id == study_id)
        .order_by(StudyRule.rule_type, StudyRule.title)
    )
    return result.scalars().all()


@router.put("/rules/{rule_id}", response_model=RuleResponse)
async def update_rule(
    study_id: UUID,
    rule_id: UUID,
    data: RuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyRule).where(StudyRule.id == rule_id, StudyRule.study_id == study_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    await db.flush()
    await db.refresh(rule)
    return rule


# --- Confirm All ---

@router.post("/confirm", status_code=status.HTTP_200_OK)
async def confirm_structure(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        update(StudyVisit).where(StudyVisit.study_id == study_id).values(is_confirmed=True)
    )
    await db.execute(
        update(StudyRule).where(StudyRule.study_id == study_id).values(is_confirmed=True)
    )
    return {"message": "Structure confirmed successfully"}
