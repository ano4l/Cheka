from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from app.schemas.jobs import (
    ConfirmPaymentRequest,
    ContractJobResponse,
    ConversationMessage,
    FollowUpAllowance,
    FollowUpRequest,
    FollowUpResponse,
    InputType,
    JobMetricsResponse,
    JobStatusCounts,
    JobStatus,
    MarketCounts,
    Market,
    MessageRole,
    PaymentStatusCounts,
    PaymentQuote,
    PaymentStatus,
    PreviewAnalysisResponse,
    PreviewIntakeRequest,
    RiskLevelCounts,
    RiskClassification,
)
from app.services.follow_up import build_follow_up_answer
from app.services.job_state_machine import InvalidJobTransitionError, ensure_transition
from app.services.risk_engine import build_preview_analysis


class DisclaimerRequiredError(ValueError):
    """Raised when a user tries to create a job without accepting the disclaimer."""


class JobNotFoundError(KeyError):
    """Raised when the job id is unknown."""


class PaymentRequiredError(RuntimeError):
    """Raised when a protected action happens before payment is confirmed."""


class InvalidJobTransition(ValueError):
    """Raised when a job is asked to move to an invalid state."""


@dataclass
class JobRecord:
    job_id: str
    input_type: InputType
    market: Market
    text: str
    disclaimer_accepted: bool
    source_name: str | None
    customer_email: str | None
    payment: PaymentQuote
    status: JobStatus
    created_at: str
    updated_at: str
    analysis: PreviewAnalysisResponse | None = None
    conversation: list[ConversationMessage] = field(default_factory=list)
    questions_used: int = 0
    free_limit: int = 3

    def to_response(self) -> ContractJobResponse:
        return ContractJobResponse(
            job_id=self.job_id,
            status=self.status,
            input_type=self.input_type,
            market=self.market,
            source_name=self.source_name,
            customer_email=self.customer_email,
            disclaimer_accepted=self.disclaimer_accepted,
            payment=self.payment,
            analysis=self.analysis,
            conversation=list(self.conversation),
            follow_up=self.follow_up_allowance,
            escalation_recommended=bool(self.analysis and self.analysis.risk_level == RiskClassification.high),
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @property
    def follow_up_allowance(self) -> FollowUpAllowance:
        remaining = max(self.free_limit - self.questions_used, 0)
        return FollowUpAllowance(
            free_limit=self.free_limit,
            questions_used=self.questions_used,
            questions_remaining=remaining,
        )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_payment_quote(market: Market) -> PaymentQuote:
    payment_reference = f"cheka-{market.value[:2]}-{uuid4().hex[:10]}"
    return PaymentQuote(
        payment_status=PaymentStatus.unpaid,
        payment_reference=payment_reference,
        checkout_url=f"https://paystack.example/checkout/{payment_reference}",
        display_amount="Market-based launch pricing",
        note="Preview checkout placeholder. Replace this with a real pricing service and Paystack session before launch.",
    )


def _job_needs_attention(status: JobStatus, payment_status: PaymentStatus) -> bool:
    if status == JobStatus.failed:
        return True
    if payment_status == PaymentStatus.unpaid:
        return status in {JobStatus.pending, JobStatus.payment_pending}
    return status != JobStatus.completed


class PreviewJobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, JobRecord] = {}
        self._lock = Lock()

    def create_job(self, payload: PreviewIntakeRequest) -> ContractJobResponse:
        if not payload.disclaimer_accepted:
            raise DisclaimerRequiredError("Users must accept the legal disclaimer before starting analysis.")

        job_id = f"job_{uuid4().hex[:12]}"
        timestamp = _now()
        record = JobRecord(
            job_id=job_id,
            input_type=payload.input_type,
            market=payload.market,
            text=payload.text,
            disclaimer_accepted=payload.disclaimer_accepted,
            source_name=payload.source_name,
            customer_email=payload.customer_email,
            payment=_build_payment_quote(payload.market),
            status=JobStatus.pending,
            created_at=timestamp,
            updated_at=timestamp,
        )

        with self._lock:
            self._jobs[job_id] = record
            return record.to_response()

    def get_job(self, job_id: str) -> ContractJobResponse:
        with self._lock:
            record = self._get_record(job_id)
            return record.to_response()

    def _filtered_records(
        self,
        *,
        status: JobStatus | None = None,
        payment_status: PaymentStatus | None = None,
        market: Market | None = None,
    ) -> list[JobRecord]:
        records = list(self._jobs.values())
        if status is not None:
            records = [record for record in records if record.status == status]
        if payment_status is not None:
            records = [record for record in records if record.payment.payment_status == payment_status]
        if market is not None:
            records = [record for record in records if record.market == market]
        return records

    def list_jobs(
        self,
        *,
        status: JobStatus | None = None,
        payment_status: PaymentStatus | None = None,
        market: Market | None = None,
        limit: int = 20,
    ) -> list[ContractJobResponse]:
        with self._lock:
            records = self._filtered_records(
                status=status,
                payment_status=payment_status,
                market=market,
            )
            records.sort(key=lambda record: record.created_at, reverse=True)
            return [record.to_response() for record in records[:limit]]

    def get_job_metrics(
        self,
        *,
        status: JobStatus | None = None,
        payment_status: PaymentStatus | None = None,
        market: Market | None = None,
    ) -> JobMetricsResponse:
        with self._lock:
            records = self._filtered_records(
                status=status,
                payment_status=payment_status,
                market=market,
            )

            status_counts = {job_status.value: 0 for job_status in JobStatus}
            payment_counts = {payment_state.value: 0 for payment_state in PaymentStatus}
            market_counts = {market_name.value: 0 for market_name in Market}
            risk_counts = {risk_level.value: 0 for risk_level in RiskClassification}
            attention_jobs = 0
            analysis_ready_jobs = 0
            payment_queue_jobs = 0
            retry_queue_jobs = 0

            for record in records:
                status_counts[record.status.value] += 1
                payment_counts[record.payment.payment_status.value] += 1
                market_counts[record.market.value] += 1

                if _job_needs_attention(record.status, record.payment.payment_status):
                    attention_jobs += 1
                if record.analysis is not None:
                    analysis_ready_jobs += 1
                    risk_counts[record.analysis.risk_level.value] += 1
                if (
                    record.payment.payment_status == PaymentStatus.unpaid
                    and record.status in {JobStatus.pending, JobStatus.payment_pending}
                ):
                    payment_queue_jobs += 1
                if (
                    record.payment.payment_status == PaymentStatus.paid
                    and record.status == JobStatus.failed
                ):
                    retry_queue_jobs += 1

            return JobMetricsResponse(
                total_jobs=len(records),
                attention_jobs=attention_jobs,
                analysis_ready_jobs=analysis_ready_jobs,
                payment_queue_jobs=payment_queue_jobs,
                retry_queue_jobs=retry_queue_jobs,
                statuses=JobStatusCounts(**status_counts),
                payments=PaymentStatusCounts(**payment_counts),
                markets=MarketCounts(**market_counts),
                risks=RiskLevelCounts(**risk_counts),
            )

    def update_checkout(
        self,
        job_id: str,
        *,
        customer_email: str | None = None,
        payment_reference: str | None = None,
        checkout_url: str | None = None,
        note: str | None = None,
    ) -> ContractJobResponse:
        with self._lock:
            record = self._get_record(job_id)
            self._transition(record, JobStatus.payment_pending)
            if customer_email:
                record.customer_email = customer_email
            if payment_reference:
                record.payment.payment_reference = payment_reference
            if checkout_url:
                record.payment.checkout_url = checkout_url
            if note:
                record.payment.note = note
            record.updated_at = _now()
            return record.to_response()

    def confirm_payment(self, job_id: str, payload: ConfirmPaymentRequest) -> ContractJobResponse:
        with self._lock:
            record = self._get_record(job_id)
            if record.status == JobStatus.completed:
                return record.to_response()
            if payload.payment_reference:
                record.payment.payment_reference = payload.payment_reference
            record.payment.payment_status = PaymentStatus.paid
            self._transition(record, JobStatus.processing)
            record.updated_at = _now()
            return record.to_response()

    def process_job(self, job_id: str) -> ContractJobResponse:
        with self._lock:
            record = self._get_record(job_id)
            if record.status == JobStatus.completed:
                return record.to_response()
            if record.payment.payment_status != PaymentStatus.paid:
                raise PaymentRequiredError("Payment must be confirmed before processing can begin.")
            self._transition(record, JobStatus.processing)

        try:
            analysis = build_preview_analysis(record.text)
        except Exception as exc:
            with self._lock:
                record = self._get_record(job_id)
                self._transition(record, JobStatus.failed)
                record.updated_at = _now()
            raise exc

        with self._lock:
            record = self._get_record(job_id)
            record.analysis = analysis
            self._transition(record, JobStatus.completed)
            record.updated_at = _now()
            return record.to_response()

    def retry_job(self, job_id: str) -> ContractJobResponse:
        with self._lock:
            record = self._get_record(job_id)
            if record.status != JobStatus.failed:
                raise InvalidJobTransition("Only failed jobs can be retried.")
            if record.payment.payment_status != PaymentStatus.paid:
                raise PaymentRequiredError("Payment must be confirmed before a failed job can be retried.")
            record.analysis = None
            self._transition(record, JobStatus.processing)
            record.updated_at = _now()
            return record.to_response()

    def find_job_id_by_payment_reference(self, payment_reference: str) -> str | None:
        with self._lock:
            for record in self._jobs.values():
                if record.payment.payment_reference == payment_reference:
                    return record.job_id
        return None

    def ask_follow_up(self, job_id: str, payload: FollowUpRequest) -> FollowUpResponse:
        with self._lock:
            record = self._get_record(job_id)
            if (
                record.payment.payment_status != PaymentStatus.paid
                or record.analysis is None
                or record.status != JobStatus.completed
            ):
                raise PaymentRequiredError("Payment must be confirmed before follow-up questions are available.")

            if record.questions_used >= record.free_limit:
                return FollowUpResponse(
                    job_id=record.job_id,
                    answer="You have used the 3 free follow-up questions for this contract. Save the summary or prepare for the subscription upgrade flow before continuing.",
                    follow_up=record.follow_up_allowance,
                    conversation=list(record.conversation),
                    upgrade_required=True,
                    suggested_next_step="Prompt the user to subscribe for unlimited follow-up questions.",
                )

            question_timestamp = _now()
            record.conversation.append(
                ConversationMessage(
                    role=MessageRole.user,
                    content=payload.question,
                    timestamp=question_timestamp,
                )
            )

            answer, suggested_next_step = build_follow_up_answer(record.analysis, payload.question)
            answer_timestamp = _now()
            record.conversation.append(
                ConversationMessage(
                    role=MessageRole.assistant,
                    content=answer,
                    timestamp=answer_timestamp,
                )
            )
            record.questions_used += 1
            record.updated_at = answer_timestamp

            return FollowUpResponse(
                job_id=record.job_id,
                answer=answer,
                follow_up=record.follow_up_allowance,
                conversation=list(record.conversation),
                upgrade_required=False,
                suggested_next_step=suggested_next_step,
            )

    def _get_record(self, job_id: str) -> JobRecord:
        try:
            return self._jobs[job_id]
        except KeyError as exc:
            raise JobNotFoundError(job_id) from exc

    def _transition(self, record: JobRecord, target: JobStatus) -> None:
        try:
            ensure_transition(record.status, target)
        except InvalidJobTransitionError as exc:
            raise InvalidJobTransition(str(exc)) from exc
        record.status = target


preview_job_store = PreviewJobStore()
