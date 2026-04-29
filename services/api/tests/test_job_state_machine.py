import pytest

from app.schemas.jobs import JobStatus
from app.services.job_state_machine import InvalidJobTransitionError, ensure_transition


def test_state_machine_allows_expected_progression() -> None:
    ensure_transition(JobStatus.pending, JobStatus.payment_pending)
    ensure_transition(JobStatus.payment_pending, JobStatus.processing)
    ensure_transition(JobStatus.processing, JobStatus.completed)


def test_state_machine_rejects_invalid_transition() -> None:
    with pytest.raises(InvalidJobTransitionError):
        ensure_transition(JobStatus.pending, JobStatus.completed)
