import httpx
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Query, UploadFile, status

from app.core.config import settings
from app.schemas.jobs import (
    CheckoutSessionRequest,
    ConfirmPaymentRequest,
    ContractJobResponse,
    FollowUpRequest,
    FollowUpResponse,
    JobMetricsResponse,
    JobStatus,
    Market,
    PaymentStatus,
    PreviewAnalysisRequest,
    PreviewAnalysisResponse,
    PreviewIntakeRequest,
    UrlIntakeRequest,
)
from app.services.intake import build_url_preview_request, extract_uploaded_text
from app.services.job_processor import run_job_processing
from app.services.job_store import DisclaimerRequiredError, InvalidJobTransition, JobNotFoundError, PaymentRequiredError
from app.services.job_store_selector import get_job_store
from app.services.paystack import paystack_service
from app.services.risk_engine import build_preview_analysis
from app.services.storage import storage_service

router = APIRouter(prefix="/jobs", tags=["jobs"])

try:
    import multipart  # type: ignore  # noqa: F401

    MULTIPART_AVAILABLE = True
except ImportError:  # pragma: no cover - depends on local env
    MULTIPART_AVAILABLE = False


def _job_store():
    return get_job_store()


def _checkout_note() -> str:
    if paystack_service.is_live:
        return "Checkout initialized with Paystack. Send the user to the checkout URL to complete payment."
    return "Paystack is not fully configured yet, so this checkout URL is a safe mock placeholder."


@router.post("/analyze-preview", response_model=PreviewAnalysisResponse)
def analyze_preview(payload: PreviewAnalysisRequest) -> PreviewAnalysisResponse:
    return build_preview_analysis(payload.text)


@router.post("/preview-intake", response_model=ContractJobResponse, status_code=status.HTTP_201_CREATED)
def create_preview_job(payload: PreviewIntakeRequest) -> ContractJobResponse:
    try:
        return _job_store().create_job(payload)
    except DisclaimerRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("", response_model=list[ContractJobResponse])
def list_jobs(
    status_filter: JobStatus | None = Query(default=None, alias="status"),
    payment_status_filter: PaymentStatus | None = Query(default=None, alias="payment_status"),
    market_filter: Market | None = Query(default=None, alias="market"),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[ContractJobResponse]:
    return _job_store().list_jobs(
        status=status_filter,
        payment_status=payment_status_filter,
        market=market_filter,
        limit=limit,
    )


@router.get("/metrics", response_model=JobMetricsResponse)
def get_job_metrics(
    status_filter: JobStatus | None = Query(default=None, alias="status"),
    payment_status_filter: PaymentStatus | None = Query(default=None, alias="payment_status"),
    market_filter: Market | None = Query(default=None, alias="market"),
) -> JobMetricsResponse:
    return _job_store().get_job_metrics(
        status=status_filter,
        payment_status=payment_status_filter,
        market=market_filter,
    )


@router.post("/intake-url", response_model=ContractJobResponse, status_code=status.HTTP_201_CREATED)
async def create_url_job(payload: UrlIntakeRequest) -> ContractJobResponse:
    try:
        preview_payload = await build_url_preview_request(payload)
        return _job_store().create_job(preview_payload)
    except DisclaimerRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Cheka could not fetch that URL right now.",
        ) from exc


if MULTIPART_AVAILABLE:
    @router.post("/intake-file", response_model=ContractJobResponse, status_code=status.HTTP_201_CREATED)
    async def create_file_job(
        file: UploadFile = File(...),
        market: Market = Form(default=Market.south_africa),
        source_name: str | None = Form(default=None),
        customer_email: str | None = Form(default=None),
        disclaimer_accepted: bool = Form(...),
    ) -> ContractJobResponse:
        file_bytes, extracted_text, input_type = await extract_uploaded_text(file)
        payload = PreviewIntakeRequest(
            input_type=input_type,
            market=market,
            text=extracted_text,
            source_name=source_name or file.filename,
            customer_email=customer_email,
            disclaimer_accepted=disclaimer_accepted,
        )

        try:
            job = _job_store().create_job(payload)
        except DisclaimerRequiredError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        if settings.ENABLE_STORAGE_UPLOADS:
            try:
                storage_service.upload_bytes(
                    file_bytes,
                    filename=file.filename or "upload.bin",
                    content_type=file.content_type,
                    user_id="anonymous",
                    job_id=job.job_id,
                )
            except Exception:
                # Best-effort upload for now; analysis should still proceed even if storage is unavailable.
                pass

        return job
else:
    @router.post("/intake-file", response_model=ContractJobResponse, status_code=status.HTTP_201_CREATED)
    async def create_file_job() -> ContractJobResponse:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File intake requires the API dependency 'python-multipart' to be installed.",
        )


@router.get("/{job_id}", response_model=ContractJobResponse)
def get_job(job_id: str) -> ContractJobResponse:
    try:
        return _job_store().get_job(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc


@router.post("/{job_id}/checkout-session", response_model=ContractJobResponse)
async def initialize_checkout(job_id: str, payload: CheckoutSessionRequest) -> ContractJobResponse:
    store = _job_store()
    try:
        job = store.get_job(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc

    customer_email = payload.customer_email or job.customer_email
    if not customer_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer email is required before checkout can be initialized.",
        )

    callback_url = payload.callback_url or settings.PAYSTACK_CALLBACK_URL or "http://localhost:3000"
    try:
        session = await paystack_service.initialize_transaction(
            customer_email,
            settings.PAYSTACK_DEFAULT_AMOUNT_KOBO,
            job.payment.payment_reference,
            callback_url,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Cheka could not initialize Paystack checkout right now.",
        ) from exc

    try:
        return store.update_checkout(
            job_id,
            customer_email=customer_email,
            payment_reference=session.get("reference"),
            checkout_url=session.get("authorization_url"),
            note=_checkout_note(),
        )
    except InvalidJobTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{job_id}/confirm-payment", response_model=ContractJobResponse)
def confirm_payment(
    job_id: str,
    payload: ConfirmPaymentRequest,
    background_tasks: BackgroundTasks,
) -> ContractJobResponse:
    store = _job_store()
    try:
        job = store.confirm_payment(job_id, payload)
        if job.status == "processing":
            background_tasks.add_task(run_job_processing, store, job_id)
        return job
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc
    except InvalidJobTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{job_id}/retry", response_model=ContractJobResponse)
def retry_job(job_id: str, background_tasks: BackgroundTasks) -> ContractJobResponse:
    store = _job_store()
    try:
        job = store.retry_job(job_id)
        background_tasks.add_task(run_job_processing, store, job_id)
        return job
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc
    except InvalidJobTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except PaymentRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{job_id}/follow-up", response_model=FollowUpResponse)
def ask_follow_up(job_id: str, payload: FollowUpRequest) -> FollowUpResponse:
    try:
        return _job_store().ask_follow_up(job_id, payload)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc
    except PaymentRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
