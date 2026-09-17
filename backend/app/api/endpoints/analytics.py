from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.complaint import Complaint
from app.models.department import Department
from app.models.category import Category
from app.models.status_log import StatusLog
from app.core.state_machine import ComplaintStatus

router = APIRouter()


@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Computes system-wide grievance statistics, SLA compliance rates,
    average resolution turnaround, and department-level performance metrics.
    """
    total_complaints = db.query(Complaint).count()
    
    # Status breakdown
    routed_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.ROUTED).count()
    in_progress_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.IN_PROGRESS).count()
    escalated_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.ESCALATED).count()
    resolved_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    closed_count = db.query(Complaint).filter(Complaint.status == ComplaintStatus.CLOSED).count()

    active_count = db.query(Complaint).filter(
        ~Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])
    ).count()
    total_breached = db.query(Complaint).filter(Complaint.is_breached == True).count()
    breach_rate_pct = round((total_breached / total_complaints * 100), 1) if total_complaints > 0 else 0.0

    # Calculate average resolution time in hours
    resolved_complaints = db.query(Complaint).filter(
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]),
        Complaint.resolved_at.isnot(None)
    ).all()

    avg_resolution_hours = 0.0
    if resolved_complaints:
        total_res_seconds = sum((c.resolved_at - c.created_at).total_seconds() for c in resolved_complaints)
        avg_resolution_hours = round((total_res_seconds / len(resolved_complaints)) / 3600.0, 1)

    # Department breakdown
    departments = db.query(Department).all()
    dept_stats = []
    for d in departments:
        d_total = db.query(Complaint).filter(Complaint.department_id == d.id).count()
        d_active = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            ~Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])
        ).count()
        d_breached = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.is_breached == True
        ).count()
        d_resolved = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])
        ).count()

        # Avg resolution for dept
        d_res_tickets = [c for c in resolved_complaints if c.department_id == d.id]
        d_avg_hours = 0.0
        if d_res_tickets:
            d_total_sec = sum((c.resolved_at - c.created_at).total_seconds() for c in d_res_tickets)
            d_avg_hours = round((d_total_sec / len(d_res_tickets)) / 3600.0, 1)

        d_breach_rate = round((d_breached / d_total * 100), 1) if d_total > 0 else 0.0

        dept_stats.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "total": d_total,
            "active": d_active,
            "resolved": d_resolved,
            "breached": d_breached,
            "breach_rate_pct": d_breach_rate,
            "avg_resolution_hours": d_avg_hours
        })

    # Recent audit feed (last 10 entries)
    recent_logs = db.query(StatusLog).order_by(StatusLog.created_at.desc()).limit(10).all()
    recent_feed = [
        {
            "id": log.id,
            "complaint_id": log.complaint_id,
            "from_status": log.from_status,
            "to_status": log.to_status,
            "changed_by": log.changed_by,
            "reason": log.reason,
            "created_at": log.created_at.isoformat()
        }
        for log in recent_logs
    ]

    return {
        "kpis": {
            "total_complaints": total_complaints,
            "active_complaints": active_count,
            "routed": routed_count,
            "in_progress": in_progress_count,
            "escalated": escalated_count,
            "resolved": resolved_count,
            "closed": closed_count,
            "total_breached": total_breached,
            "breach_rate_pct": breach_rate_pct,
            "avg_resolution_hours": avg_resolution_hours,
        },
        "department_performance": dept_stats,
        "recent_audit_trail": recent_feed
    }
