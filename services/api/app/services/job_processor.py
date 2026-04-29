from __future__ import annotations


def run_job_processing(store, job_id: str) -> None:
    try:
        store.process_job(job_id)
    except Exception:
        # Background processing errors are reflected in store state where supported.
        # Logging/alerting will be layered in the observability slice.
        return
