# Data Model

VitalAI uses 14 database tables organized in three layers: **users**, **study definition**, and **patient execution**.

---

## Entity Relationship Overview

```
Users & Roles
  └── Studies
        ├── StudyDocuments
        ├── StudyVisits
        │     └── StudyProcedures
        ├── StudyRules
        ├── Patients
        │     ├── PatientScreening (linked to StudyRules)
        │     └── PatientVisits (linked to StudyVisits)
        │           └── PatientVisitTasks (linked to StudyProcedures)
        ├── Alerts
        └── Notes

AuditLogs (standalone, references any entity)
```

---

## Tables

### Users & Roles

#### roles

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| name | VARCHAR(50) | Role name: admin, coordinator, physician |
| description | VARCHAR(200) | Role description |

#### users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| email | VARCHAR(255) UNIQUE | Login email |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| full_name | VARCHAR(255) | Display name |
| role_id | INTEGER FK → roles | User's role |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Creation timestamp |

---

### Study Definition

These tables define the structure of a clinical study. They are populated by AI extraction and confirmed by the user.

#### studies

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| name | VARCHAR(255) | Study name (e.g., RELIEHF) |
| sponsor | VARCHAR(255) | Sponsor organization |
| phase | VARCHAR(10) | Phase I, II, III, IV |
| study_type | VARCHAR(100) | e.g., interventional_drug |
| description | TEXT | Study description |
| status | VARCHAR(50) | draft, active, completed |
| created_by | UUID FK → users | Creator |
| created_at | TIMESTAMP | Creation timestamp |

#### study_documents

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| study_id | UUID FK → studies | Parent study |
| document_type | VARCHAR(50) | protocol, icf, ib |
| title | VARCHAR(255) | Document title |
| version | VARCHAR(50) | Document version |
| file_path | VARCHAR(500) | Local file path |
| file_url | VARCHAR(500) | Remote URL (optional) |
| uploaded_by | UUID FK → users | Uploader |
| processing_status | VARCHAR(50) | pending, processing, completed, failed |
| extracted_text | TEXT | Full extracted text from document |
| created_at | TIMESTAMP | Upload timestamp |

#### study_visits

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| study_id | UUID FK → studies | Parent study |
| visit_code | VARCHAR(50) | Visit code (e.g., V1, V2) |
| visit_name | VARCHAR(255) | Visit name (e.g., Screening) |
| order_index | INTEGER | Sort order |
| day_nominal | INTEGER | Nominal day number |
| window_min_days | INTEGER | Window before (negative) |
| window_max_days | INTEGER | Window after (positive) |
| description | TEXT | Visit description |
| is_confirmed | BOOLEAN | Confirmed by user |

#### study_procedures

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| study_visit_id | UUID FK → study_visits | Parent visit |
| procedure_code | VARCHAR(50) | Procedure code |
| procedure_name | VARCHAR(255) | Procedure name (e.g., ECG) |
| description | TEXT | Procedure description |
| is_required | BOOLEAN | Whether this procedure is required |
| is_critical | BOOLEAN | Whether this is a critical safety procedure |
| order_index | INTEGER | Sort order within visit |

#### study_rules

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| study_id | UUID FK → studies | Parent study |
| rule_type | VARCHAR(50) | inclusion, exclusion, other |
| title | VARCHAR(500) | Rule title |
| description | TEXT | Full rule description |
| source_document_id | UUID FK → study_documents | Source document |
| source_excerpt | TEXT | Relevant excerpt from document |
| is_confirmed | BOOLEAN | Confirmed by user |

---

### Patient Execution

These tables track the actual execution of the study for each patient.

#### patients

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| study_id | UUID FK → studies | Parent study |
| subject_code | VARCHAR(50) | Pseudonymized identifier (e.g., SUBJ-0001) |
| sex | VARCHAR(10) | M or F |
| birth_year | INTEGER | Year of birth (no exact date) |
| screening_status | VARCHAR(50) | pending, in_progress, eligible, not_eligible |
| enrollment_status | VARCHAR(50) | not_enrolled, enrolled, withdrawn |
| notes | TEXT | General notes |
| created_by | UUID FK → users | Creator |
| created_at | TIMESTAMP | Creation timestamp |

#### patient_screening

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| patient_id | UUID FK → patients | Patient |
| study_rule_id | UUID FK → study_rules | Linked study rule |
| criterion_name | VARCHAR(500) | Criterion text |
| criterion_type | VARCHAR(50) | inclusion or exclusion |
| status | VARCHAR(50) | met, not_met, unknown, pending |
| notes | TEXT | Evaluator notes |
| updated_by | UUID FK → users | Last updater |
| updated_at | TIMESTAMP | Last update |

#### patient_visits

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| patient_id | UUID FK → patients | Patient |
| study_visit_id | UUID FK → study_visits | Study visit template |
| visit_date | DATE | Actual visit date |
| visit_status | VARCHAR(50) | planned, in_progress, completed, missed |
| notes | TEXT | Visit notes |
| created_by | UUID FK → users | Creator |
| created_at | TIMESTAMP | Creation timestamp |

#### patient_visit_tasks

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| patient_visit_id | UUID FK → patient_visits | Parent visit |
| study_procedure_id | UUID FK → study_procedures | Procedure template |
| status | VARCHAR(50) | pending, completed, not_applicable, missing |
| notes | TEXT | Task notes |
| completed_by | UUID FK → users | Completer |
| completed_at | TIMESTAMP | Completion timestamp |

---

### Operations & Audit

#### alerts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| study_id | UUID FK → studies | Parent study |
| patient_id | UUID FK → patients | Patient (nullable) |
| patient_visit_id | UUID FK → patient_visits | Visit (nullable) |
| alert_type | VARCHAR(100) | e.g., critical_missing, incomplete_screening |
| severity | VARCHAR(20) | low, medium, high |
| title | VARCHAR(500) | Alert title |
| description | TEXT | Alert details |
| status | VARCHAR(50) | open, acknowledged, resolved |
| created_at | TIMESTAMP | Creation timestamp |
| resolved_at | TIMESTAMP | Resolution timestamp |
| resolved_by | UUID FK → users | Resolver |

#### notes

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| study_id | UUID FK → studies | Parent study |
| patient_id | UUID FK → patients | Patient (nullable) |
| patient_visit_id | UUID FK → patient_visits | Visit (nullable) |
| author_id | UUID FK → users | Author |
| note_type | VARCHAR(50) | Note category |
| content | TEXT | Note content |
| created_at | TIMESTAMP | Creation timestamp |

#### audit_logs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| user_id | UUID FK → users | Acting user (nullable) |
| entity_type | VARCHAR(100) | Table/entity name |
| entity_id | UUID | Entity identifier |
| action | VARCHAR(50) | create, update, delete |
| payload_json | TEXT | JSON snapshot of the change |
| created_at | TIMESTAMP | Action timestamp |

---

## Key Relationships

- A **Study** has many Documents, Visits, Rules, Patients, and Alerts
- A **StudyVisit** has many Procedures
- A **Patient** has many ScreeningItems, Visits
- A **PatientVisit** has many Tasks (one per StudyProcedure)
- **PatientScreening** links a Patient to a StudyRule
- **PatientVisitTask** links a PatientVisit to a StudyProcedure
- All delete operations cascade from parent to children
