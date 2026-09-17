from typing import Set, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.status_log import StatusLog


class ComplaintStatus:
    SUBMITTED = "SUBMITTED"
    CLASSIFIED = "CLASSIFIED"
    ROUTED = "ROUTED"
    IN_PROGRESS = "IN_PROGRESS"
    ESCALATED = "ESCALATED"
    REASSIGNED = "REASSIGNED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


# Allowed state transitions graph
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    ComplaintStatus.SUBMITTED: {ComplaintStatus.CLASSIFIED, ComplaintStatus.ROUTED},
    ComplaintStatus.CLASSIFIED: {ComplaintStatus.ROUTED},
    ComplaintStatus.ROUTED: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.ESCALATED},
    ComplaintStatus.IN_PROGRESS: {ComplaintStatus.RESOLVED, ComplaintStatus.ESCALATED},
    ComplaintStatus.ESCALATED: {ComplaintStatus.REASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED},
    ComplaintStatus.REASSIGNED: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED},
    ComplaintStatus.RESOLVED: {ComplaintStatus.CLOSED, ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.CLOSED: set(),  # Terminal state
}


def can_transition(current_status: str, target_status: str) -> bool:
    if current_status == target_status:
        return True
    return target_status in VALID_TRANSITIONS.get(current_status, set())


def transition_complaint(
    db: Session,
    complaint: Complaint,
    target_status: str,
    actor: str,
    reason: Optional[str] = None
) -> Complaint:
    """
    Validates and executes a state transition, automatically recording
    an immutable entry in StatusLog for the audit trail.
    """
    current_status = complaint.status
    if not can_transition(current_status, target_status):
        raise ValueError(
            f"Invalid state transition from '{current_status}' to '{target_status}'. "
            f"Allowed transitions: {list(VALID_TRANSITIONS.get(current_status, []))}"
        )

    complaint.status = target_status
    complaint.updated_at = datetime.utcnow()

    if target_status == ComplaintStatus.RESOLVED:
        complaint.resolved_at = datetime.utcnow()
    elif target_status == ComplaintStatus.ESCALATED:
        complaint.is_breached = True
        complaint.breached_at = complaint.breached_at or datetime.utcnow()

    # Append immutable audit trail
    log_entry = StatusLog(
        complaint_id=complaint.id,
        from_status=current_status,
        to_status=target_status,
        changed_by=actor,
        reason=reason,
        created_at=datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()
    db.refresh(complaint)
    return complaint
