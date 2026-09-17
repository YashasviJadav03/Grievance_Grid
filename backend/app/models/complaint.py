from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import secrets
from app.db.session import Base


def generate_tracking_id() -> str:
    now = datetime.utcnow()
    rand_suffix = secrets.token_hex(3).upper()
    return f"GG-{now.strftime('%Y%m%d')}-{rand_suffix}"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(50), unique=True, index=True, default=generate_tracking_id, nullable=False)
    citizen_name = Column(String(100), nullable=False)
    citizen_contact = Column(String(30), nullable=False)
    citizen_email = Column(String(100), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    # Status machine: SUBMITTED -> CLASSIFIED -> ROUTED -> IN_PROGRESS -> RESOLVED -> CLOSED
    # Escalation: -> ESCALATED -> REASSIGNED -> IN_PROGRESS
    status = Column(String(30), default="SUBMITTED", index=True, nullable=False)
    priority = Column(String(20), default="MEDIUM", index=True, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL

    classification_confidence = Column(Float, nullable=True)
    classification_method = Column(String(50), nullable=True)  # "RULE_BASED", "TF_IDF_ML", "MANUAL"

    sla_deadline = Column(DateTime, nullable=True, index=True)
    is_breached = Column(Boolean, default=False, index=True)
    breached_at = Column(DateTime, nullable=True)

    assigned_to = Column(String(100), nullable=True)  # Officer or Queue identifier
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="complaints")
    category = relationship("Category", back_populates="complaints")
    status_logs = relationship("StatusLog", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusLog.id.desc()")
