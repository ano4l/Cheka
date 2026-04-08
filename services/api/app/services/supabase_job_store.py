from __future__ import annotations

from datetime import datetime, timezone
import json

from app.core.supabase import supabase
from app.schemas.jobs import (
    ContractJobResponse,
    ConversationMessage,
    FollowUpAllowance,
    InputType,
    JobStatus,
    Market,
    MessageRole,
    PaymentQuote,
    PaymentStatus,
    PreviewAnalysisResponse,
    PreviewIntakeRequest,
    RiskClassification,
    ConfirmPaymentRequest,
    FollowUpRequest,
    FollowUpResponse
)
from app.services.job_store import (
    DisclaimerRequiredError,
    JobNotFoundError,
    PaymentRequiredError,
    _build_payment_quote,
)
from app.services.follow_up import build_follow_up_answer
from app.services.risk_engine import build_preview_analysis

class SupabaseJobStore:
    def create_job(self, payload: PreviewIntakeRequest) -> ContractJobResponse:
        if not payload.disclaimer_accepted:
            raise DisclaimerRequiredError("Users must accept the legal disclaimer before starting analysis.")

        # 1. Insert into jobs table
        job_res = supabase.table("jobs").insert({
            "status": JobStatus.payment_required.value,
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
            note=""
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

    def confirm_payment(self, job_id: str, payload: ConfirmPaymentRequest) -> ContractJobResponse:
        # Update payment
        supabase.table("payments").update({"status": PaymentStatus.paid.value}).eq("job_id", job_id).execute()

        # Update job status
        supabase.table("jobs").update({"status": JobStatus.processing.value}).eq("id", job_id).execute()

        # Run analysis (simulating extraction -> AI pipeline)
        job_res = supabase.table("jobs").select("text").eq("id", job_id).execute()
        text = job_res.data[0]["text"]
        
        analysis = build_preview_analysis(text)
        
        # Save analysis
        supabase.table("jobs").update({
            "status": JobStatus.complete.value,
            "analysis_data": analysis.model_dump()
        }).eq("id", job_id).execute()

        return self.get_job(job_id)

    def ask_follow_up(self, job_id: str, payload: FollowUpRequest) -> FollowUpResponse:
        job = self.get_job(job_id)
        if job.payment.payment_status != PaymentStatus.paid or not job.analysis:
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

supabase_job_store = SupabaseJobStore()
