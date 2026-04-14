# VitalAI (TrialFlow AI)

**Transforming clinical trial documents into safe, guided, and measurable operations.**

> Built at the Anthropic Hackathon — Buenos Aires, April 2026

---

## The Problem

Clinical research is one of the most critical processes in healthcare — yet its daily operations remain alarmingly manual.

Coordinators and investigators spend their days navigating **hundreds of pages of protocol PDFs**, manually interpreting complex rules, tracking visits on spreadsheets and paper checklists, and relying on memory and experience to catch deviations before they escalate.

The consequences are real:

- **Protocol deviations go undetected** until audits reveal them — sometimes too late.
- **Screening errors** lead to patients being enrolled incorrectly or unnecessarily excluded.
- **Visit procedures are missed** because no system actively tracks what was expected vs. what was done.
- **Cognitive overload** on coordinators leads to burnout and human error in high-stakes environments.
- **Zero operational metrics** — sites have no visibility into where their process fails most.

In an industry where a single missed step can compromise patient safety, data integrity, or regulatory compliance, **the operational layer of clinical trials is still stuck in the PDF era.**

There is no widely adopted tool that converts clinical study documents into a live, guided, auditable operational workflow. This gap is where VitalAI operates.

---

## The Solution

VitalAI is a **clinical operations platform powered by AI** that transforms study documents — protocol, informed consent form (ICF), and investigator's brochure (IB) — into an actionable operational layer.

It is **not** a chatbot for PDFs. It is a structured operations platform where AI acts as an **operational copilot**: it extracts, proposes, alerts, and answers — but the human always confirms.

### What it does

| Capability | Description |
|---|---|
| **Document Parsing** | AI reads the full protocol, extracts visits, procedures, time windows, and screening criteria using smart section detection |
| **Guided Screening** | Dynamic checklists with inclusion/exclusion criteria directly from the protocol |
| **Visit Execution** | Each visit shows expected procedures, tracks completion, flags missing items |
| **Deviation Detection** | Automatic alerts for incomplete screening, missed critical procedures, out-of-window visits |
| **Contextual Chat** | Ask questions about the protocol, a specific patient, or a visit — grounded in real data |
| **Operational Metrics** | Dashboard with alerts by type, screening status, visit completion, frequent gaps |

### Key Principles

- **AI proposes, humans confirm** — the platform never makes clinical eligibility decisions
- **Patient pseudonymization** from day one — no real identifiable data
- **Full auditability** — every critical action is logged
- **Reduce cognitive load**, don't add to it
- **Modular AI layer** — designed to swap between cloud API and local LLM

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Next.js +       │────▶│  FastAPI +       │────▶│  PostgreSQL  │
│  React + TS      │◀────│  Python          │◀────│              │
│  Tailwind        │     │                  │     └──────────────┘
│                  │     │  Claude API      │
└─────────────────┘     │  (LLMService)    │     ┌──────────────┐
                        │                  │────▶│  File Storage │
                        └─────────────────┘     └──────────────┘
```

- **Frontend:** Next.js + React + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python (all endpoints async)
- **Database:** PostgreSQL (local or Supabase)
- **AI:** Claude Sonnet via decoupled `LLMService` abstraction
- **Auth:** JWT + bcrypt with role management (admin, coordinator, physician)

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- Anthropic API Key

### Installation

```bash
git clone https://github.com/nahuesucre/VitalAI.git
cd VitalAI
cp .env.example .env
# Edit .env with your credentials
```

#### Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE trialflow;"
```

#### Backend

```bash
cd backend
pip install -r requirements.txt

# Server creates tables and seeds demo users on startup
uvicorn app.main:app --reload --port 8000
```

Demo users (auto-created):
| Email | Password | Role |
|-------|----------|------|
| admin@trialflow.ai | password123 | Admin |
| coordinator@trialflow.ai | password123 | Coordinator |
| doctor@trialflow.ai | password123 | Physician |

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Demo Flow

1. **Login** as coordinator
2. **Create a study** (e.g., RELIEHF)
3. **Upload protocol PDF** (82 pages)
4. **AI extracts** visits, procedures, and screening criteria using smart section detection
5. **Review the extracted structure** — visits timeline, procedures per visit, inclusion/exclusion criteria
6. **Confirm the structure**
7. **Create a pseudonymized patient** (e.g., SUBJ-0001)
8. **Run screening** — checklist auto-populated from protocol criteria
9. **Open a visit** — guided checklist with all expected procedures
10. **See alerts** for missing critical procedures
11. **Ask the AI copilot** "What is missing to close this visit?"
12. **View metrics** dashboard

---

## Project Structure

```
VitalAI/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI entry + auto-migration + seed
│       ├── core/                # config, security (JWT+bcrypt), deps
│       ├── api/v1/              # All REST endpoints
│       ├── models/              # SQLAlchemy ORM models (14 tables)
│       ├── schemas/             # Pydantic request/response schemas
│       ├── services/
│       │   ├── ai_service.py    # LLMService — only connection to Claude
│       │   ├── document_parser.py # Smart section extraction + parsing pipeline
│       │   └── alert_engine.py  # Rule-based deviation detection
│       └── db/                  # Session, base, seed
├── frontend/
│   └── src/
│       ├── app/                 # Next.js App Router pages
│       ├── components/          # Layout, UI components
│       ├── lib/                 # API client, auth helpers
│       └── types/               # TypeScript interfaces
├── supabase/
│   ├── schema.sql               # Full DDL (14 tables)
│   └── seed.sql                 # Initial roles
├── docker-compose.yml           # PostgreSQL + dev setup
└── .env.example
```

---

## MVP Scope

### Included
- Study creation and document management
- AI-powered document parsing with smart section detection
- Patient management with pseudonymization
- Screening with dynamic checklists (inclusion/exclusion)
- Visit execution with guided procedures
- Alert system for deviations and missing items
- Contextual AI chat (grounded in documents + operational data)
- Operational metrics dashboard
- Role-based access (admin, coordinator, physician)
- Basic audit logging

### Future Roadmap
- Randomization
- Patient portal
- WhatsApp integration
- EHR/laboratory integrations
- Document version comparison
- Ethics committee portal
- On-premise deployment with local LLM

---

## Team

- Nahuel Martinez de Sucre
- Federico
- [Team member 3]

---

## License

MIT
