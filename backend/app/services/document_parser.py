"""Document parsing pipeline: PDF → text → section search → Claude → DB"""
import os
import re
import asyncio
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


def extract_sections(full_text: str) -> dict[str, str]:
    """Search for key protocol sections by title patterns and extract chunks."""
    sections = {}
    text_lower = full_text.lower()

    # Define section patterns to search for (keyword -> chars to grab after match)
    patterns = [
        # Visit schedule / procedures
        ("schedule_of_assessments", [
            r"schedule\s+of\s+assess", r"schedule\s+of\s+events",
            r"schedule\s+of\s+procedures", r"study\s+schedule",
            r"visit\s+schedule", r"table\s+of\s+visits",
            r"cronograma\s+de\s+visitas", r"calendario\s+de\s+visitas",
        ]),
        # Inclusion criteria
        ("inclusion_criteria", [
            r"inclusion\s+criteria", r"eligibility\s+criteria",
            r"criterios?\s+de\s+inclusi[oó]n", r"criterios?\s+de\s+elegibilidad",
        ]),
        # Exclusion criteria
        ("exclusion_criteria", [
            r"exclusion\s+criteria", r"criterios?\s+de\s+exclusi[oó]n",
        ]),
        # Study procedures / visits detail
        ("study_procedures", [
            r"study\s+procedures", r"description\s+of\s+study\s+visits",
            r"visit\s+procedures", r"study\s+visits",
            r"procedimientos\s+del\s+estudio", r"descripci[oó]n\s+de\s+visitas",
        ]),
        # Screening
        ("screening", [
            r"screening\s+visit", r"screening\s+period",
            r"visita\s+de\s+selecci[oó]n", r"per[ií]odo\s+de\s+screening",
        ]),
        # Study design
        ("study_design", [
            r"study\s+design", r"dise[nñ]o\s+del\s+estudio",
            r"overall\s+design", r"study\s+overview",
        ]),
    ]

    for section_name, regexes in patterns:
        for regex in regexes:
            match = re.search(regex, text_lower)
            if match:
                # Grab from 200 chars before the match to 8000 chars after
                start = max(0, match.start() - 200)
                end = min(len(full_text), match.start() + 8000)
                sections[section_name] = full_text[start:end]
                break

    return sections


def build_focused_prompt(sections: dict[str, str], full_text: str) -> str:
    """Build a focused text for Claude from extracted sections."""
    parts = []

    if sections:
        for name, content in sections.items():
            header = name.replace("_", " ").upper()
            parts.append(f"=== {header} ===\n{content}")
        focused = "\n\n".join(parts)
    else:
        # Fallback: use first 50K chars if no sections found
        focused = full_text[:50000]

    # Cap at 80K to be safe with tokens
    if len(focused) > 80000:
        focused = focused[:80000]

    return focused


async def parse_document(doc_id: UUID, db: AsyncSession) -> dict:
    """Full parsing pipeline for a study document."""
    result = await db.execute(select(StudyDocument).where(StudyDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise ValueError(f"Document {doc_id} not found")

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

        # Save full extracted text
        doc.extracted_text = text

        # Parse with AI based on document type (run in thread to not block event loop)
        if doc.document_type == "protocol":
            sections = extract_sections(text)
            focused_text = build_focused_prompt(sections, text)
            parsed = await asyncio.to_thread(llm_service.parse_protocol, focused_text)
            await _save_protocol_extraction(parsed, doc.study_id, doc.id, db)
        elif doc.document_type == "icf":
            parsing_text = text[:50000]
            parsed = await asyncio.to_thread(llm_service.parse_icf, parsing_text)
        elif doc.document_type == "ib":
            parsing_text = text[:50000]
            parsed = await asyncio.to_thread(llm_service.parse_ib, parsing_text)
        else:
            sections = extract_sections(text)
            focused_text = build_focused_prompt(sections, text)
            parsed = await asyncio.to_thread(llm_service.parse_protocol, focused_text)
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
            if isinstance(proc_data, str):
                proc_name = proc_data
                proc_desc = None
                proc_required = True
                proc_critical = False
            else:
                proc_name = proc_data.get("procedure_name", str(proc_data))
                proc_desc = proc_data.get("description")
                proc_required = proc_data.get("is_required", True)
                proc_critical = proc_data.get("is_critical", False)
            proc = StudyProcedure(
                study_visit_id=visit.id,
                procedure_name=proc_name,
                description=proc_desc,
                is_required=proc_required,
                is_critical=proc_critical,
                order_index=i,
            )
            db.add(proc)

    # Save screening criteria as rules
    screening = parsed.get("screening_criteria", {})
    for criterion in screening.get("inclusion", []):
        if isinstance(criterion, str):
            title = criterion
            desc = None
            excerpt = None
        else:
            title = criterion.get("title", str(criterion))
            desc = criterion.get("description")
            excerpt = criterion.get("source_excerpt")
        rule = StudyRule(
            study_id=study_id,
            rule_type="inclusion",
            title=title,
            description=desc,
            source_document_id=doc_id,
            source_excerpt=excerpt,
            is_confirmed=False,
        )
        db.add(rule)

    for criterion in screening.get("exclusion", []):
        if isinstance(criterion, str):
            title = criterion
            desc = None
            excerpt = None
        else:
            title = criterion.get("title", str(criterion))
            desc = criterion.get("description")
            excerpt = criterion.get("source_excerpt")
        rule = StudyRule(
            study_id=study_id,
            rule_type="exclusion",
            title=title,
            description=desc,
            source_document_id=doc_id,
            source_excerpt=excerpt,
            is_confirmed=False,
        )
        db.add(rule)

    await db.flush()
