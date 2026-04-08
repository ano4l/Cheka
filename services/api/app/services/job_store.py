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
    JobStatus,
    Market,
    MessageRole,
    PaymentQuote,
    PaymentStatus,
    PreviewAnalysisResponse,
    PreviewIntakeRequest,
    RiskClassification,
)
from app.services.follow_up import build_follow_up_answer
from app.services.risk_engine import build_preview_analysis


class DisclaimerRequiredError(ValueError):
    """Raised when a user tries to create a job without accepting the disclaimer."""


class JobNotFoundError(KeyError):
    """Raised when the job id is unknown."""


class PaymentRequiredError(RuntimeError):
    """Raised when a protected action happens before payment is confirmed."""


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
            status=JobStatus.payment_required,
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

    def confirm_payment(self, job_id: str, payload: ConfirmPaymentRequest) -> ContractJobResponse:
        with self._lock:
            record = self._get_record(job_id)
            if payload.payment_reference:
                record.payment.payment_reference = payload.payment_reference
            record.payment.payment_status = PaymentStatus.paid
            record.status = JobStatus.processing
            record.updated_at = _now()
            record.analysis = build_preview_analysis(record.text)
            record.status = JobStatus.complete
            record.updated_at = _now()
            return record.to_response()

    def ask_follow_up(self, job_id: str, payload: FollowUpRequest) -> FollowUpResponse:
        with self._lock:
            record = self._get_record(job_id)
            if record.payment.payment_status != PaymentStatus.paid or record.analysis is None:
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


preview_job_store = PreviewJobStore()
