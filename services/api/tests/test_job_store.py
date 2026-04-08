from app.schemas.jobs import ConfirmPaymentRequest, FollowUpRequest, Market, PaymentStatus, PreviewIntakeRequest
from app.services.job_store import DisclaimerRequiredError, PreviewJobStore


def test_create_job_requires_disclaimer() -> None:
    store = PreviewJobStore()

    payload = PreviewIntakeRequest(
        input_type="pdf",
        market=Market.south_africa,
        text="This agreement renews automatically each year and requires written notice to cancel early.",
        disclaimer_accepted=False,
    )

    try:
        store.create_job(payload)
    except DisclaimerRequiredError:
        assert True
    else:
        assert False, "Expected disclaimer requirement to be enforced."


def test_confirm_payment_unlocks_analysis() -> None:
    store = PreviewJobStore()
    job = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.kenya,
            text=(
                "This subscription renews automatically unless cancelled in writing. "
                "A termination fee applies if you leave within twelve months."
            ),
            disclaimer_accepted=True,
        )
    )

    completed = store.confirm_payment(job.job_id, ConfirmPaymentRequest())

    assert completed.payment.payment_status == PaymentStatus.paid
    assert completed.analysis is not None
    assert completed.analysis.risk_score > 0


def test_follow_up_limit_is_capped_at_three_free_questions() -> None:
    store = PreviewJobStore()
    job = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.south_africa,
            text=(
                "This lease renews automatically unless terminated in writing. "
                "Utilities are billed separately and there is a fixed term of twelve months."
            ),
            disclaimer_accepted=True,
        )
    )
    store.confirm_payment(job.job_id, ConfirmPaymentRequest())

    for _ in range(3):
        response = store.ask_follow_up(job.job_id, FollowUpRequest(question="Can I cancel early?"))
        assert response.upgrade_required is False

    capped = store.ask_follow_up(job.job_id, FollowUpRequest(question="What about fees?"))

    assert capped.upgrade_required is True
    assert capped.follow_up.questions_remaining == 0
