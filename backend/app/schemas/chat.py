from pydantic import BaseModel
from uuid import UUID


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    study_id: UUID
    patient_id: UUID | None = None
    patient_visit_id: UUID | None = None
    conversation_history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    response: str
    context_used: list[str] = []
