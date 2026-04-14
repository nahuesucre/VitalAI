"""Document parsing pipeline: PDF → text → Claude → DB"""
import os
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.study import StudyDocument, StudyVisit, StudyProcedure, StudyRule
from app.services.ai_service import llm_service


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except Exception:
        # Fallback to PyPDF2
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n\n".join(text_parts)


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file using zipfile + XML parsing."""
    import zipfile
    import xml.etree.ElementTree as ET

    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    with zipfile.ZipFile(file_path, "r") as z:
        with z.open("word/document.xml") as f:
            tree = ET.parse(f)
    root = tree.getroot()
    paragraphs = []
    for para in root.iter(f"{ns}p"):
        texts = []
        for t in para.iter(f"{ns}t"):
            if t.text:
                texts.append(t.text)
        if texts:
            paragraphs.append("".join(texts))
    return "\n".join(paragraphs)


async def parse_document(doc_id: UUID, db: AsyncSession) -> dict:
    """Full parsing pipeline for a study document."""
    # Get document
    result = await db.execute(select(StudyDocument).where(StudyDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise ValueError(f"Document {doc_id} not found")

    # Update status
    doc.processing_status = "processing"
    await db.flush()

    try:
        # Extract text
        file_path = doc.file_path
        if file_path.lower().endswith(".pdf"):
            text = extract_text_from_pdf(file_path)
        elif file_path.lower().endswith(".docx"):
            text = extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path}")

        # Save extracted text
        doc.extracted_text = text

        # Parse with AI based on document type
        if doc.document_type == "protocol":
            parsed = llm_service.parse_protocol(text)
            await _save_protocol_extraction(parsed, doc.study_id, doc.id, db)
        elif doc.document_type == "icf":
            parsed = llm_service.parse_icf(text)
        elif doc.document_type == "ib":
            parsed = llm_service.parse_ib(text)
        else:
            parsed = llm_service.parse_protocol(text)
            await _save_protocol_extraction(parsed, doc.study_id, doc.id, db)

        doc.processing_status = "completed"
        await db.flush()
        return parsed

    except Exception as e:
        doc.processing_status = "failed"
        await db.flush()
        raise e


async def _save_protocol_extraction(parsed: dict, study_id: UUID, doc_id: UUID, db: AsyncSession):
    """Save AI-extracted protocol data to DB."""
    # Save visits and procedures
    for visit_data in parsed.get("visits", []):
        visit = StudyVisit(
            study_id=study_id,
            visit_code=visit_data.get("visit_code"),
            visit_name=visit_data.get("visit_name", "Unknown Visit"),
            order_index=visit_data.get("order_index", 0),
            day_nominal=visit_data.get("day_nominal"),
            window_min_days=visit_data.get("window_min_days"),
            window_max_days=visit_data.get("window_max_days"),
            description=visit_data.get("description"),
            is_confirmed=False,
        )
        db.add(visit)
        await db.flush()
        await db.refresh(visit)

        for i, proc_data in enumerate(visit_data.get("procedures", [])):
            proc = StudyProcedure(
                study_visit_id=visit.id,
                procedure_name=proc_data.get("procedure_name", "Unknown Procedure"),
                description=proc_data.get("description"),
                is_required=proc_data.get("is_required", True),
                is_critical=proc_data.get("is_critical", False),
                order_index=i,
            )
            db.add(proc)

    # Save screening criteria as rules
    screening = parsed.get("screening_criteria", {})
    for criterion in screening.get("inclusion", []):
        rule = StudyRule(
            study_id=study_id,
            rule_type="inclusion",
            title=criterion.get("title", ""),
            description=criterion.get("description"),
            source_document_id=doc_id,
            source_excerpt=criterion.get("source_excerpt"),
            is_confirmed=False,
        )
        db.add(rule)

    for criterion in screening.get("exclusion", []):
        rule = StudyRule(
            study_id=study_id,
            rule_type="exclusion",
            title=criterion.get("title", ""),
            description=criterion.get("description"),
            source_document_id=doc_id,
            source_excerpt=criterion.get("source_excerpt"),
            is_confirmed=False,
        )
        db.add(rule)

    await db.flush()
