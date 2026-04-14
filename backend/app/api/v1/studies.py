from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.study import Study, StudyDocument
from app.schemas.study import StudyCreate, StudyUpdate, StudyResponse, DocumentResponse
from app.core.deps import get_current_user
import os

router = APIRouter(prefix="/studies", tags=["studies"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")


@router.post("/", response_model=StudyResponse, status_code=status.HTTP_201_CREATED)
async def create_study(
    data: StudyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    study = Study(
        name=data.name,
        sponsor=data.sponsor,
        phase=data.phase,
        study_type=data.study_type,
        description=data.description,
        created_by=current_user.id,
    )
    db.add(study)
    await db.flush()
    await db.refresh(study)
    return study


@router.get("/", response_model=list[StudyResponse])
async def list_studies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Study).order_by(Study.created_at.desc()))
    return result.scalars().all()


@router.get("/{study_id}", response_model=StudyResponse)
async def get_study(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Study).where(Study.id == study_id))
    study = result.scalar_one_or_none()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study


@router.put("/{study_id}", response_model=StudyResponse)
async def update_study(
    study_id: UUID,
    data: StudyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Study).where(Study.id == study_id))
    study = result.scalar_one_or_none()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(study, field, value)
    await db.flush()
    await db.refresh(study)
    return study


@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Study).where(Study.id == study_id))
    study = result.scalar_one_or_none()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    await db.delete(study)


# --- Documents ---

@router.post("/{study_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    study_id: UUID,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    title: str = Form(None),
    version: str = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify study exists
    result = await db.execute(select(Study).where(Study.id == study_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Study not found")

    # Save file locally (sanitize filename to prevent path traversal)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = os.path.basename(file.filename or "document")
    file_path = os.path.join(UPLOAD_DIR, f"{study_id}_{safe_name}")
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    doc = StudyDocument(
        study_id=study_id,
        document_type=document_type,
        title=title or file.filename,
        version=version,
        file_path=file_path,
        uploaded_by=current_user.id,
        processing_status="pending",
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


@router.get("/{study_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StudyDocument)
        .where(StudyDocument.study_id == study_id)
        .order_by(StudyDocument.created_at.desc())
    )
    return result.scalars().all()
