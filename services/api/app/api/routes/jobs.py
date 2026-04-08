from fastapi import APIRouter, HTTPException, status

from app.schemas.jobs import (
    ConfirmPaymentRequest,
    ContractJobResponse,
    FollowUpRequest,
    FollowUpResponse,
    PreviewAnalysisRequest,
    PreviewAnalysisResponse,
    PreviewIntakeRequest,
)
from app.services.job_store import (
    DisclaimerRequiredError,
    JobNotFoundError,
    PaymentRequiredError,
    preview_job_store,
)
from app.services.risk_engine import build_preview_analysis

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/analyze-preview", response_model=PreviewAnalysisResponse)
def analyze_preview(payload: PreviewAnalysisRequest) -> PreviewAnalysisResponse:
    return build_preview_analysis(payload.text)


@router.post("/preview-intake", response_model=ContractJobResponse, status_code=status.HTTP_201_CREATED)
def create_preview_job(payload: PreviewIntakeRequest) -> ContractJobResponse:
    try:
        return preview_job_store.create_job(payload)
    except DisclaimerRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{job_id}", response_model=ContractJobResponse)
def get_job(job_id: str) -> ContractJobResponse:
    try:
        return preview_job_store.get_job(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc


@router.post("/{job_id}/confirm-payment", response_model=ContractJobResponse)
def confirm_payment(job_id: str, payload: ConfirmPaymentRequest) -> ContractJobResponse:
    try:
        return preview_job_store.confirm_payment(job_id, payload)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc


@router.post("/{job_id}/follow-up", response_model=FollowUpResponse)
def ask_follow_up(job_id: str, payload: FollowUpRequest) -> FollowUpResponse:
    try:
        return preview_job_store.ask_follow_up(job_id, payload)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.") from exc
    except PaymentRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
