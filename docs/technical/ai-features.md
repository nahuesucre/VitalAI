# AI Features

VitalAI uses Claude (Anthropic) as its AI engine. All AI functionality is encapsulated in a decoupled service layer, making it possible to swap providers or use a local LLM in the future.

---

## 1. Document Parsing

### What it does

When you upload a protocol PDF and click "Process with AI", the system:

1. **Extracts text** from the PDF using pdfplumber (with PyPDF2 as fallback)
2. **Detects sections** using regex-based smart section detection
3. **Sends focused text** to Claude with a structured extraction prompt
4. **Parses the response** into structured JSON
5. **Saves to the database** as visits, procedures, and screening criteria

### Smart Section Detection

The parser looks for key sections in the protocol:

| Section | Keywords (EN) | Keywords (ES) |
|---------|--------------|---------------|
| Schedule of Assessments | schedule of assessments, schedule of activities | tabla de visitas |
| Inclusion Criteria | inclusion criteria, eligibility | criterios de inclusión |
| Exclusion Criteria | exclusion criteria | criterios de exclusión |
| Study Procedures | study procedures, study assessments | procedimientos del estudio |
| Screening | screening visit, screening period | visita de screening |
| Study Design | study design, study overview | diseño del estudio |

For each match, it extracts 200 characters before + 8000 characters after the keyword. This focused approach avoids sending the entire 200+ page protocol to the AI.

### What gets extracted

**From Protocol:**
```json
{
  "visits": [
    {
      "visit_code": "V1",
      "visit_name": "Screening",
      "day_nominal": 0,
      "window_before": 3,
      "window_after": 3,
      "procedures": ["Informed Consent", "Demographics", "Medical History", "ECG"]
    }
  ],
  "screening_criteria": {
    "inclusion": ["Age >= 18 years", "Confirmed diagnosis of heart failure"],
    "exclusion": ["Pregnant or nursing", "Known allergy to study drug"]
  }
}
```

**From ICF:**
- Study title, purpose, procedures summary, risks, benefits, alternatives, confidentiality, consent elements

**From IB (Investigator's Brochure):**
- Drug name, mechanism of action, dosing, safety profile, contraindications, adverse events

### Token limits

| Document Type | Max Tokens |
|--------------|-----------|
| Protocol | 8,192 |
| ICF | 4,096 |
| IB | 4,096 |
| Chat | 2,048 |

The focused prompt is capped at ~80,000 tokens of input text to stay within model limits.

---

## 2. Alert Engine

### What it does

The alert engine is **rule-based** (no AI required). It runs automatically when:
- A task status is updated during a visit
- Manually triggered via `POST /patients/{id}/visits/{id}/check-alerts`

### Alert rules

| Rule | Trigger | Severity |
|------|---------|----------|
| Critical procedure missing | Procedure is `is_critical` AND status is `pending` or `missing` | HIGH |
| Required procedure missing | Procedure is `is_required` AND status is `missing` | MEDIUM |
| Incomplete screening | Patient has criteria with status `unknown` | MEDIUM |
| Exclusion criterion met | Patient has an exclusion criterion with status `met` (patient HAS the condition) | HIGH |

### Deduplication

Before creating an alert, the engine checks for existing open alerts with the same:
- `patient_visit_id`
- `alert_type`
- `title`
- `status = "open"`

This prevents duplicate alerts from being created on repeated checks.

---

## 3. Contextual Chat (AI Copilot)

### What it does

The chat provides a conversational interface where users can ask questions about:
- The study protocol
- Specific visits and procedures
- Screening criteria
- Patient status
- Alerts and missing items

### How context is assembled

When a user sends a message, the backend assembles a context package:

```
System Prompt:
  "You are VitalAI Copilot, an assistant for clinical trial operations..."

Context includes:
  1. Study metadata (name, phase, sponsor)
  2. Operational structure (visits + procedures)
  3. Screening rules (inclusion + exclusion)
  4. Extracted document text (protocol, ICF, IB)
  5. Patient data (if in patient context)
  6. Visit status (if in visit context)

User message + conversation history
```

This grounded approach ensures the AI responds based on actual study data, not general knowledge.

### Conversation history

The frontend maintains the conversation history in memory and sends it with each request. This allows multi-turn conversations:

```
User: "What does Visit 2 include?"
AI: "Visit 2 (Baseline) includes: ECG, Blood Pressure, Lab Tests..."
User: "Which of those are critical?"
AI: "ECG and Lab Tests are marked as critical procedures."
```

### Model

- **Model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Max output tokens:** 2,048
- **Temperature:** Default (not overridden)

---

## 4. LLMService Abstraction

All AI calls go through the `LLMService` class in `backend/app/services/ai_service.py`.

### Interface

```python
class LLMService:
    async def parse_protocol(document_text: str) -> dict
    async def parse_icf(document_text: str) -> dict
    async def parse_ib(document_text: str) -> dict
    async def chat(message: str, context: dict, history: list) -> str
```

### Why it's decoupled

The service abstraction allows:
- **Swapping models** — Change from Claude to another provider by reimplementing the class
- **Local LLM** — For on-premise deployments, replace with a local model endpoint
- **Testing** — Mock the service for unit tests without hitting the API
- **Cost tracking** — Centralize token usage monitoring

### Configuration

The service reads `ANTHROPIC_API_KEY` from environment variables via the `Settings` class. If the key is empty, AI features will fail gracefully.
