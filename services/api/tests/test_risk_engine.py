from app.schemas.jobs import RiskClassification
from app.services.risk_engine import analyze_text, build_preview_analysis


def test_analyze_text_detects_multiple_high_risk_clauses() -> None:
    text = (
        "This agreement will automatically renew each year unless cancelled in writing. "
        "A penalty for early cancellation will apply. "
        "The employee accepts a non-compete obligation for twelve months after termination. "
        "Any dispute will be resolved by binding arbitration."
    )

    factors, score, risk_level = analyze_text(text)

    assert score >= 60
    assert risk_level == RiskClassification.high
    assert {factor.key for factor in factors} >= {
        "auto_renewal",
        "cancellation_penalty",
        "non_compete",
        "arbitration",
    }


def test_analyze_text_caps_score_at_one_hundred() -> None:
    text = (
        "The contract renews automatically and includes a termination fee. "
        "Additional fees may be billed separately. "
        "The worker agrees to a non-compete and a fixed term of twenty four months. "
        "The customer shall indemnify the provider and disputes go to binding arbitration."
    )

    _, score, _ = analyze_text(text)

    assert score == 100


def test_build_preview_analysis_returns_human_readable_output() -> None:
    text = (
        "This lease renews automatically unless you cancel in writing. "
        "Utilities are billed separately and the landlord is not liable for any loss. "
        "There is a fixed term of twelve months."
    )

    response = build_preview_analysis(text)

    assert response.risk_level == RiskClassification.high
    assert response.key_points
    assert response.red_flags
    assert "preview found signals" in response.summary.lower()
