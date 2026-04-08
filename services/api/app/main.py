from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.webhooks import router as webhooks_router

app = FastAPI(
    title="Cheka API",
    version="0.1.0",
    description="Backend services for Cheka contract intake, analysis, and follow-up.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/api/v1")
