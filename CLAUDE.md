# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: TrialFlow AI

A web platform for clinical study operations, targeting coordinators and physicians. It transforms study documents (protocol, ICF, IB — all PDFs) into an actionable operational layer: structured visits, dynamic checklists, patient screening, deviation detection, contextual chat, and operational metrics.

**This is not a "chat with PDFs" tool. It is a clinical operations platform assisted by AI.**

The AI proposes, structures, alerts, and answers questions — but never makes final clinical decisions. All critical actions require human confirmation.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + React + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python |
| ORM | SQLAlchemy or SQLModel + Alembic |
| Database | Supabase (PostgreSQL) for MVP |
| Semantic search | pgvector |
| Auth | JWT or session cookie, bcrypt/argon2 password hashing |
| AI layer | Decoupled `LLMService` abstraction (swap external API → local LLM later) |

---

## Development Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload         # dev server
alembic upgrade head                  # run DB migrations
alembic revision --autogenerate -m "description"  # new migration

# Frontend
cd frontend
npm install
npm run dev       # dev server (http://localhost:3000)
npm run build     # production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

---

## Architecture

The system has a hard separation between **study definition** and **patient execution**:

- **Study definition**: what the protocol says should happen (visits, procedures, rules) — extracted from documents by AI and confirmed by users.
- **Patient execution**: what actually happened for each patient (screening, visit tasks, observations, alerts).

### Backend layout (`backend/`)
```
app/
  main.py              # FastAPI app entry point
  core/                # config, security, dependencies
  api/v1/              # route handlers grouped by domain
  models/              # SQLAlchemy ORM models
  schemas/             # Pydantic request/response schemas
  services/            # business logic (including ai_service.py)
  db/                  # database session, base
  alembic/             # migrations
```

### Frontend layout (`frontend/`)
```
src/
  app/                 # Next.js App Router pages
  components/          # reusable UI components
  hooks/               # custom React hooks
  lib/                 # API client, utilities
  types/               # TypeScript interfaces
```

### AI Service
The `LLMService` abstraction in `services/ai_service.py` is the only place that calls the LLM API. All document parsing, structured extraction, and chat go through this service. This enables swapping Claude API for a local model without touching application code.

---

## Key Data Models

| Model | Purpose |
|---|---|
| `Study` | Clinical study definition |
| `StudyDocument` | Uploaded protocol/ICF/IB files |
| `StudyVisit` | Visit definitions extracted from protocol |
| `StudyProcedure` | Procedures per visit (required/critical flags) |
| `StudyRule` | Screening/eligibility criteria extracted from documents |
| `Patient` | Pseudonymized patient (no real identifiers) |
| `PatientScreening` | Screening criterion status per patient |
| `PatientVisit` | Actual visit record for a patient |
| `PatientVisitTask` | Task status: pending/completed/not_applicable/missing |
| `Alert` | System-generated alerts (deviation, missing step, out-of-window) |
| `AuditLog` | Append-only log of all important actions |

---

## MVP Build Order

Work through this flow in order — build it complete before adding polish:

1. Login + roles (admin, coordinator, physician)
2. Study creation + document upload
3. Document parsing (AI extracts visits, procedures, rules)
4. Structure review/edit UI (user confirms AI extraction)
5. Patient creation (pseudonymized)
6. Screening checklist
7. Visit + dynamic checklist
8. Alert detection
9. Metrics dashboard
10. Contextual chat

---

## Core Design Principles

- **AI proposes, human confirms.** No critical action activates automatically.
- **AI must not invent rules.** Always ground responses in documents or structured DB data.
- **Pseudonymize from day 1.** No real patient identifiers anywhere.
- **Decoupled AI layer.** `LLMService` is the only coupling point to the LLM provider.
- **Operational flow first.** Build the full thin slice before adding sophistication.
- **Modular for future migration.** Code must tolerate switching from Supabase to self-hosted PostgreSQL.
- **Frequent commits.** Commit after each meaningful working milestone.

---

## Context: Anthropic Buenos Aires Hackathon (April 14, 2026)

~5 hours total to build a demoable MVP. Prioritize:
- A complete, working happy path over feature breadth
- Incremental demo checkpoints (each phase should be showable)
- Simplicity over optimization
- Fast visible progress

If a feature risks blocking progress, simplify it without breaking the main flow.
