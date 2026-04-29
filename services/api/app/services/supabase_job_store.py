from __future__ import annotations

from app.core.supabase import supabase
from app.schemas.jobs import (
    ContractJobResponse,
    ConversationMessage,
    FollowUpAllowance,
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
    ConfirmPaymentRequest,
    FollowUpRequest,
    FollowUpResponse
)
from app.services.job_store import (
    DisclaimerRequiredError,
    InvalidJobTransition,
    JobNotFoundError,
    PaymentRequiredError,
    _build_payment_quote,
    _job_needs_attention,
)
from app.services.follow_up import build_follow_up_answer
from app.services.job_state_machine import InvalidJobTransitionError, ensure_transition
from app.services.risk_engine import build_preview_analysis

def _payment_note(payment_status: PaymentStatus, checkout_url: str | None) -> str:
    if payment_status == PaymentStatus.paid:
        return "Payment confirmed."
    if checkout_url and "paystack" in checkout_url:
        return "Checkout initialized. Send the user to Paystack to complete payment."
    return "Preview checkout placeholder. Replace this with a real pricing service and Paystack session before launch."

class SupabaseJobStore:
    def create_job(self, payload: PreviewIntakeRequest) -> ContractJobResponse:
        if not payload.disclaimer_accepted:
            raise DisclaimerRequiredError("Users must accept the legal disclaimer before starting analysis.")

        # 1. Insert into jobs table
        job_res = supabase.table("jobs").insert({
            "status": JobStatus.pending.value,
            "input_type": payload.input_type.value,
            "market": payload.market.value,
            "disclaimer_accepted": payload.disclaimer_accepted,
            "text": payload.text,
            "source_name": payload.source_name,
            "customer_email": payload.customer_email
        }).execute()
        
        job_data = job_res.data[0]
        job_id = job_data["id"]

        # 2. Setup mock payment for now (until Phase 3 Paystack integration)
        quote = _build_payment_quote(payload.market)
        
        supabase.table("payments").insert({
            "job_id": job_id,
            "reference": quote.payment_reference,
            "status": quote.payment_status.value,
            "amount": quote.display_amount,
            "checkout_url": quote.checkout_url
        }).execute()

        # 3. Setup conversation for follow-ups
        supabase.table("conversations").insert({
            "job_id": job_id,
            "free_limit": 3,
            "questions_used": 0
        }).execute()

        return self.get_job(job_id)

    def get_job(self, job_id: str) -> ContractJobResponse:
        job_res = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not job_res.data:
            raise JobNotFoundError(job_id)
        job_data = job_res.data[0]

        payment_res = supabase.table("payments").select("*").eq("job_id", job_id).execute()
        payment_data = payment_res.data[0]

        conv_res = supabase.table("conversations").select("*").eq("job_id", job_id).execute()
        conv_data = conv_res.data[0]

        messages_res = supabase.table("messages").select("*").eq("conversation_id", conv_data["id"]).order("timestamp").execute()

        analysis_data = job_data.get("analysis_data")
        analysis = PreviewAnalysisResponse(**analysis_data) if analysis_data else None

        payment = PaymentQuote(
            payment_status=PaymentStatus(payment_data["status"]),
            payment_reference=payment_data["reference"],
            checkout_url=payment_data["checkout_url"],
            display_amount=payment_data["amount"],
            note=_payment_note(PaymentStatus(payment_data["status"]), payment_data.get("checkout_url")),
        )

        follow_up = FollowUpAllowance(
            free_limit=conv_data["free_limit"],
            questions_used=conv_data["questions_used"],
            questions_remaining=max(conv_data["free_limit"] - conv_data["questions_used"], 0)
        )

        conversation = [
            ConversationMessage(
                role=MessageRole(msg["role"]),
                content=msg["content"],
                timestamp=msg["timestamp"]
            ) for msg in messages_res.data
        ]

        return ContractJobResponse(
            job_id=job_data["id"],
            status=JobStatus(job_data["status"]),
            input_type=InputType(job_data["input_type"]),
            market=Market(job_data["market"]),
            source_name=job_data["source_name"],
            customer_email=job_data["customer_email"],
            disclaimer_accepted=job_data["disclaimer_accepted"],
            payment=payment,
            analysis=analysis,
            conversation=conversation,
            follow_up=follow_up,
            escalation_recommended=bool(analysis and analysis.risk_level == RiskClassification.high),
            created_at=job_data["created_at"],
            updated_at=job_data["updated_at"]
        )

    def list_jobs(
        self,
        *,
        status: JobStatus | None = None,
        payment_status: PaymentStatus | None = None,
        market: Market | None = None,
        limit: int = 20,
    ) -> list[ContractJobResponse]:
        query = supabase.table("jobs").select("id").order("created_at", desc=True)
        if status is not None:
            query = query.eq("status", status.value)
        if market is not None:
            query = query.eq("market", market.value)

        if payment_status is None:
            jobs_res = query.limit(limit).execute()
            if not jobs_res.data:
                return []

            return [self.get_job(item["id"]) for item in jobs_res.data]

        jobs_res = query.execute()
        if not jobs_res.data:
            return []

        filtered_jobs: list[ContractJobResponse] = []
        for item in jobs_res.data:
            job = self.get_job(item["id"])
            if job.payment.payment_status == payment_status:
                filtered_jobs.append(job)
            if len(filtered_jobs) >= limit:
                break

        return filtered_jobs

    def get_job_metrics(
        self,
        *,
        status: JobStatus | None = None,
        payment_status: PaymentStatus | None = None,
        market: Market | None = None,
    ) -> JobMetricsResponse:
        query = supabase.table("jobs").select("id,status,market,analysis_data")
        if status is not None:
            query = query.eq("status", status.value)
        if market is not None:
            query = query.eq("market", market.value)

        jobs_res = query.execute()
        job_rows = jobs_res.data or []
        if not job_rows:
            return JobMetricsResponse()

        job_ids = [row["id"] for row in job_rows]
        payments_res = supabase.table("payments").select("job_id,status").in_("job_id", job_ids).execute()
        payment_by_job_id = {
            row["job_id"]: PaymentStatus(row["status"])
            for row in payments_res.data or []
        }

        status_counts = {job_status.value: 0 for job_status in JobStatus}
        payment_counts = {payment_state.value: 0 for payment_state in PaymentStatus}
        market_counts = {market_name.value: 0 for market_name in Market}
        risk_counts = {risk_level.value: 0 for risk_level in RiskClassification}
        total_jobs = 0
        attention_jobs = 0
        analysis_ready_jobs = 0
        payment_queue_jobs = 0
        retry_queue_jobs = 0

        for row in job_rows:
            row_payment_status = payment_by_job_id.get(row["id"], PaymentStatus.unpaid)
            if payment_status is not None and row_payment_status != payment_status:
                continue

            row_status = JobStatus(row["status"])
            row_market = Market(row["market"])
            total_jobs += 1
            status_counts[row_status.value] += 1
            payment_counts[row_payment_status.value] += 1
            market_counts[row_market.value] += 1

            if _job_needs_attention(row_status, row_payment_status):
                attention_jobs += 1
            if row_payment_status == PaymentStatus.unpaid and row_status in {JobStatus.pending, JobStatus.payment_pending}:
                payment_queue_jobs += 1
            if row_payment_status == PaymentStatus.paid and row_status == JobStatus.failed:
                retry_queue_jobs += 1

            analysis_data = row.get("analysis_data") or {}
            risk_level = analysis_data.get("risk_level")
            if risk_level:
                analysis_ready_jobs += 1
                risk_counts[risk_level] += 1

        return JobMetricsResponse(
            total_jobs=total_jobs,
            attention_jobs=attention_jobs,
            analysis_ready_jobs=analysis_ready_jobs,
            payment_queue_jobs=payment_queue_jobs,
            retry_queue_jobs=retry_queue_jobs,
            statuses=JobStatusCounts(**status_counts),
            payments=PaymentStatusCounts(**payment_counts),
            markets=MarketCounts(**market_counts),
            risks=RiskLevelCounts(**risk_counts),
        )

    def confirm_payment(self, job_id: str, payload: ConfirmPaymentRequest) -> ContractJobResponse:
        job = self.get_job(job_id)
        if job.status == JobStatus.completed:
            return job

        self._ensure_transition(job.status, JobStatus.processing)

        # Update payment
        payment_updates: dict[str, str] = {"status": PaymentStatus.paid.value}
        if payload.payment_reference:
            payment_updates["reference"] = payload.payment_reference
        supabase.table("payments").update(payment_updates).eq("job_id", job_id).execute()

        # Update job status
        supabase.table("jobs").update({"status": JobStatus.processing.value}).eq("id", job_id).execute()
        return self.get_job(job_id)

    def update_checkout(
        self,
        job_id: str,
        *,
        customer_email: str | None = None,
        payment_reference: str | None = None,
        checkout_url: str | None = None,
        note: str | None = None,
    ) -> ContractJobResponse:
        payment_updates: dict[str, str] = {}
        job_updates: dict[str, str] = {}

        if customer_email:
            job_updates["customer_email"] = customer_email
        if payment_reference:
            payment_updates["reference"] = payment_reference
        if checkout_url:
            payment_updates["checkout_url"] = checkout_url
        current_job = self.get_job(job_id)
        if current_job.status == JobStatus.pending:
            self._ensure_transition(current_job.status, JobStatus.payment_pending)
            job_updates["status"] = JobStatus.payment_pending.value

        if job_updates:
            supabase.table("jobs").update(job_updates).eq("id", job_id).execute()
        if payment_updates:
            supabase.table("payments").update(payment_updates).eq("job_id", job_id).execute()

        response = self.get_job(job_id)
        if note:
            response.payment.note = note
        return response

    def process_job(self, job_id: str) -> ContractJobResponse:
        job = self.get_job(job_id)
        if job.status == JobStatus.completed:
            return job
        if job.payment.payment_status != PaymentStatus.paid:
            raise PaymentRequiredError("Payment must be confirmed before processing can begin.")

        self._ensure_transition(job.status, JobStatus.processing)
        supabase.table("jobs").update({"status": JobStatus.processing.value}).eq("id", job_id).execute()

        try:
            job_res = supabase.table("jobs").select("text").eq("id", job_id).execute()
            text = job_res.data[0]["text"]
            analysis = build_preview_analysis(text)
        except Exception as exc:
            supabase.table("jobs").update({"status": JobStatus.failed.value}).eq("id", job_id).execute()
            raise exc

        supabase.table("jobs").update({
            "status": JobStatus.completed.value,
            "analysis_data": analysis.model_dump()
        }).eq("id", job_id).execute()

        return self.get_job(job_id)

    def retry_job(self, job_id: str) -> ContractJobResponse:
        job = self.get_job(job_id)
        if job.status != JobStatus.failed:
            raise InvalidJobTransition("Only failed jobs can be retried.")
        if job.payment.payment_status != PaymentStatus.paid:
            raise PaymentRequiredError("Payment must be confirmed before a failed job can be retried.")

        self._ensure_transition(job.status, JobStatus.processing)
        supabase.table("jobs").update({
            "status": JobStatus.processing.value,
            "analysis_data": None,
        }).eq("id", job_id).execute()
        return self.get_job(job_id)

    def find_job_id_by_payment_reference(self, payment_reference: str) -> str | None:
        payment_res = supabase.table("payments").select("job_id").eq("reference", payment_reference).execute()
        if not payment_res.data:
            return None
        return payment_res.data[0]["job_id"]

    def ask_follow_up(self, job_id: str, payload: FollowUpRequest) -> FollowUpResponse:
        job = self.get_job(job_id)
        if (
            job.payment.payment_status != PaymentStatus.paid
            or not job.analysis
            or job.status != JobStatus.completed
        ):
            raise PaymentRequiredError("Payment must be confirmed before follow-up questions are available.")

        if job.follow_up.questions_used >= job.follow_up.free_limit:
            return FollowUpResponse(
                job_id=job_id,
                answer="You have used the 3 free follow-up questions for this contract. Save the summary or prepare for the subscription upgrade flow before continuing.",
                follow_up=job.follow_up,
                conversation=job.conversation,
                upgrade_required=True,
                suggested_next_step="Prompt the user to subscribe for unlimited follow-up questions.",
            )

        # Get conversation
        conv_res = supabase.table("conversations").select("id").eq("job_id", job_id).execute()
        conv_id = conv_res.data[0]["id"]

        # User msg
        supabase.table("messages").insert({
            "conversation_id": conv_id,
            "role": MessageRole.user.value,
            "content": payload.question
        }).execute()

        # AI Answer
        answer, suggested_next_step = build_follow_up_answer(job.analysis, payload.question)

        # Assistant msg
        supabase.table("messages").insert({
            "conversation_id": conv_id,
            "role": MessageRole.assistant.value,
            "content": answer
        }).execute()

        # Update stats
        supabase.table("conversations").update({
            "questions_used": job.follow_up.questions_used + 1
        }).eq("id", conv_id).execute()

        # Re-fetch
        updated_job = self.get_job(job_id)

        return FollowUpResponse(
            job_id=job_id,
            answer=answer,
            follow_up=updated_job.follow_up,
            conversation=updated_job.conversation,
            upgrade_required=False,
            suggested_next_step=suggested_next_step,
        )

    def _ensure_transition(self, current: JobStatus, target: JobStatus) -> None:
        try:
            ensure_transition(current, target)
        except InvalidJobTransitionError as exc:
            raise InvalidJobTransition(str(exc)) from exc

supabase_job_store = SupabaseJobStore()
