from enum import StrEnum

from pydantic import BaseModel, Field, HttpUrl


class InputType(StrEnum):
    pdf = "pdf"
    docx = "docx"
    image = "image"
    url = "url"


class Market(StrEnum):
    south_africa = "south_africa"
    kenya = "kenya"


class RiskClassification(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class JobStatus(StrEnum):
    pending = "pending"
    payment_pending = "payment_pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class PaymentStatus(StrEnum):
    unpaid = "unpaid"
    paid = "paid"


class MessageRole(StrEnum):
    user = "user"
    assistant = "assistant"


class RiskFactor(BaseModel):
    key: str
    label: str
    weight: int = Field(ge=0)
    evidence: str
    explanation: str


class PreviewAnalysisRequest(BaseModel):
    input_type: InputType
    text: str = Field(min_length=40, description="Normalized contract text.")
    source_name: str | None = Field(default=None, max_length=255)


class PreviewAnalysisResponse(BaseModel):
    contract_type: str
    summary: str
    key_points: list[str]
    red_flags: list[str]
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskClassification
    factors: list[RiskFactor]
    financial_obligations: list[str]
    duration_terms: list[str]
    cancellation_terms: list[str]
    recommended_actions: list[str]


class PreviewIntakeRequest(BaseModel):
    input_type: InputType
    market: Market = Market.south_africa
    text: str = Field(min_length=40, description="Normalized contract text.")
    source_name: str | None = Field(default=None, max_length=255)
    customer_email: str | None = Field(default=None, max_length=255)
    disclaimer_accepted: bool = Field(
        description="The user must acknowledge the legal disclaimer before results are delivered."
    )


class UrlIntakeRequest(BaseModel):
    url: HttpUrl
    market: Market = Market.south_africa
    source_name: str | None = Field(default=None, max_length=255)
    customer_email: str | None = Field(default=None, max_length=255)
    disclaimer_accepted: bool = Field(
        description="The user must acknowledge the legal disclaimer before results are delivered."
    )


class ConfirmPaymentRequest(BaseModel):
    payment_reference: str | None = Field(default=None, max_length=80)


class CheckoutSessionRequest(BaseModel):
    customer_email: str | None = Field(default=None, max_length=255)
    callback_url: str | None = Field(default=None, max_length=2048)


class FollowUpRequest(BaseModel):
    question: str = Field(min_length=4, max_length=400)


class PaymentQuote(BaseModel):
    provider: str = "paystack"
    payment_status: PaymentStatus
    payment_reference: str
    checkout_url: str
    display_amount: str
    note: str


class JobStatusCounts(BaseModel):
    pending: int = 0
    payment_pending: int = 0
    processing: int = 0
    completed: int = 0
    failed: int = 0


class PaymentStatusCounts(BaseModel):
    unpaid: int = 0
    paid: int = 0


class MarketCounts(BaseModel):
    south_africa: int = 0
    kenya: int = 0


class RiskLevelCounts(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0


class JobMetricsResponse(BaseModel):
    total_jobs: int = 0
    attention_jobs: int = 0
    analysis_ready_jobs: int = 0
    payment_queue_jobs: int = 0
    retry_queue_jobs: int = 0
    statuses: JobStatusCounts = Field(default_factory=JobStatusCounts)
    payments: PaymentStatusCounts = Field(default_factory=PaymentStatusCounts)
    markets: MarketCounts = Field(default_factory=MarketCounts)
    risks: RiskLevelCounts = Field(default_factory=RiskLevelCounts)


class ConversationMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: str


class FollowUpAllowance(BaseModel):
    free_limit: int = Field(default=3, ge=0)
    questions_used: int = Field(default=0, ge=0)
    questions_remaining: int = Field(default=3, ge=0)


class ContractJobResponse(BaseModel):
    job_id: str
    status: JobStatus
    input_type: InputType
    market: Market
    source_name: str | None = None
    customer_email: str | None = None
    disclaimer_accepted: bool
    payment: PaymentQuote
    analysis: PreviewAnalysisResponse | None = None
    conversation: list[ConversationMessage]
    follow_up: FollowUpAllowance
    escalation_recommended: bool = False
    created_at: str
    updated_at: str


class FollowUpResponse(BaseModel):
    job_id: str
    answer: str
    follow_up: FollowUpAllowance
    conversation: list[ConversationMessage]
    upgrade_required: bool = False
    suggested_next_step: str | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
