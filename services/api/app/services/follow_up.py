from __future__ import annotations

from anthropic import Anthropic
from pydantic import BaseModel
import instructor

from app.schemas.jobs import PreviewAnalysisResponse, RiskClassification
from app.core.config import settings

class FollowUpPayload(BaseModel):
    answer: str
    suggested_next_step: str | None

def _build_follow_up_answer_mock(analysis: PreviewAnalysisResponse, question: str) -> tuple[str, str | None]:
    normalized = question.strip().lower()
    answer = "This is a mock fallback follow-up answer since the Claude API key is not mapped."
    suggested_next_step = analysis.recommended_actions[0] if analysis.recommended_actions else None
    return answer, suggested_next_step

def build_follow_up_answer(analysis: PreviewAnalysisResponse, question: str) -> tuple[str, str | None]:
    if not settings.CLAUDE_API_KEY or settings.CLAUDE_API_KEY == "sk_test_mock":
        return _build_follow_up_answer_mock(analysis, question)
        
    client = instructor.from_anthropic(Anthropic(api_key=settings.CLAUDE_API_KEY))
    
    prompt = f"""
    You are an expert contract assistant. Address the user's question about their contract objectively.
    Here is the structured baseline analysis we hold about their contract: {analysis.model_dump_json()}
    
    User Question: {question}
    """
    
    resp = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
        response_model=FollowUpPayload
    )
    
    return resp.answer, resp.suggested_next_step


