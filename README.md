# VitalAI

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
│  React + TS      │◀────│  Python          │◀────│  (Docker)    │
│  Tailwind        │     │                  │     └──────────────┘
│                  │     │  Claude API      │
└─────────────────┘     │  (LLMService)    │     ┌──────────────┐
                        │                  │────▶│  File Storage │
                        └─────────────────┘     └──────────────┘
```

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **Backend:** FastAPI + Python (fully async)
- **Database:** PostgreSQL 16 (Docker)
- **AI:** Claude Sonnet 4 via decoupled `LLMService` abstraction
- **Auth:** JWT + bcrypt with role management (admin, coordinator, physician)

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Python 3.10+
- Node.js 18+
- Anthropic API Key

### 1. Clone and configure environment

```bash
git clone https://github.com/nahuesucre/VitalAI.git
cd VitalAI
```

Copy the root `.env` (used by Docker Compose):

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
POSTGRES_PASSWORD=your-password
JWT_SECRET=your-jwt-secret
```

Create the **backend** `.env` (read by FastAPI):

```bash
cat > backend/.env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
DATABASE_URL=postgresql+asyncpg://vitalai:your-password@localhost:5433/vitalai
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=480
BACKEND_CORS_ORIGINS=http://localhost:3000
EOF
```

Create the **frontend** `.env.local` (read by Next.js):

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > frontend/.env.local
```

> **Important:** The root `.env` configures Docker. The `backend/.env` configures FastAPI. The `frontend/.env.local` configures Next.js. All three are needed.

### 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port **5433** (to avoid conflicts with local PostgreSQL installations).

Verify it's running:

```bash
docker ps
# Should show vitalai_db with status "Up ... (healthy)"
```

### 3. Start the backend

```bash
cd backend

# Create virtual environment (Python 3.10+ required)
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

On first startup, the backend automatically:
- Creates all database tables
- Seeds demo users (see below)

API docs available at `http://localhost:8000/docs`

### 4. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| admin@trialflow.ai | password123 | Admin |
| coordinator@trialflow.ai | password123 | Coordinator |
| doctor@trialflow.ai | password123 | Physician |

---

## Demo Flow

1. **Login** as coordinator
2. **Create a study** (e.g., RELIEHF)
3. **Upload protocol PDF**
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
│       ├── api/v1/              # REST endpoints (auth, studies, patients, visits, chat...)
│       ├── models/              # SQLAlchemy ORM models (14 tables)
│       ├── schemas/             # Pydantic request/response schemas
│       ├── services/
│       │   ├── ai_service.py    # LLMService — Claude API abstraction
│       │   ├── document_parser.py # Smart section extraction + parsing pipeline
│       │   └── alert_engine.py  # Rule-based deviation detection
│       └── db/                  # Session, base, seed
├── frontend/
│   └── src/
│       ├── app/                 # Next.js App Router pages
│       ├── components/          # Layout, UI components
│       ├── lib/                 # API client, auth helpers
│       └── types/               # TypeScript interfaces
├── docker-compose.yml           # PostgreSQL container
├── docs/                        # Product documentation
└── .env.example                 # Environment variables template
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` — Login with email/password
- `POST /api/v1/auth/register` — Register new user
- `GET /api/v1/auth/me` — Current user profile

### Studies
- `POST /api/v1/studies/` — Create study
- `GET /api/v1/studies/` — List studies
- `GET /api/v1/studies/{id}` — Study details
- `POST /api/v1/studies/{id}/documents` — Upload document (protocol/ICF/IB)
- `POST /api/v1/studies/{id}/documents/{doc_id}/parse` — Trigger AI parsing

### Study Structure
- `GET /api/v1/studies/{id}/structure/visits` — Extracted visits & procedures
- `GET /api/v1/studies/{id}/structure/rules` — Inclusion/exclusion criteria
- `POST /api/v1/studies/{id}/structure/confirm` — Confirm structure

### Patients
- `POST /api/v1/studies/{id}/patients/` — Create patient
- `GET /api/v1/studies/{id}/patients/` — List patients

### Screening & Visits
- `GET /api/v1/patients/{id}/screening/` — Screening criteria status
- `PUT /api/v1/patients/{id}/screening/{item_id}` — Update criterion
- `POST /api/v1/patients/{id}/visits/` — Create visit
- `PUT /api/v1/patients/{id}/visits/{id}/tasks/{id}` — Update task status

### Alerts & Metrics
- `GET /api/v1/studies/{id}/alerts/` — List alerts
- `GET /api/v1/studies/{id}/metrics/overview` — Dashboard metrics

### Chat
- `POST /api/v1/chat/` — AI copilot (context-aware)

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
