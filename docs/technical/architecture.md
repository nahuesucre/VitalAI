# Architecture

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Next.js 16      │────▶│  FastAPI         │────▶│  PostgreSQL  │
│  React 19        │◀────│  Python 3.10+    │◀────│  16 (Docker) │
│  Tailwind CSS 4  │     │                  │     └──────────────┘
│                  │     │  Claude API      │
└─────────────────┘     │  (LLMService)    │     ┌──────────────┐
   Port 3000            │                  │────▶│  File Storage │
                        └─────────────────┘     │  (local disk) │
                           Port 8000            └──────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React 19 + TypeScript | UI, routing, client-side state |
| Styling | Tailwind CSS 4 | Utility-first CSS with dark mode support |
| Backend | FastAPI + Python | REST API, business logic, AI orchestration |
| Database | PostgreSQL 16 | Data persistence, relational queries |
| AI | Claude Sonnet 4 (Anthropic SDK) | Document parsing, contextual chat |
| Auth | JWT + bcrypt | Token-based authentication with password hashing |
| Container | Docker Compose | PostgreSQL container (port 5433) |

## Frontend Architecture

### App Router (Next.js)

```
frontend/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (AppProvider wrapper)
│   ├── page.tsx                  # Root redirect (/ → /dashboard or /login)
│   ├── login/page.tsx            # Authentication page
│   ├── dashboard/page.tsx        # Main dashboard with metrics
│   ├── studies/
│   │   ├── page.tsx              # Studies list + create modal
│   │   └── [studyId]/
│   │       ├── page.tsx          # Study detail (docs, structure, patients tabs)
│   │       └── patients/
│   │           └── [patientId]/
│   │               ├── screening/page.tsx    # Screening checklist
│   │               └── visits/
│   │                   └── [visitId]/page.tsx # Visit checklist + new visit
│   ├── chat/page.tsx             # AI copilot
│   ├── screening/page.tsx        # Redirect → /studies
│   ├── visits/page.tsx           # Redirect → /studies
│   └── globals.css               # Global styles + dark mode
├── components/
│   └── layout/
│       ├── AppLayout.tsx         # Authenticated layout (sidebar + header)
│       └── Sidebar.tsx           # Navigation sidebar (collapsible)
├── contexts/
│   └── AppContext.tsx            # Theme (dark mode) + i18n (locale) state
├── lib/
│   ├── api.ts                   # HTTP client with JWT injection
│   ├── auth.ts                  # Login, logout, getMe helpers
│   └── i18n.ts                  # Translation dictionary (ES/EN)
└── types/
    └── index.ts                 # TypeScript interfaces for all models
```

### Key Patterns

- **Client components** — All pages use `"use client"` for interactive state
- **AppLayout wrapper** — Authenticated pages wrap children in `<AppLayout>`, which handles auth check, sidebar, and header
- **AppContext** — Provides `dark`, `toggleDark`, `locale`, `toggleLocale`, and `t()` (translation function) to all components
- **API client** — `api<T>(path, options)` automatically injects Bearer token, handles 401 redirects, and supports FormData uploads
- **No external state library** — React hooks (`useState`, `useEffect`) only

## Backend Architecture

```
backend/app/
├── main.py                      # FastAPI entry point, lifespan, CORS, router mounting
├── core/
│   ├── config.py                # Pydantic Settings (reads .env)
│   ├── security.py              # JWT creation/verification, bcrypt hashing
│   └── deps.py                  # Dependency injection (get_db, get_current_user)
├── db/
│   ├── base.py                  # SQLAlchemy DeclarativeBase
│   ├── session.py               # Async engine + session factory + init_db()
│   └── seed.py                  # Demo roles + users seeding
├── models/
│   ├── user.py                  # User, Role
│   ├── study.py                 # Study, StudyDocument, StudyVisit, StudyProcedure, StudyRule
│   ├── patient.py               # Patient, PatientScreening, PatientVisit, PatientVisitTask
│   └── alert.py                 # Alert, Note, AuditLog
├── schemas/
│   ├── auth.py                  # Login/Register request/response
│   ├── study.py                 # Study, Document, Visit, Procedure, Rule schemas
│   ├── patient.py               # Patient, Screening, Visit, Task schemas
│   ├── alert.py                 # Alert schemas
│   ├── chat.py                  # Chat request/response
│   └── metrics.py               # Metrics overview schema
├── services/
│   ├── ai_service.py            # LLMService — Claude API abstraction
│   ├── document_parser.py       # PDF/DOCX text extraction + AI parsing pipeline
│   └── alert_engine.py          # Rule-based deviation detection
└── api/v1/
    ├── auth.py                  # POST /login, /register, GET /me
    ├── studies.py               # CRUD studies + document upload
    ├── structure.py             # Visits, procedures, rules management
    ├── patients.py              # Patient CRUD
    ├── screening.py             # Screening criteria status
    ├── visits.py                # Patient visits + task management
    ├── alerts.py                # Alert queries + status updates
    ├── metrics.py               # Dashboard metrics
    └── chat.py                  # AI copilot endpoint
```

### Key Patterns

- **Fully async** — All database operations use `AsyncSession` with `asyncpg` driver
- **Dependency injection** — `Depends(get_db)` for database sessions, `Depends(get_current_user)` for auth
- **Auto-migration** — `init_db()` runs on startup, creates all tables via SQLAlchemy metadata
- **Auto-seeding** — `seed()` runs on startup, creates default roles and demo users (idempotent)
- **Decoupled AI** — All Claude API calls go through `LLMService`, making it swappable

## Database

- **Engine:** PostgreSQL 16 Alpine (Docker container)
- **Port:** 5433 (mapped from internal 5432 to avoid conflicts)
- **Driver:** asyncpg (async PostgreSQL driver for Python)
- **ORM:** SQLAlchemy 2.0 with async support
- **Tables:** 14 (see [Data Model](data-model.md))
- **Migrations:** Tables created on startup via `create_all()` (no Alembic in MVP)

## Authentication Flow

1. User sends `POST /api/v1/auth/login` with email + password
2. Backend verifies password against bcrypt hash
3. If valid, creates JWT token (HS256, 8-hour expiry)
4. Token returned as `{ "access_token": "...", "token_type": "bearer" }`
5. Frontend stores token in `localStorage`
6. All subsequent requests include `Authorization: Bearer <token>`
7. Backend `get_current_user` dependency validates token on every protected endpoint

## AI Integration

The AI layer is fully decoupled through `LLMService`:

```
Document Upload → Text Extraction (pdfplumber/PyPDF2) → Smart Section Detection → Claude API → Structured JSON → Database
```

- **Model:** Claude Sonnet 4
- **Protocol parsing:** Extracts visits, procedures, screening criteria into structured JSON
- **ICF parsing:** Extracts consent elements, risks, benefits
- **IB parsing:** Extracts drug info, safety profile, adverse events
- **Chat:** Context-aware conversations with study/patient/visit data injected as system context

See [AI Features](ai-features.md) for details.

## Environment Configuration

Three `.env` files are required:

| File | Used by | Key variables |
|------|---------|---------------|
| `.env` (root) | Docker Compose | POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, DB_PORT |
| `backend/.env` | FastAPI | DATABASE_URL, ANTHROPIC_API_KEY, JWT_SECRET, BACKEND_CORS_ORIGINS |
| `frontend/.env.local` | Next.js | NEXT_PUBLIC_API_URL |
