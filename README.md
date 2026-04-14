# VitalAI

**Turning clinical trial protocols into guided, measurable operations — so no patient falls through the cracks.**

> Built at the Anthropic Hackathon — Buenos Aires, April 2026

---

## Why this matters

Every year, over 300,000 clinical trials run worldwide, testing treatments that could save millions of lives. Behind each trial, there are **coordinators, physicians, sponsors, and regulators** — all depending on the accurate, timely execution of complex protocols.

**Today, that execution relies on reading 200-page PDF protocols and tracking everything manually.**

This is not a minor inefficiency. It is a **systemic, multi-billion dollar problem** that impacts every stakeholder in clinical research.

### The human cost

- A coordinator misreads a protocol time window and a **patient visit happens out of range** — the data point is invalidated and the patient may need to repeat the visit.
- A screening criterion is overlooked and an **ineligible patient is enrolled** — putting their safety at risk and compromising the study's integrity.
- A critical lab test is forgotten during a visit and **nobody notices until the next monitoring visit**, weeks later — triggering a protocol deviation finding.
- A site has **no visibility into its own operational gaps** — problems are discovered only during audits, when the damage is already done.

### The financial cost

The numbers behind this problem are staggering:

- Clinical trials cost between **USD $1.4M–$6.6M (Phase I)** and **USD $11.5M–$52.9M (Phase III)**, with median per-patient costs of **USD $41,117** and significantly higher in complex therapeutic areas like oncology.
- A single protocol amendment in a Phase III trial costs a median of **USD $535,000 in direct expenses** and adds approximately **3 months** of delays. For Phase II, the median cost is **USD $141,000**. 57% of all protocols have at least one substantial amendment — and nearly half of those are deemed **avoidable** (Tufts CSDD).
- **30–40% of trial failures** are attributed to problems within the protocol design and operational execution — many of which are preventable with better tooling at the site level.
- Simplified protocols and reduced amendments alone could cut overall development costs by **22.2%**, according to U.S. Department of Health and Human Services research.

### Who pays the price

| Stakeholder | Impact |
|-------------|--------|
| **Coordinators** | Cognitive overload, burnout, manual tracking of hundreds of procedures across dozens of patients |
| **Physicians / Investigators** | Time wasted searching protocols for answers, risk of making decisions based on incomplete information |
| **Sponsors (Pharma/Biotech)** | Delayed timelines, increased costs, data quality issues that threaten regulatory submissions |
| **CROs (Contract Research Orgs)** | Underperforming sites drain monitoring resources, site management becomes reactive instead of proactive |
| **Regulators** | Protocol deviations, incomplete audit trails, findings that delay drug approvals |
| **Patients** | The most vulnerable stakeholder — exposed to safety risks, unnecessary visits, and delays in access to potentially life-saving treatments |

### Why the market is wide open

The global clinical trial management systems (CTMS) market is valued at **$2.3 billion in 2025** and projected to reach **$7.3 billion by 2035** (CAGR ~12–15%). Yet existing solutions focus primarily on trial-level management for sponsors and CROs — **not on the day-to-day operational execution at the site level**.

There is no widely adopted tool that takes a clinical protocol and converts it into a live, guided, auditable operational workflow for the people who actually run the trial: coordinators and investigators.

This is not a generic management system. It is a **category-defining opportunity** in a space with high regulatory pressure, massive budgets, growing protocol complexity, and almost zero operational tooling at the point of care.

---

## What VitalAI does

VitalAI closes this gap. It takes the study documents — protocol, informed consent form (ICF), and investigator's brochure (IB) — and **converts them into a live operational layer** that guides the team through every step.

It is **not a chatbot for PDFs**. It is a clinical operations platform where AI acts as an **operational copilot**: it reads the protocol, structures the workflow, tracks execution, detects problems, and answers questions — but **the human always decides**.

| | |
|---|---|
| **Protocol to Structure** | Upload a protocol PDF. AI extracts visits, procedures, time windows, and screening criteria — ready to review and confirm. |
| **Guided Screening** | Each patient gets a dynamic checklist built from the actual inclusion/exclusion criteria in the protocol. No more guessing. |
| **Visit Checklists** | Every visit shows exactly what needs to happen. The team marks tasks as done, and the system flags what's missing. |
| **Automatic Alerts** | Incomplete screening, missed critical procedures, out-of-window visits — the system catches it before the monitor does. |
| **AI Copilot** | Ask "What's missing to close this visit?" or "What does the protocol say about Visit 4?" — grounded in real data, not hallucinations. |
| **Operational Metrics** | For the first time, sites can see where they fail most: which procedures get missed, which visits have gaps, which alerts repeat. |

### How it works — the principles

- **AI proposes, humans confirm** — the platform never makes clinical eligibility decisions
- **Pseudonymization from day one** — no real patient identifiers, ever
- **Full auditability** — every critical action is logged and traceable
- **Reduce cognitive load** — the system should make the coordinator's job easier, not harder
- **Modular AI layer** — designed to swap between cloud API and local LLM for on-premise deployments

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
- Federico Alscher
- Ignacio Samoacachan

---

## License

MIT
