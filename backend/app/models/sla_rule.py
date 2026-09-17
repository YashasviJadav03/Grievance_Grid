from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class SLARule(Base):
    __tablename__ = "sla_rules"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), unique=True, nullable=False)
    warning_threshold_pct = Column(Float, default=0.75)  # 75% -> amber risk state
    breach_hours = Column(Integer, nullable=False)
    escalate_to_role = Column(String(50), default="SUPERVISOR")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="sla_rule")
