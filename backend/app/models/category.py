from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    default_sla_hours = Column(Integer, nullable=False, default=24)
    priority = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    keywords = Column(String(500), nullable=True)  # Comma-separated trigger keywords
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="categories")
    sla_rule = relationship("SLARule", back_populates="category", uselist=False, cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="category")
