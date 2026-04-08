from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.jobs import PreviewAnalysisResponse, RiskClassification, RiskFactor

SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?])\s+")


@dataclass(frozen=True)
class RiskRule:
    key: str
    label: str
    weight: int
    explanation: str
    patterns: tuple[re.Pattern[str], ...]


def _compile(*expressions: str) -> tuple[re.Pattern[str], ...]:
    return tuple(re.compile(expression, re.IGNORECASE) for expression in expressions)


RISK_RULES: tuple[RiskRule, ...] = (
    RiskRule(
        key="auto_renewal",
        label="Auto-renewal",
        weight=18,
        explanation="The contract may renew unless the user gives advance notice.",
        patterns=_compile(r"automatic(?:ally)? renew", r"renews? automatically"),
    ),
    RiskRule(
        key="cancellation_penalty",
        label="Cancellation penalty",
        weight=16,
        explanation="Leaving the agreement early may trigger extra fees or penalties.",
        patterns=_compile(r"penalt(?:y|ies) for early cancellation", r"termination fee"),
    ),
    RiskRule(
        key="hidden_fees",
        label="Hidden fees",
        weight=14,
        explanation="The contract references additional costs that may not be capped or clearly itemized.",
        patterns=_compile(r"additional fees?", r"administration fee", r"billed separately"),
    ),
    RiskRule(
        key="non_compete",
        label="Non-compete clause",
        weight=20,
        explanation="The agreement may restrict work or business activity after the relationship ends.",
        patterns=_compile(r"non-?compete", r"shall not engage in any competing business"),
    ),
    RiskRule(
        key="lock_in",
        label="Long-term lock-in",
        weight=15,
        explanation="The user may be tied into the contract for a long minimum period.",
        patterns=_compile(r"minimum term of \w+", r"locked in for", r"fixed term of \w+"),
    ),
    RiskRule(
        key="liability_imbalance",
        label="Liability imbalance",
        weight=17,
        explanation="Responsibility or damages appear to fall unevenly on one party.",
        patterns=_compile(r"indemnif(?:y|ication)", r"not liable for any loss", r"sole liability"),
    ),
    RiskRule(
        key="arbitration",
        label="Arbitration clause",
        weight=10,
        explanation="Disputes may be forced into arbitration instead of court.",
        patterns=_compile(r"binding arbitration", r"resolved by arbitration"),
    ),
)


def _extract_sentences(text: str) -> list[str]:
    normalized = " ".join(text.split())
    parts = SENTENCE_SPLIT_PATTERN.split(normalized)
    return [part.strip() for part in parts if part.strip()]


def _pick_matching_sentences(sentences: list[str], keywords: tuple[str, ...], limit: int = 2) -> list[str]:
    matches: list[str] = []
    for sentence in sentences:
        lowered = sentence.lower()
        if any(keyword in lowered for keyword in keywords):
            matches.append(sentence)
        if len(matches) >= limit:
            break
    return matches


def classify_risk(score: int) -> RiskClassification:
    if score >= 60:
        return RiskClassification.high
    if score >= 25:
        return RiskClassification.medium
    return RiskClassification.low


def _find_match(rule: RiskRule, text: str) -> re.Match[str] | None:
    for pattern in rule.patterns:
        match = pattern.search(text)
        if match:
            return match
    return None


def analyze_text(text: str) -> tuple[list[RiskFactor], int, RiskClassification]:
    normalized = " ".join(text.split())
    factors: list[RiskFactor] = []

    for rule in RISK_RULES:
        match = _find_match(rule, normalized)
        if not match:
            continue

        start = max(match.start() - 40, 0)
        end = min(match.end() + 70, len(normalized))
        evidence = normalized[start:end].strip()
        factors.append(
            RiskFactor(
                key=rule.key,
                label=rule.label,
                weight=rule.weight,
                evidence=evidence,
                explanation=rule.explanation,
            )
        )

    score = min(sum(factor.weight for factor in factors), 100)
    return factors, score, classify_risk(score)


def detect_contract_type(text: str) -> str:
    normalized = text.lower()
    contract_signals = (
        ("lease agreement", ("lease", "landlord", "tenant", "rent", "premises")),
        ("employment contract", ("employee", "employer", "salary", "non-compete", "termination")),
        ("service agreement", ("services", "service provider", "scope of work", "deliverables")),
        ("loan agreement", ("loan", "interest", "repayment", "borrower", "lender")),
        ("subscription agreement", ("subscription", "renew", "monthly plan", "membership")),
    )
    for label, keywords in contract_signals:
        if sum(keyword in normalized for keyword in keywords) >= 2:
            return label
    return "general contract"


def _build_recommended_actions(factors: list[RiskFactor], risk_level: RiskClassification) -> list[str]:
    actions: list[str] = []
    factor_keys = {factor.key for factor in factors}

    if "auto_renewal" in factor_keys:
        actions.append("Ask for the renewal notice period and whether renewal can be disabled before signing.")
    if "cancellation_penalty" in factor_keys or "lock_in" in factor_keys:
        actions.append("Clarify the exact cancellation cost, notice requirement, and minimum commitment period.")
    if "hidden_fees" in factor_keys:
        actions.append("Request a written fee schedule that lists every recurring and one-off charge.")
    if "liability_imbalance" in factor_keys:
        actions.append("Check whether liability and indemnity obligations can be made more balanced.")
    if risk_level == RiskClassification.high:
        actions.append("Consider pausing signature and escalating the contract for legal review.")

    if not actions:
        actions.append("Confirm the practical payment, renewal, and termination terms in writing before signing.")

    return actions[:3]


import instructor
from anthropic import Anthropic
from app.core.config import settings

def _build_claude_analysis(text: str, fallback_factors: list[RiskFactor]) -> PreviewAnalysisResponse:
    if not settings.CLAUDE_API_KEY or settings.CLAUDE_API_KEY == "sk_test_mock":
        # Fallback to deterministic logic if no live key is mapped.
        return _build_preview_analysis_deterministic(text, fallback_factors)

    client = instructor.from_anthropic(Anthropic(api_key=settings.CLAUDE_API_KEY))
    
    prompt = f"""
    You are an expert legal contract analyzer. Your job is to extract clauses and risks from the following contract.
    We have already detected some baseline risk factors using deterministic rules. Please merge your findings with ours.
    Be objective, accurate, and map EXACTLY to the requested JSON schema.
    
    Contract text:
    {text}
    """
    
    resp = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
        response_model=PreviewAnalysisResponse
    )
    return resp

def _build_preview_analysis_deterministic(text: str, factors: list[RiskFactor]) -> PreviewAnalysisResponse:
    score = min(sum(factor.weight for factor in factors), 100)
    risk_level = classify_risk(score)
    sentences = _extract_sentences(text)
    contract_type = detect_contract_type(text)

    if factors:
        factor_list = ", ".join(factor.label.lower() for factor in factors[:3])
        summary = (
            f"The preview found signals related to {factor_list}. "
            "A full AI review should confirm whether those clauses are enforceable and how they interact."
        )
    else:
        summary = (
            "The preview did not match the launch-rule risk patterns, but the contract should still go through full AI analysis."
        )

    key_points = sentences[:3] if sentences else ["Normalized contract text will appear here after extraction."]
    financial_obligations = _pick_matching_sentences(sentences, keywords=("fee", "cost", "payment", "rent", "billed", "price"))
    duration_terms = _pick_matching_sentences(sentences, keywords=("term", "month", "year", "renew", "duration"))
    cancellation_terms = _pick_matching_sentences(sentences, keywords=("cancel", "cancellation", "terminate", "notice", "exit"))

    red_flags = [f"{factor.label}: {factor.explanation} Evidence: {factor.evidence}" for factor in factors]

    return PreviewAnalysisResponse(
        contract_type=contract_type,
        summary=summary,
        key_points=key_points,
        red_flags=red_flags,
        risk_score=score,
        risk_level=risk_level,
        factors=factors,
        financial_obligations=financial_obligations,
        duration_terms=duration_terms,
        cancellation_terms=cancellation_terms,
        recommended_actions=_build_recommended_actions(factors, risk_level),
    )

def build_preview_analysis(text: str) -> PreviewAnalysisResponse:
    # 1. Run deterministic regex
    factors, _, _ = analyze_text(text)
    
    # 2. Hand over to Claude for holistic extraction and merge
    return _build_claude_analysis(text, factors)
