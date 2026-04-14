import json
import anthropic
from app.core.config import settings

PROTOCOL_PARSE_PROMPT = """You are a clinical trial protocol analyst. You receive the full text of a clinical study protocol.
Your task is to extract a structured representation of the study's operational elements.

You MUST return valid JSON matching this exact schema:
{
  "visits": [
    {
      "visit_code": "V1",
      "visit_name": "Screening Visit",
      "order_index": 1,
      "day_nominal": null,
      "window_min_days": null,
      "window_max_days": null,
      "description": "Brief description of the visit purpose",
      "procedures": [
        {
          "procedure_name": "Informed Consent",
          "description": "Brief description",
          "is_required": true,
          "is_critical": true
        }
      ]
    }
  ],
  "screening_criteria": {
    "inclusion": [
      {"title": "Age >= 18 years", "description": "Detailed description", "source_excerpt": "exact quote from protocol"}
    ],
    "exclusion": [
      {"title": "...", "description": "...", "source_excerpt": "..."}
    ]
  }
}

Rules:
- Extract EVERY visit mentioned in the protocol, in chronological order.
- For each visit, extract ALL procedures/assessments listed.
- Mark a procedure as is_critical if missing it would constitute a protocol deviation.
- For screening criteria, include the verbatim source_excerpt from the protocol.
- If a time window is specified (e.g., "Day 14 +/- 3 days"), extract window_min_days and window_max_days.
- Do NOT invent criteria or procedures not present in the protocol.
- Return ONLY the JSON, no additional text."""

ICF_PARSE_PROMPT = """You are a clinical trial documentation analyst. You receive the text of an Informed Consent Form (ICF/FCI).
Extract the key consent elements as structured JSON:
{
  "study_title": "...",
  "purpose": "...",
  "procedures_summary": "...",
  "risks": ["...", "..."],
  "benefits": ["...", "..."],
  "alternatives": "...",
  "confidentiality": "...",
  "voluntary_participation": "...",
  "key_consent_elements": [
    {"element": "...", "description": "...", "source_excerpt": "..."}
  ]
}
Only extract what is explicitly stated. Do not infer or add elements not present in the document.
Return ONLY the JSON, no additional text."""

IB_PARSE_PROMPT = """You are a clinical trial safety analyst. You receive the text of an Investigator's Brochure (IB).
Extract safety and dosing information as structured JSON:
{
  "drug_name": "...",
  "mechanism_of_action": "...",
  "dosing": {
    "recommended_dose": "...",
    "schedule": "...",
    "adjustments": "..."
  },
  "safety_profile": {
    "common_adverse_events": ["..."],
    "serious_adverse_events": ["..."],
    "contraindications": ["..."],
    "warnings": ["..."]
  },
  "key_safety_elements": [
    {"element": "...", "description": "...", "source_excerpt": "..."}
  ]
}
Only extract what is explicitly stated in the document.
Return ONLY the JSON, no additional text."""


class LLMService:
    """Abstraction layer for LLM calls. Only this class communicates with the Claude API."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-20250514"

    def parse_protocol(self, document_text: str) -> dict:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=8192,
            system=PROTOCOL_PARSE_PROMPT,
            messages=[
                {"role": "user", "content": f"Here is the protocol text:\n\n{document_text}"}
            ],
        )
        return self._extract_json(response.content[0].text)

    def parse_icf(self, document_text: str) -> dict:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=ICF_PARSE_PROMPT,
            messages=[
                {"role": "user", "content": f"Here is the ICF text:\n\n{document_text}"}
            ],
        )
        return self._extract_json(response.content[0].text)

    def parse_ib(self, document_text: str) -> dict:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=IB_PARSE_PROMPT,
            messages=[
                {"role": "user", "content": f"Here is the IB text:\n\n{document_text}"}
            ],
        )
        return self._extract_json(response.content[0].text)

    def chat(self, message: str, context: str, conversation_history: list[dict] = None) -> str:
        system_prompt = f"""You are an AI assistant for a clinical trial operations platform called TrialFlow AI.
You help coordinators and physicians with operational questions about the study.

You have access to the following context:
{context}

Rules:
- Answer based ONLY on the provided context (documents, study structure, patient data).
- If you cannot answer from the available context, say so explicitly.
- Never invent rules, criteria, or procedures not present in the source documents.
- When referencing a protocol requirement, cite the visit or section.
- Be concise and operationally useful.
- Respond in the same language as the user's question."""

        messages = []
        if conversation_history:
            for msg in conversation_history:
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

    def _extract_json(self, text: str) -> dict:
        """Extract JSON from LLM response, handling potential markdown wrapping."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())


# Singleton
llm_service = LLMService()
