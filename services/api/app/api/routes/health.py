from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.jobs import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="cheka-api",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

