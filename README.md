# TrialFlow AI (VitalAI)

**Plataforma de operaciones clínicas asistida por IA para sitios de investigación clínica.**

> Built at the Anthropic Hackathon — Buenos Aires, April 2026

---

## El Problema

En investigación clínica, la operación diaria depende de:

- Leer protocolos de **80+ páginas** en PDF para saber qué hacer en cada visita
- Interpretar manualmente reglas, procedimientos y ventanas de tiempo
- Usar checklists dispersos en papel o planillas
- Depender de la memoria del coordinador para detectar faltantes
- Identificar desvíos al protocolo **después** de que ocurrieron
- Carecer de métricas claras para saber dónde falla la operación

Esto genera **errores evitables**, alta carga cognitiva, retrabajo y baja trazabilidad. Los desvíos al protocolo pueden impactar directamente en la calidad del estudio y potencialmente en la salud de los pacientes.

**No existe competencia directa** en este nicho. Las herramientas existentes (EDC, CTMS) no convierten documentos en operación guiada.

---

## Qué Resuelve TrialFlow AI

Transforma documentos del estudio (protocolo, consentimiento informado, brochure del investigador) en una **capa operativa accionable**:

1. **La IA lee el protocolo completo** y extrae visitas, procedimientos, ventanas y criterios de screening
2. El usuario **revisa y confirma** la estructura extraída (la IA propone, el humano confirma)
3. Para cada paciente pseudonimizado: **screening guiado** con criterios del protocolo
4. **Checklists dinámicos** por visita — el coordinador marca qué se hizo y qué falta
5. **Detección automática de desvíos**: procedimiento crítico faltante, visita fuera de ventana, screening incompleto
6. **Chat contextual**: preguntar "¿qué falta para cerrar esta visita?" y obtener respuesta basada en documentos y datos reales
7. **Métricas operativas**: dónde está fallando la operación

**No es un chat con PDFs. Es una plataforma de operaciones clínicas.**

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js + React + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python |
| Base de datos | Supabase (PostgreSQL) |
| AI | Claude API (Sonnet) via `LLMService` desacoplado |
| Auth | JWT + bcrypt |

---

## Setup Rápido

### 1. Clonar el repo

```bash
git clone https://github.com/nahuesucre/VitalAI.git
cd VitalAI
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Copiar: `Project URL`, `anon key`, `service_role key`, y la `Connection string` (postgresql://...)
3. En el **SQL Editor** de Supabase, ejecutar el contenido de `supabase/schema.sql`

### 3. Crear archivo `.env`

```bash
cp .env.example .env
```

Valores a completar:
- `SUPABASE_URL` — la URL del proyecto (ej: `https://xxxx.supabase.co`)
- `SUPABASE_KEY` — la anon key
- `DATABASE_URL` — la connection string, cambiando `postgres://` por `postgresql+asyncpg://` y quitando `?sslmode=...`
- `ANTHROPIC_API_KEY` — key de la API de Claude
- `JWT_SECRET` — cualquier string largo aleatorio

### 4. Backend

```bash
cd backend
pip install -r requirements.txt

# Sembrar usuarios demo
python -m app.db.seed

# Iniciar servidor
uvicorn app.main:app --reload
```

Backend en `http://localhost:8000`. Verificar: `http://localhost:8000/health`

**Usuarios demo:**
| Email | Password | Rol |
|-------|----------|-----|
| admin@trialflow.ai | password123 | Admin |
| coordinator@trialflow.ai | password123 | Coordinador |
| doctor@trialflow.ai | password123 | Médico |

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend en `http://localhost:3000`.

---

## Arquitectura

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Frontend    │────▶│  Backend API    │────▶│  Supabase    │
│  Next.js     │     │  FastAPI        │     │  PostgreSQL  │
│  :3000       │     │  :8000          │     │              │
└─────────────┘     └────────┬────────┘     └──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Claude API     │
                    │  (LLMService)   │
                    └─────────────────┘
```

### Separación fundamental del modelo de datos

- **Definición del estudio** (extraída por IA): `study_visits`, `study_procedures`, `study_rules`
- **Ejecución por paciente** (datos reales): `patient_visits`, `patient_visit_tasks`, `patient_screening`

### AI Service (`backend/app/services/ai_service.py`)

Único punto de contacto con Claude API:
- `parse_protocol()` — extrae visitas, procedimientos, criterios
- `parse_icf()` — extrae elementos del consentimiento
- `parse_ib()` — extrae info de seguridad
- `chat()` — chat contextual con documentos + datos operativos

### Alertas (rule-based, sin LLM)

`backend/app/services/alert_engine.py` detecta:
- Procedimiento **crítico** no completado → severidad alta
- Procedimiento requerido **faltante** → severidad media
- Screening **incompleto** → severidad media
- Criterio de **exclusión** cumplido → severidad alta

---

## Estructura del Proyecto

```
├── backend/
│   └── app/
│       ├── main.py              ← Entry point FastAPI
│       ├── core/                ← config, security (JWT), deps
│       ├── api/v1/              ← Todos los endpoints REST
│       │   ├── auth.py          ← login, register, me
│       │   ├── studies.py       ← CRUD estudios + upload docs
│       │   ├── structure.py     ← visitas/procedimientos/reglas + confirm
│       │   ├── patients.py      ← CRUD pacientes
│       │   ├── screening.py     ← checklist screening
│       │   ├── visits.py        ← visitas + tasks
│       │   ├── alerts.py        ← alertas
│       │   ├── metrics.py       ← métricas
│       │   └── chat.py          ← chat contextual
│       ├── models/              ← SQLAlchemy ORM
│       ├── schemas/             ← Pydantic request/response
│       ├── services/            ← AI service, parser, alertas
│       └── db/                  ← session, seed
├── frontend/                    ← [POR CREAR] Next.js app
├── supabase/
│   ├── schema.sql               ← DDL completo (14 tablas)
│   └── seed.sql                 ← Datos iniciales
├── CLAUDE.md                    ← Guía para Claude Code
└── README.md                    ← Este archivo
```

---

## API Reference

### Auth
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login → JWT |
| POST | `/api/v1/auth/register` | Crear usuario |
| GET | `/api/v1/auth/me` | Perfil actual |

### Studies
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/studies/` | Crear estudio |
| GET | `/api/v1/studies/` | Listar estudios |
| GET | `/api/v1/studies/{id}` | Detalle |
| PUT | `/api/v1/studies/{id}` | Editar |
| POST | `/api/v1/studies/{id}/documents` | Upload doc (multipart: file, document_type, title, version) |
| GET | `/api/v1/studies/{id}/documents` | Listar docs |
| POST | `/api/v1/studies/{id}/documents/{doc_id}/parse` | Disparar parsing IA |

### Structure
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/studies/{id}/structure/visits` | Visitas con procedimientos |
| PUT | `/api/v1/studies/{id}/structure/visits/{vid}` | Editar visita |
| DELETE | `/api/v1/studies/{id}/structure/visits/{vid}` | Eliminar visita |
| GET | `/api/v1/studies/{id}/structure/visits/{vid}/procedures` | Procedimientos |
| PUT | `/api/v1/studies/{id}/structure/procedures/{pid}` | Editar procedimiento |
| GET | `/api/v1/studies/{id}/structure/rules` | Reglas/criterios |
| PUT | `/api/v1/studies/{id}/structure/rules/{rid}` | Editar regla |
| POST | `/api/v1/studies/{id}/structure/confirm` | Confirmar estructura |

### Patients
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/studies/{id}/patients/` | Crear paciente (auto-screening) |
| GET | `/api/v1/studies/{id}/patients/` | Listar |
| GET | `/api/v1/studies/{id}/patients/{pid}` | Detalle |

### Screening
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/patients/{pid}/screening/` | Checklist |
| PUT | `/api/v1/patients/{pid}/screening/{item_id}` | Actualizar criterio |

### Visits
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/patients/{pid}/visits/` | Crear visita (auto-tasks) |
| GET | `/api/v1/patients/{pid}/visits/` | Listar |
| GET | `/api/v1/patients/{pid}/visits/{vid}` | Detalle con tasks |
| PUT | `/api/v1/patients/{pid}/visits/{vid}/tasks/{tid}` | Marcar tarea |
| POST | `/api/v1/patients/{pid}/visits/{vid}/check-alerts` | Chequear alertas |

### Alerts
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/studies/{id}/alerts/` | Listar (filtros: patient_id, alert_type, severity, status) |
| PUT | `/api/v1/studies/{id}/alerts/{aid}` | Resolver/acknowledge |

### Metrics
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/studies/{id}/metrics/overview` | Todas las métricas |

### Chat
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/chat/` | Chat contextual (body: message, study_id, patient_id?, patient_visit_id?, conversation_history[]) |

---

## Asignación de Tareas

### Backend — HECHO
- [x] Auth (JWT + bcrypt)
- [x] Studies CRUD + upload docs
- [x] Structure endpoints + confirm
- [x] Patients + auto-screening
- [x] Screening checklist
- [x] Visits + tasks
- [x] Alert engine
- [x] Metrics
- [x] Chat contextual
- [x] AI Service + Document Parser

### Frontend — POR HACER (Prioridad)
- [ ] Scaffold Next.js + Tailwind
- [ ] Login page
- [ ] Layout (Sidebar + Header)
- [ ] Dashboard
- [ ] Estudios (lista + crear + detalle)
- [ ] Upload documentos + trigger parsing
- [ ] Revisión de estructura + confirmar
- [ ] Pacientes (lista + crear + detalle)
- [ ] Screening checklist interactivo
- [ ] Visita / checklist de tasks
- [ ] Alertas (banners + lista)
- [ ] Chat panel
- [ ] Metrics dashboard

### Integración / QA
- [ ] Testear backend con Supabase real
- [ ] Testear parsing con protocolo real
- [ ] Preparar datos de demo
- [ ] Script de demo

---

## Principios

1. **La IA propone, el humano confirma.** Nada se activa automáticamente.
2. **La IA no inventa reglas.** Se basa en documentos o datos del sistema.
3. **Pseudonimización desde el día 1.** Nunca datos reales.
4. **LLMService desacoplado.** Intercambiable.
5. **Flujo completo primero.** Happy path antes de sofisticación.
6. **Commits frecuentes.**

---

## Team

- Nahuel Martinez de Sucre
- Federico (backend + AI)
- [Tercer integrante]

## License

MIT
