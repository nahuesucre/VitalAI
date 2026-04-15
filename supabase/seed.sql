-- ============================================================
-- VitalAI AI — Seed Data
-- Run after schema.sql
-- ============================================================

-- Roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'System administrator — can create studies, manage users'),
    ('coordinator', 'Study coordinator — manages patients, screening, visits'),
    ('physician', 'Physician / Investigator — reviews patients, validates findings');

-- Demo users (passwords hashed with bcrypt, all = "password123")
-- Hash generated with: python -c "import bcrypt; print(bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode())"
-- NOTE: Run the backend seed.py script to create users with proper hashing.
-- These are placeholder inserts for reference:

-- INSERT INTO users (email, password_hash, full_name, role_id) VALUES
--     ('admin@vitalai.com', '$2b$12$PLACEHOLDER', 'Admin VitalAI', 1),
--     ('coordinator@vitalai.com', '$2b$12$PLACEHOLDER', 'María Coordinadora', 2),
--     ('doctor@vitalai.com', '$2b$12$PLACEHOLDER', 'Dr. Investigador', 3);
