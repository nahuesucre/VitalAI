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
| **Document Parsing** | AI extracts visits, procedures, time windows, and screening criteria from uploaded study documents |
| **Guided Screening** | Dynamic checklists help coordinators evaluate patient eligibility step by step |
| **Visit Execution** | Each visit shows exactly what procedures are expected, tracks completion, and flags missing items |
| **Deviation Detection** | Automatic alerts for incomplete screening, missed procedures, out-of-window visits, and critical omissions |
| **Contextual Chat** | Ask questions about the protocol, a specific patient, or a visit — with full operational context |
| **Operational Metrics** | Dashboard showing alerts by type, open visits, screening status, and most frequent gaps |

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
│                  │     │                  │     │              │
│   Next.js +      │────▶│   FastAPI +      │────▶│  PostgreSQL  │
│   React + TS     │◀────│   Python         │◀────│              │
│   Tailwind       │     │                  │     └──────────────┘
│                  │     │   Claude API     │
└─────────────────┘     │   (AI Layer)     │     ┌──────────────┐
                        │                  │────▶│  File Storage │
                        └─────────────────┘     └──────────────┘
```

- **Frontend:** Next.js + React + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python
- **Database:** PostgreSQL
- **AI:** Claude API (Anthropic) — decoupled service layer
- **Auth:** JWT-based with role management (admin, coordinator, physician)

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- PostgreSQL 15+
- Anthropic API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/nahuesucre/VitalAI.git
cd VitalAI

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Demo Flow

1. **Create a study** with basic metadata
2. **Upload documents** (protocol, ICF, IB)
3. **AI extracts** visits, procedures, time windows, and screening criteria
4. **Review and edit** the extracted operational structure
5. **Create a pseudonymized patient**
6. **Run assisted screening** with dynamic checklist
7. **Open a visit** and follow the guided checklist
8. **Receive alerts** for missing items or potential deviations
9. **Ask the chat** about the protocol, the patient, or the visit
10. **View metrics** on the operational dashboard

---

## MVP Scope

### Included
- Study creation and document management
- AI-powered document parsing and structure extraction
- Patient management with pseudonymization
- Screening with dynamic checklists
- Visit execution with guided procedures
- Alert system for deviations and missing items
- Contextual AI chat
- Operational metrics dashboard
- Role-based access (admin, coordinator, physician)
- Basic audit logging

### Not Included (Future Roadmap)
- Randomization
- Patient portal
- WhatsApp integration
- EHR/laboratory integrations
- Advanced electronic signatures
- Document version comparison
- Full regulatory management module
- Ethics committee portal

---

## Project Structure

```
VitalAI/
├── frontend/          # Next.js + React + TypeScript
├── backend/           # FastAPI + Python
├── docs/              # Product documentation
├── .env.example       # Environment variables template
└── README.md
```

---

## Team

- Nahuel Martinez de Sucre

---

## License

MIT
