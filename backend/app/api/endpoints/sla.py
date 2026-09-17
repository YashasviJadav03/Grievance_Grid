from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.db.session import get_db
from app.services.sla_engine import run_sla_scan
from app.models.complaint import Complaint
from app.models.status_log import StatusLog

router = APIRouter()


class BackdateSimulateRequest(BaseModel):
    tracking_id: str
    hours_back: int = 24


@router.post("/scan")
def trigger_sla_scan(db: Session = Depends(get_db)):
    """
    Manually triggers the background SLA escalation scan across all active complaints.
    Identifies at-risk items and auto-escalates breached items.
    """
    summary = run_sla_scan(db)
    return {
        "message": "SLA sweep completed successfully",
        "result": summary
    }


@router.post("/simulate-backdate")
def simulate_backdate_complaint(payload: BackdateSimulateRequest, db: Session = Depends(get_db)):
    """
    Simulation utility for testing and demos:
    Backdates a complaint's creation and SLA deadline by `hours_back` hours
    to immediately test SLA breach and auto-escalation behavior.
    """
    complaint = db.query(Complaint).filter(Complaint.tracking_id == payload.tracking_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint '{payload.tracking_id}' not found")

    shift = timedelta(hours=payload.hours_back)
    complaint.created_at = complaint.created_at - shift
    if complaint.sla_deadline:
        complaint.sla_deadline = complaint.sla_deadline - shift

    db.add(StatusLog(
        complaint_id=complaint.id,
        from_status=complaint.status,
        to_status=complaint.status,
        changed_by="DEMO_SLA_SIMULATOR",
        reason=f"Manually backdated timestamps by {payload.hours_back} hours to simulate SLA expiration."
    ))
    db.commit()
    db.refresh(complaint)

    return {
        "message": f"Complaint {complaint.tracking_id} successfully backdated by {payload.hours_back} hours.",
        "tracking_id": complaint.tracking_id,
        "new_created_at": complaint.created_at.isoformat(),
        "new_sla_deadline": complaint.sla_deadline.isoformat() if complaint.sla_deadline else None,
        "current_status": complaint.status
    }
