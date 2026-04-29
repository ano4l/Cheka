from app.schemas.jobs import ConfirmPaymentRequest, FollowUpRequest, JobStatus, Market, PaymentStatus, PreviewIntakeRequest
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


def test_confirm_payment_moves_job_into_processing_then_completion() -> None:
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

    processing = store.confirm_payment(job.job_id, ConfirmPaymentRequest())
    completed = store.process_job(job.job_id)

    assert processing.payment.payment_status == PaymentStatus.paid
    assert processing.status == JobStatus.processing
    assert processing.analysis is None
    assert completed.status == JobStatus.completed
    assert completed.analysis is not None
    assert completed.analysis.risk_score > 0


def test_checkout_initialization_moves_job_to_payment_pending() -> None:
    store = PreviewJobStore()
    job = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.south_africa,
            text="This agreement renews automatically each year and requires written notice to cancel early.",
            disclaimer_accepted=True,
        )
    )

    updated = store.update_checkout(
        job.job_id,
        customer_email="test@example.com",
        checkout_url="https://paystack.example/checkout/test",
    )

    assert updated.status == JobStatus.payment_pending
    assert updated.customer_email == "test@example.com"
    assert updated.payment.checkout_url == "https://paystack.example/checkout/test"


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
    store.process_job(job.job_id)

    for _ in range(3):
        response = store.ask_follow_up(job.job_id, FollowUpRequest(question="Can I cancel early?"))
        assert response.upgrade_required is False

    capped = store.ask_follow_up(job.job_id, FollowUpRequest(question="What about fees?"))

    assert capped.upgrade_required is True
    assert capped.follow_up.questions_remaining == 0


def test_process_failure_moves_job_to_failed_and_retry_requeues(monkeypatch) -> None:
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

    def explode(_: str):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.services.job_store.build_preview_analysis", explode)

    try:
        store.process_job(job.job_id)
    except RuntimeError:
        pass
    else:
        assert False, "Expected processing failure."

    failed = store.get_job(job.job_id)
    assert failed.status == JobStatus.failed

    monkeypatch.undo()
    retried = store.retry_job(job.job_id)

    assert retried.status == JobStatus.processing
    completed = store.process_job(job.job_id)
    assert completed.status == JobStatus.completed


def test_list_jobs_supports_status_filtering() -> None:
    store = PreviewJobStore()
    pending = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.south_africa,
            text="This agreement renews automatically each year and requires written notice to cancel early.",
            disclaimer_accepted=True,
        )
    )
    second = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.kenya,
            text="This subscription renews automatically unless cancelled in writing and includes a termination fee.",
            disclaimer_accepted=True,
        )
    )
    store.confirm_payment(second.job_id, ConfirmPaymentRequest())

    pending_jobs = store.list_jobs(status=JobStatus.pending)
    processing_jobs = store.list_jobs(status=JobStatus.processing)

    assert {job.job_id for job in pending_jobs} == {pending.job_id}
    assert {job.job_id for job in processing_jobs} == {second.job_id}


def test_list_jobs_supports_payment_status_and_market_filtering() -> None:
    store = PreviewJobStore()
    unpaid_kenya = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.kenya,
            text="This service contract renews automatically and requires one month of written notice to cancel.",
            disclaimer_accepted=True,
        )
    )
    paid_kenya = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.kenya,
            text="This subscription includes an early termination charge and renews annually unless cancelled in writing.",
            disclaimer_accepted=True,
        )
    )
    paid_sa = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.south_africa,
            text="This lease has a fixed term, utilities billed separately, and a penalty if the agreement ends early.",
            disclaimer_accepted=True,
        )
    )

    store.confirm_payment(paid_kenya.job_id, ConfirmPaymentRequest())
    store.confirm_payment(paid_sa.job_id, ConfirmPaymentRequest())

    paid_jobs = store.list_jobs(payment_status=PaymentStatus.paid)
    kenya_paid_jobs = store.list_jobs(payment_status=PaymentStatus.paid, market=Market.kenya)

    assert {job.job_id for job in paid_jobs} == {paid_kenya.job_id, paid_sa.job_id}
    assert {job.job_id for job in kenya_paid_jobs} == {paid_kenya.job_id}
    assert unpaid_kenya.job_id not in {job.job_id for job in kenya_paid_jobs}


def test_job_metrics_capture_attention_payment_and_risk_mix(monkeypatch) -> None:
    store = PreviewJobStore()
    payment_queue = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.south_africa,
            text="This agreement renews automatically each year and requires written notice to cancel early.",
            disclaimer_accepted=True,
        )
    )
    retry_queue = store.create_job(
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
    completed = store.create_job(
        PreviewIntakeRequest(
            input_type="pdf",
            market=Market.south_africa,
            text=(
                "This service agreement allows termination on fourteen days written notice. "
                "Fees are limited to the approved quote and there is no automatic renewal."
            ),
            disclaimer_accepted=True,
        )
    )

    store.update_checkout(
        payment_queue.job_id,
        customer_email="queue@example.com",
        checkout_url="https://paystack.example/checkout/queue",
    )
    store.confirm_payment(retry_queue.job_id, ConfirmPaymentRequest())

    def explode(_: str):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.services.job_store.build_preview_analysis", explode)
    try:
        store.process_job(retry_queue.job_id)
    except RuntimeError:
        pass
    else:
        assert False, "Expected processing failure."

    monkeypatch.undo()
    store.confirm_payment(completed.job_id, ConfirmPaymentRequest())
    store.process_job(completed.job_id)

    metrics = store.get_job_metrics()
    kenya_metrics = store.get_job_metrics(market=Market.kenya)

    assert metrics.total_jobs == 3
    assert metrics.attention_jobs == 2
    assert metrics.analysis_ready_jobs == 1
    assert metrics.payment_queue_jobs == 1
    assert metrics.retry_queue_jobs == 1
    assert metrics.statuses.payment_pending == 1
    assert metrics.statuses.failed == 1
    assert metrics.statuses.completed == 1
    assert metrics.payments.unpaid == 1
    assert metrics.payments.paid == 2
    assert metrics.markets.south_africa == 2
    assert metrics.markets.kenya == 1
    assert metrics.risks.low == 1
    assert metrics.risks.medium == 0
    assert metrics.risks.high == 0

    assert kenya_metrics.total_jobs == 1
    assert kenya_metrics.retry_queue_jobs == 1
    assert kenya_metrics.statuses.failed == 1
