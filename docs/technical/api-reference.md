# API Reference

Base URL: `http://localhost:8000/api/v1`

All endpoints except `/auth/login` and `/auth/register` require authentication via Bearer token.

---

## Authentication

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "coordinator@vitalai.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

### POST /auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "Jane Doe",
  "role_id": 2
}
```

Role IDs: 1 = Admin, 2 = Coordinator, 3 = Physician

### GET /auth/me

Get the current authenticated user's profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "coordinator@vitalai.com",
  "full_name": "Coordinator Demo",
  "role_id": 2,
  "role_name": "coordinator",
  "is_active": true,
  "created_at": "2026-04-14T..."
}
```

---

## Studies

### POST /studies/

Create a new study.

**Request:**
```json
{
  "name": "RELIEHF",
  "sponsor": "Pfizer",
  "phase": "III",
  "study_type": "interventional_drug",
  "description": "Heart failure study"
}
```

### GET /studies/

List all studies.

### GET /studies/{study_id}

Get study details.

### PUT /studies/{study_id}

Update study metadata.

### POST /studies/{study_id}/documents

Upload a document (multipart form data).

**Form fields:**
- `file` — PDF or DOCX file
- `document_type` — `protocol`, `icf`, or `ib`
- `title` — Document title

### GET /studies/{study_id}/documents

List all documents for a study.

### POST /studies/{study_id}/documents/{doc_id}/parse

Trigger AI parsing of a document. This extracts visits, procedures, and screening criteria from the document and saves them to the database.

**Response (200):**
```json
{
  "status": "completed",
  "visits_created": 8,
  "rules_created": 12
}
```

---

## Study Structure

### GET /studies/{study_id}/structure/visits

List all extracted visits with their procedures.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "visit_code": "V1",
    "visit_name": "Screening",
    "order_index": 0,
    "day_nominal": 0,
    "window_min_days": -3,
    "window_max_days": 3,
    "is_confirmed": false,
    "procedures": [
      {
        "id": "uuid",
        "procedure_code": "P1",
        "procedure_name": "Informed Consent",
        "is_required": true,
        "is_critical": true
      }
    ]
  }
]
```

### PUT /studies/{study_id}/structure/visits/{visit_id}

Update visit details (name, window, description).

### DELETE /studies/{study_id}/structure/visits/{visit_id}

Delete a visit and its procedures.

### GET /studies/{study_id}/structure/rules

List inclusion/exclusion criteria.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "rule_type": "inclusion",
    "title": "Age >= 18 years",
    "description": "Patient must be at least 18 years old",
    "is_confirmed": false
  }
]
```

### PUT /studies/{study_id}/structure/rules/{rule_id}

Update a rule.

### POST /studies/{study_id}/structure/confirm

Confirm all visits and rules as validated. Sets `is_confirmed = true` on all visits and rules.

---

## Patients

### POST /studies/{study_id}/patients/

Create a new pseudonymized patient. Automatically initializes screening criteria from study rules.

**Request:**
```json
{
  "subject_code": "SUBJ-0001",
  "sex": "M",
  "birth_year": 1985
}
```

### GET /studies/{study_id}/patients/

List all patients in a study.

### GET /studies/{study_id}/patients/{patient_id}

Get patient details.

---

## Screening

### GET /patients/{patient_id}/screening/

Get all screening criteria for a patient with their current status.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "criterion_name": "Age >= 18 years",
    "criterion_type": "inclusion",
    "status": "met",
    "notes": null
  }
]
```

### PUT /patients/{patient_id}/screening/{item_id}

Update a screening criterion status.

**Request:**
```json
{
  "status": "met"
}
```

Valid statuses: `met`, `not_met`, `unknown`

The patient's `screening_status` is automatically recalculated:
- All inclusion met + all exclusion met → `eligible`
- Any criteria not met → `not_eligible`
- Any criteria still unknown → `in_progress`

---

## Visits

### POST /patients/{patient_id}/visits/

Create a visit for a patient. Automatically creates tasks from the study visit's procedures.

**Request:**
```json
{
  "study_visit_id": "uuid-of-study-visit",
  "visit_date": "2026-04-14"
}
```

### GET /patients/{patient_id}/visits/

List all visits for a patient.

### GET /patients/{patient_id}/visits/{visit_id}

Get visit details with all tasks.

**Response (200):**
```json
{
  "id": "uuid",
  "visit_date": "2026-04-14",
  "visit_status": "planned",
  "tasks": [
    {
      "id": "uuid",
      "procedure_name": "Blood pressure",
      "is_required": true,
      "is_critical": false,
      "status": "pending",
      "completed_at": null
    }
  ]
}
```

### PUT /patients/{patient_id}/visits/{visit_id}/tasks/{task_id}

Update a task's status.

**Request:**
```json
{
  "status": "completed"
}
```

Valid statuses: `pending`, `completed`, `not_applicable`, `missing`

### POST /patients/{patient_id}/visits/{visit_id}/check-alerts

Run the alert engine for a specific visit. Creates alerts for missing or critical procedures.

---

## Alerts

### GET /studies/{study_id}/alerts/

List alerts for a study. Supports query parameters for filtering.

**Query parameters:**
- `patient_id` — Filter by patient
- `alert_type` — Filter by type
- `severity` — Filter by severity (low, medium, high)
- `status` — Filter by status (open, acknowledged, resolved)

### PUT /studies/{study_id}/alerts/{alert_id}

Update alert status.

**Request:**
```json
{
  "status": "resolved"
}
```

---

## Metrics

### GET /studies/{study_id}/metrics/overview

Get operational metrics for a study.

**Response (200):**
```json
{
  "total_patients": 5,
  "total_visits": 12,
  "total_alerts_open": 3,
  "patients_by_status": {
    "in_progress": 2,
    "eligible": 2,
    "not_eligible": 1
  },
  "visits_by_status": {
    "planned": 4,
    "completed": 6,
    "missed": 2
  },
  "alerts_by_type": {
    "critical_missing": 2,
    "incomplete_screening": 1
  },
  "alerts_by_severity": {
    "high": 2,
    "medium": 1
  },
  "common_missing_procedures": [
    {"procedure_name": "ECG", "count": 3}
  ],
  "deviations_by_category": {}
}
```

---

## Chat

### POST /chat/

Send a message to the AI copilot.

**Request:**
```json
{
  "message": "What procedures does Visit 1 include?",
  "study_id": "uuid-of-study",
  "conversation_history": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous answer"}
  ]
}
```

**Response (200):**
```json
{
  "response": "Visit 1 (Screening) includes the following procedures: ..."
}
```

---

## Health Check

### GET /health

**Response (200):**
```json
{
  "status": "ok",
  "service": "vitalai"
}
```
