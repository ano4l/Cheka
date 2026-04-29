from __future__ import annotations

from app.core.config import settings
from app.services.job_store import preview_job_store
from app.services.supabase_job_store import supabase_job_store


def _has_live_supabase_config() -> bool:
    return (
        bool(settings.SUPABASE_URL)
        and "localhost:54321" not in settings.SUPABASE_URL
        and bool(settings.SUPABASE_KEY)
        and settings.SUPABASE_KEY != "eyJh..."
    )


def get_job_store():
    backend = settings.JOB_STORE_BACKEND.strip().lower()
    if backend == "memory":
        return preview_job_store
    if backend == "supabase":
        return supabase_job_store
    return supabase_job_store if _has_live_supabase_config() else preview_job_store
