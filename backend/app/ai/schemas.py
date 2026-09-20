from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    active_pole: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    context_summary: Dict[str, Any]
    timestamp: float


class OllamaConfigRequest(BaseModel):
    host: str
    model: str
