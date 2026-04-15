# User Guide

This guide walks you through every feature of VitalAI, step by step.

---

## 1. Logging In

Navigate to `http://localhost:3000` and enter your credentials.

**Demo accounts:**

| Email | Password | Role |
|-------|----------|------|
| admin@vitalai.com | password123 | Admin |
| coordinator@vitalai.com | password123 | Coordinator |
| doctor@vitalai.com | password123 | Physician |

After login, you'll land on the **Dashboard**.

### Language and Theme

- **Language toggle** (EN/ES): Located in the top-right corner of the header. Click to switch between English and Spanish. The setting persists across sessions.
- **Dark mode toggle** (sun/moon icon): Next to the language button. Click to switch between light and dark themes.

Both toggles are also available on the login page (top-right corner).

---

## 2. Dashboard

The dashboard provides a quick overview of your operational status:

- **Patients in Screening** — How many patients are currently being evaluated
- **Active Visits** — Total visits in progress, with count of completed ones
- **Critical Alerts** — Open alerts that need attention

Below the metrics:
- **Studies list** — Quick access to your studies
- **Recent Alerts** — The latest open alerts across your studies

---

## 3. Creating a Study

1. Go to **Studies** from the sidebar
2. Click **+ New Study**
3. Fill in:
   - **Study name** (e.g., RELIEHF)
   - **Sponsor** (e.g., Pfizer)
   - **Phase** (I, II, III, or IV)
   - **Description** (optional)
4. Click **Create study**

You'll be redirected to the study detail page.

---

## 4. Uploading Documents

In the study detail page, go to the **Documents** tab:

1. Click one of the upload buttons:
   - **Protocol** — The main study protocol PDF
   - **ICF** — Informed Consent Form
   - **IB** — Investigator's Brochure
2. Select a PDF or DOCX file
3. Wait for the upload to complete

Each document shows its processing status:
- `pending` — Uploaded but not yet processed
- `processing` — AI is currently extracting data
- `completed` — Extraction successful
- `failed` — Extraction encountered an error

---

## 5. Processing Documents with AI

After uploading a protocol:

1. Click **Process with AI** next to the document
2. Wait for the AI to analyze the document (this may take 30-60 seconds for large protocols)
3. The AI extracts:
   - **Visits** — The schedule of assessments with time windows
   - **Procedures** — What needs to happen at each visit
   - **Screening criteria** — Inclusion and exclusion criteria

Once processing is complete, go to the **Operational Structure** tab to review the results.

---

## 6. Reviewing the Operational Structure

The **Operational Structure** tab shows what the AI extracted:

### Visits
Each visit card shows:
- Visit code and name (e.g., V1 — Screening)
- Day number and time window (e.g., Day 0 ± 3 days)
- List of procedures expected at that visit
- Confirmation status (filled circle = confirmed)

### Screening Criteria
Below the visits, you'll see:
- **Inclusion criteria** (green badges) — What the patient must have
- **Exclusion criteria** (red badges) — What the patient must NOT have

### Confirming the Structure
Review the extracted data carefully. If everything looks correct:
1. Click **Confirm complete structure**
2. This locks the structure and makes it available for patient operations

> **Important:** Always review the AI extraction before confirming. The AI proposes, but you validate.

---

## 7. Creating Patients

Go to the **Patients** tab in the study detail:

1. Click **+ New Patient**
2. Fill in:
   - **Subject code** (e.g., SUBJ-0001) — This is the pseudonymized identifier
   - **Sex** (Male/Female)
   - **Birth year**
3. Click **Create patient**

The patient appears in the list with their screening status.

> **Note:** No real patient names or identifiers are stored. Only pseudonymized codes.

---

## 8. Screening a Patient

Click on a patient in the list to open their screening page.

### How screening works

The screening page shows two sections:

**Inclusion Criteria:**
- Each criterion from the protocol is listed
- For each, mark: **Met** (green), **Not Met** (red), or **Pending** (gray)
- All inclusion criteria must be "Met" for the patient to be eligible

**Exclusion Criteria:**
- Each exclusion criterion is listed
- Marking **Met** means the patient does NOT have this condition (which is good)
- Marking **Not Met** means the patient HAS this condition (which may disqualify them)

### Screening status auto-updates
- All inclusion met + all exclusion met → **Eligible**
- Any inclusion not met or any exclusion not met → **Not Eligible**
- Some criteria still pending → **In Progress**

### After screening
- Click **Back to study** to return
- Click **Create visit** to schedule the patient's first visit

---

## 9. Managing Visits

### Creating a visit
1. From the screening page, click **Create visit**
2. Select the visit type from the dropdown (e.g., "V1 — Screening", "V2 — Baseline")
3. Click **Create visit**

### During a visit
The visit page shows a checklist of all expected procedures:

- **Click the circle** next to a procedure to mark it as completed (turns green with checkmark)
- **Click again** to undo
- **N/A** — Mark a procedure as not applicable
- **Missing** — Flag a procedure as missing (triggers an alert)

Procedures marked as **Critical** have a red badge — these are high-priority items.

### Progress bar
The top of the page shows a progress bar: X/Y completed.

### Alerts
If critical procedures are missing or incomplete, alerts appear at the top of the visit page in a yellow banner.

---

## 10. Alerts

Alerts are generated automatically when the system detects:

| Alert Type | Severity | Trigger |
|-----------|----------|---------|
| Critical procedure missing | High | A procedure marked as `is_critical` is pending or missing |
| Required procedure missing | Medium | A procedure marked as `is_required` has status "missing" |
| Incomplete screening | Medium | Patient has criteria still in "unknown" status |
| Exclusion criterion met | High | Patient meets an exclusion criterion (may be ineligible) |

Alerts appear in:
- The **visit page** (yellow banner at the top)
- The **dashboard** (Recent Alerts panel)
- The **alerts endpoint** (accessible via API)

---

## 11. AI Copilot (Chat)

The AI Copilot is a contextual chat that understands your study, documents, patients, and visits.

### How to use it
1. Go to **AI Copilot** from the sidebar
2. Select a study from the dropdown (top-right)
3. Ask a question or click one of the suggested prompts

### What you can ask
- "What procedures does Visit 1 include?"
- "What are the inclusion criteria?"
- "What time window do I have for this visit?"
- "What is missing to close this visit?"
- "What does the protocol say about [topic]?"

### How it works
The copilot assembles context from:
- The study's documents (extracted text)
- The operational structure (visits, procedures, rules)
- Patient data (if applicable)
- Visit status (if applicable)

It then sends this context along with your question to Claude, which generates a grounded response.

> **Note:** The chat responds in the language of the question or the documents. It is not affected by the app's language toggle.

---

## 12. Metrics Dashboard

The dashboard shows key operational metrics for the selected study:

- **Patients by status** — How many are in screening, eligible, not eligible
- **Visits by status** — Planned, in progress, completed, missed
- **Open alerts** — Total alerts that haven't been resolved
- **Alerts by type and severity** — Breakdown of what's going wrong
- **Most common missing procedures** — Which procedures get missed most often

These metrics help sites identify where their operational process fails and take corrective action.

---

## Tips for Coordinators

1. **Process the protocol first** — Upload and process with AI before creating patients
2. **Review the structure carefully** — AI extraction is good but not perfect; always verify
3. **Use the chat** — Instead of searching the protocol PDF, ask the copilot
4. **Check alerts regularly** — The dashboard shows recent alerts; don't let them pile up
5. **Complete visits promptly** — Mark procedures as completed during the visit, not after
