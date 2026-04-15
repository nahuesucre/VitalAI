-- ============================================================
-- VitalAI — Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ROLES & USERS
-- ============================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role_id         INT NOT NULL REFERENCES roles(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- STUDIES & DOCUMENTS
-- ============================================================
CREATE TABLE studies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    sponsor         VARCHAR(255),
    phase           VARCHAR(50),
    study_type      VARCHAR(100),
    description     TEXT,
    status          VARCHAR(50) DEFAULT 'draft',
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE study_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id            UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    document_type       VARCHAR(50) NOT NULL,
    title               VARCHAR(255),
    version             VARCHAR(50),
    file_path           TEXT,
    file_url            TEXT,
    uploaded_by         UUID REFERENCES users(id),
    processing_status   VARCHAR(50) DEFAULT 'pending',
    extracted_text      TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- STUDY STRUCTURE (AI-extracted, user-confirmed)
-- ============================================================
CREATE TABLE study_visits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id        UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    visit_code      VARCHAR(50),
    visit_name      VARCHAR(255) NOT NULL,
    order_index     INT NOT NULL,
    day_nominal     INT,
    window_min_days INT,
    window_max_days INT,
    description     TEXT,
    is_confirmed    BOOLEAN DEFAULT false
);

CREATE TABLE study_procedures (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_visit_id      UUID NOT NULL REFERENCES study_visits(id) ON DELETE CASCADE,
    procedure_code      VARCHAR(100),
    procedure_name      VARCHAR(255) NOT NULL,
    description         TEXT,
    is_required         BOOLEAN DEFAULT true,
    is_critical         BOOLEAN DEFAULT false,
    order_index         INT DEFAULT 0
);

CREATE TABLE study_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id            UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    rule_type           VARCHAR(50) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    source_document_id  UUID REFERENCES study_documents(id),
    source_excerpt      TEXT,
    is_confirmed        BOOLEAN DEFAULT false
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id            UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    subject_code        VARCHAR(100) NOT NULL,
    sex                 VARCHAR(20),
    birth_year          INT,
    screening_status    VARCHAR(50) DEFAULT 'not_started',
    enrollment_status   VARCHAR(50) DEFAULT 'screening',
    notes               TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(study_id, subject_code)
);

CREATE TABLE patient_screening (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    study_rule_id   UUID REFERENCES study_rules(id),
    criterion_name  VARCHAR(500) NOT NULL,
    criterion_type  VARCHAR(50),
    status          VARCHAR(50) DEFAULT 'unknown',
    notes           TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PATIENT VISITS & TASKS
-- ============================================================
CREATE TABLE patient_visits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    study_visit_id  UUID NOT NULL REFERENCES study_visits(id),
    visit_date      DATE,
    visit_status    VARCHAR(50) DEFAULT 'planned',
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE patient_visit_tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_visit_id    UUID NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
    study_procedure_id  UUID NOT NULL REFERENCES study_procedures(id),
    status              VARCHAR(50) DEFAULT 'pending',
    notes               TEXT,
    completed_by        UUID REFERENCES users(id),
    completed_at        TIMESTAMPTZ
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id            UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    patient_id          UUID REFERENCES patients(id),
    patient_visit_id    UUID REFERENCES patient_visits(id),
    alert_type          VARCHAR(100) NOT NULL,
    severity            VARCHAR(20) DEFAULT 'medium',
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    status              VARCHAR(50) DEFAULT 'open',
    created_at          TIMESTAMPTZ DEFAULT now(),
    resolved_at         TIMESTAMPTZ,
    resolved_by         UUID REFERENCES users(id)
);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE notes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id            UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    patient_id          UUID REFERENCES patients(id),
    patient_visit_id    UUID REFERENCES patient_visits(id),
    author_id           UUID NOT NULL REFERENCES users(id),
    note_type           VARCHAR(50),
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID,
    action          VARCHAR(100) NOT NULL,
    payload_json    JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_study_documents_study ON study_documents(study_id);
CREATE INDEX idx_study_visits_study ON study_visits(study_id);
CREATE INDEX idx_study_procedures_visit ON study_procedures(study_visit_id);
CREATE INDEX idx_study_rules_study ON study_rules(study_id);
CREATE INDEX idx_patients_study ON patients(study_id);
CREATE INDEX idx_patient_screening_patient ON patient_screening(patient_id);
CREATE INDEX idx_patient_visits_patient ON patient_visits(patient_id);
CREATE INDEX idx_patient_visit_tasks_visit ON patient_visit_tasks(patient_visit_id);
CREATE INDEX idx_alerts_study ON alerts(study_id);
CREATE INDEX idx_alerts_patient ON alerts(patient_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
