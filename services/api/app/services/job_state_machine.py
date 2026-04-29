from __future__ import annotations

from app.schemas.jobs import JobStatus


class InvalidJobTransitionError(ValueError):
    """Raised when a job attempts an invalid state transition."""


ALLOWED_TRANSITIONS: dict[JobStatus, set[JobStatus]] = {
    JobStatus.pending: {JobStatus.payment_pending, JobStatus.processing, JobStatus.failed},
    JobStatus.payment_pending: {JobStatus.processing, JobStatus.failed},
    JobStatus.processing: {JobStatus.completed, JobStatus.failed},
    JobStatus.completed: set(),
    JobStatus.failed: {JobStatus.processing},
}


def ensure_transition(current: JobStatus, target: JobStatus) -> None:
    if current == target:
        return
    if target not in ALLOWED_TRANSITIONS.get(current, set()):
        raise InvalidJobTransitionError(
            f"Cannot transition job from '{current.value}' to '{target.value}'."
        )
