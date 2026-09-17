from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.complaint import Complaint, generate_tracking_id
from app.models.department import Department
from app.models.category import Category
from app.models.status_log import StatusLog
from app.schemas.complaint import ComplaintCreate, ComplaintRead, ComplaintUpdateStatus
from app.classifier.engine import classifier_engine
from app.core.state_machine import transition_complaint, ComplaintStatus

router = APIRouter()


def enrich_sla_meta(complaint: Complaint) -> dict:
    """Computes dynamic SLA indicators (GREEN, AMBER, RED) and hours remaining."""
    if not complaint.sla_deadline:
        return {"sla_status": "NONE", "sla_hours_remaining": None}

    now = datetime.utcnow()
    total_sla_seconds = (complaint.sla_deadline - complaint.created_at).total_seconds()
    if total_sla_seconds <= 0:
        total_sla_seconds = 1

    remaining_seconds = (complaint.sla_deadline - now).total_seconds()
    remaining_hours = round(remaining_seconds / 3600.0, 1)

    if complaint.status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
        if complaint.resolved_at:
            res_remaining_seconds = (complaint.sla_deadline - complaint.resolved_at).total_seconds()
            res_remaining_hours = round(res_remaining_seconds / 3600.0, 1)
        else:
            res_remaining_hours = 0.0
        return {
            "sla_status": "RESOLVED",
            "sla_hours_remaining": res_remaining_hours
        }

    if remaining_seconds <= 0 or complaint.is_breached:
        return {
            "sla_status": "RED",  # Breached
            "sla_hours_remaining": remaining_hours
        }

    elapsed_seconds = (now - complaint.created_at).total_seconds()
    ratio = elapsed_seconds / total_sla_seconds

    if ratio >= 0.75:
        sla_status = "AMBER"  # At Risk
    else:
        sla_status = "GREEN"  # Healthy

    return {
        "sla_status": sla_status,
        "sla_hours_remaining": remaining_hours
    }


@router.post("/", response_model=ComplaintRead, status_code=201)
def submit_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Intake API: Accepts citizen complaint, auto-classifies category & department if not
    specified, stamps SLA deadline, transitions to ROUTED, and creates initial audit log.
    """
    dept_id = data.department_id
    cat_id = data.category_id
    confidence = 1.0
    method = "MANUAL"

    # Step 1: Auto-classify if not explicitly given
    if not dept_id or not cat_id:
        clf_result = classifier_engine.classify(data.title, data.description)
        confidence = clf_result["confidence"]
        method = clf_result["method"]

        matched_dept = db.query(Department).filter(
            Department.code == clf_result["department_code"]
        ).first()

        if matched_dept:
            dept_id = matched_dept.id
            matched_cat = db.query(Category).filter(
                Category.department_id == dept_id,
                Category.name == clf_result["category_name"]
            ).first()
            if matched_cat:
                cat_id = matched_cat.id

    # Fallback to first available category if needed
    category = db.query(Category).filter(Category.id == cat_id).first() if cat_id else None
    if not category:
        category = db.query(Category).first()
        if category:
            cat_id = category.id
            dept_id = category.department_id

    department = db.query(Department).filter(Department.id == dept_id).first() if dept_id else None

    # Step 2: Determine SLA hours & deadline
    sla_hours = category.default_sla_hours if category else 24
    priority = category.priority if category else "MEDIUM"
    now = datetime.utcnow()
    sla_deadline = now + timedelta(hours=sla_hours)

    # Step 3: Instantiate Complaint
    tracking_id = generate_tracking_id()
    complaint = Complaint(
        tracking_id=tracking_id,
        citizen_name=data.citizen_name,
        citizen_contact=data.citizen_contact,
        citizen_email=data.citizen_email,
        title=data.title,
        description=data.description,
        department_id=dept_id,
        category_id=cat_id,
        priority=priority,
        status=ComplaintStatus.ROUTED,
        classification_confidence=confidence,
        classification_method=method,
        sla_deadline=sla_deadline,
        is_breached=False,
        created_at=now,
        updated_at=now
    )
    db.add(complaint)
    db.flush()

    # Step 4: Write initial audit trail records
    log_intake = StatusLog(
        complaint_id=complaint.id,
        from_status=None,
        to_status=ComplaintStatus.SUBMITTED,
        changed_by="CITIZEN_INTAKE",
        reason="Grievance submitted by citizen.",
        created_at=now
    )
    log_routing = StatusLog(
        complaint_id=complaint.id,
        from_status=ComplaintStatus.SUBMITTED,
        to_status=ComplaintStatus.ROUTED,
        changed_by="SYSTEM_AUTO_ROUTER",
        reason=f"Auto-classified ({method}) to {department.name if department else 'General Queue'} "
               f"under category '{category.name if category else 'General'}' with {sla_hours}h SLA.",
        created_at=now + timedelta(seconds=1)
    )
    db.add(log_intake)
    db.add(log_routing)
    db.commit()
    db.refresh(complaint)

    # Build response schema
    meta = enrich_sla_meta(complaint)
    resp = ComplaintRead.model_validate(complaint)
    resp.sla_status = meta["sla_status"]
    resp.sla_hours_remaining = meta["sla_hours_remaining"]
    return resp


@router.get("/", response_model=List[ComplaintRead])
def list_complaints(
    department_id: Optional[int] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    is_breached: Optional[bool] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List complaints with multi-parameter filtering: department, category, status,
    breach status, search keyword, and pagination.
    """
    query = db.query(Complaint)

    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    if status:
        query = query.filter(Complaint.status == status)
    if is_breached is not None:
        query = query.filter(Complaint.is_breached == is_breached)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Complaint.title.ilike(s)) |
            (Complaint.description.ilike(s)) |
            (Complaint.tracking_id.ilike(s)) |
            (Complaint.citizen_name.ilike(s))
        )

    # Sort by SLA deadline ascending (most urgent first)
    query = query.order_by(Complaint.sla_deadline.asc())
    complaints = query.offset(offset).limit(limit).all()

    results = []
    for c in complaints:
        meta = enrich_sla_meta(c)
        r = ComplaintRead.model_validate(c)
        r.sla_status = meta["sla_status"]
        r.sla_hours_remaining = meta["sla_hours_remaining"]
        results.append(r)

    return results


@router.get("/{identifier}", response_model=ComplaintRead)
def get_complaint(identifier: str, db: Session = Depends(get_db)):
    """
    Retrieve single complaint by tracking_id (e.g. GG-20260917-4321) or numeric ID.
    Used by public Citizen Tracker and Officer Dashboard detail view.
    """
    clean_id = identifier.strip()
    if clean_id.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(clean_id)).first()
    else:
        complaint = db.query(Complaint).filter(
            func.upper(Complaint.tracking_id) == clean_id.upper()
        ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail=f"Grievance '{identifier}' not found")

    meta = enrich_sla_meta(complaint)
    resp = ComplaintRead.model_validate(complaint)
    resp.sla_status = meta["sla_status"]
    resp.sla_hours_remaining = meta["sla_hours_remaining"]
    return resp


@router.patch("/{complaint_id}/status", response_model=ComplaintRead)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintUpdateStatus,
    db: Session = Depends(get_db)
):
    """
    Transition complaint status using the SLA state machine.
    Enforces valid transition paths and appends to immutable StatusLog audit trail.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if payload.resolution_notes:
        complaint.resolution_notes = payload.resolution_notes

    try:
        updated = transition_complaint(
            db=db,
            complaint=complaint,
            target_status=payload.target_status,
            actor=payload.actor,
            reason=payload.reason or payload.resolution_notes
        )
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    meta = enrich_sla_meta(updated)
    resp = ComplaintRead.model_validate(updated)
    resp.sla_status = meta["sla_status"]
    resp.sla_hours_remaining = meta["sla_hours_remaining"]
    return resp
