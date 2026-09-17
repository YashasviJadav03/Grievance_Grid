from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.department import Department
from app.core.state_machine import ComplaintStatus, transition_complaint


def run_sla_scan(db: Session) -> dict:
    """
    Scans all open grievances (ROUTED, IN_PROGRESS).
    Flags complaints nearing deadline as 'At Risk' (Amber).
    Auto-escalates any complaints past deadline (Red) to ESCALATED status,
    reassigns to supervisor queue, and appends to the immutable StatusLog audit trail.
    """
    now = datetime.utcnow()

    # Query all active non-terminal complaints
    active_complaints = db.query(Complaint).filter(
        Complaint.status.in_([ComplaintStatus.ROUTED, ComplaintStatus.IN_PROGRESS])
    ).all()

    total_scanned = len(active_complaints)
    at_risk_count = 0
    escalated_count = 0
    escalated_ids = []

    for complaint in active_complaints:
        if not complaint.sla_deadline:
            continue

        total_sla_seconds = (complaint.sla_deadline - complaint.created_at).total_seconds()
        if total_sla_seconds <= 0:
            total_sla_seconds = 1

        elapsed_seconds = (now - complaint.created_at).total_seconds()
        ratio = elapsed_seconds / total_sla_seconds

        # Check for SLA Breach
        if now >= complaint.sla_deadline:
            escalated_count += 1
            escalated_ids.append(complaint.tracking_id)

            dept = db.query(Department).filter(Department.id == complaint.department_id).first()
            dept_code = dept.code if dept else "GENERAL"
            supervisor_queue = f"SUPERVISOR_QUEUE_{dept_code}"

            # Auto-escalation state machine transition
            complaint.priority = "CRITICAL"
            complaint.assigned_to = supervisor_queue

            transition_complaint(
                db=db,
                complaint=complaint,
                target_status=ComplaintStatus.ESCALATED,
                actor="SYSTEM_SLA_ENGINE",
                reason=f"SLA deadline breached ({complaint.sla_deadline.strftime('%Y-%m-%d %H:%M:%S UTC')}). "
                       f"Auto-escalated to {supervisor_queue} with CRITICAL priority."
            )
        elif ratio >= 0.75:
            at_risk_count += 1

    return {
        "timestamp": now.isoformat(),
        "scanned_count": total_scanned,
        "at_risk_count": at_risk_count,
        "escalated_count": escalated_count,
        "escalated_tracking_ids": escalated_ids
    }
