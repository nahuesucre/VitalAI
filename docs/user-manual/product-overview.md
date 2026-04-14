# Product Overview

## What is VitalAI?

VitalAI is a clinical operations platform powered by AI that transforms study documents — protocol, informed consent form (ICF), and investigator's brochure (IB) — into a live, guided, auditable operational workflow.

It is designed for **clinical trial sites**, specifically for **coordinators** and **physicians/investigators** who manage the day-to-day execution of clinical studies.

## The Problem

Clinical research involves complex protocols that can span hundreds of pages. Today, the operational execution of these protocols relies on:

- Manually reading and interpreting PDF protocols
- Paper or spreadsheet-based checklists
- Memory and experience to catch deviations
- No standardized metrics to measure operational quality

This leads to:

| Issue | Impact |
|-------|--------|
| Missed procedures | Data points are lost or invalidated |
| Screening errors | Ineligible patients enrolled, or eligible patients excluded |
| Out-of-window visits | Regulatory findings, data integrity issues |
| Late deviation detection | Found during audits, weeks or months later |
| Coordinator burnout | High cognitive load, repetitive manual work |
| No operational visibility | Sites don't know where their process fails |

## The Solution

VitalAI converts clinical study documents into a structured operational layer:

1. **Upload documents** (protocol, ICF, IB)
2. **AI extracts** visits, procedures, time windows, and screening criteria
3. **Human reviews and confirms** the extracted structure
4. **Patients are managed** with pseudonymized records
5. **Screening** uses dynamic checklists built from the actual protocol
6. **Visits** are guided with procedure checklists and automatic alerts
7. **Chat** answers protocol questions grounded in real data
8. **Metrics** show where the process breaks

## Key Principles

- **AI proposes, humans confirm** — The platform never makes clinical eligibility decisions. AI extracts, structures, alerts, and answers, but the human always decides.
- **Pseudonymization from day one** — No real patient identifiers are stored. Patients are identified by subject codes only.
- **Full auditability** — Every critical action is logged and traceable.
- **Reduce cognitive load** — The system should make the coordinator's job easier, not harder.
- **Modular AI layer** — Designed to swap between cloud API (Claude) and local LLM for on-premise deployments.

## Users

| Role | Description | Key Actions |
|------|-------------|-------------|
| **Admin** | Configures the system | Create studies, upload documents, manage users |
| **Coordinator** | Primary daily user | Create patients, run screening, manage visits, review alerts |
| **Physician** | Clinical oversight | Review screening, consult protocol, validate findings |

## What VitalAI is NOT

- It is **not a chatbot for PDFs** — It's a structured operations platform with AI assistance
- It does **not replace clinical judgment** — It never decides patient eligibility
- It does **not manage regulatory submissions** — That's a future roadmap item
- It is **not an EHR** — It focuses on study operations, not electronic health records
