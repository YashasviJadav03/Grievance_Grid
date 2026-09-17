from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.department import DepartmentRead
from app.schemas.category import CategoryRead
from app.schemas.status_log import StatusLogRead


class ComplaintCreate(BaseModel):
    citizen_name: str = Field(..., min_length=2, max_length=100)
    citizen_contact: str = Field(..., min_length=5, max_length=30)
    citizen_email: Optional[str] = Field(None, max_length=100)
    title: str = Field(..., min_length=3, max_length=250)
    description: str = Field(..., min_length=5, max_length=5000)
    # Department/category can be explicitly provided or left None for auto-classification
    department_id: Optional[int] = None
    category_id: Optional[int] = None


class ComplaintUpdateStatus(BaseModel):
    target_status: str = Field(..., min_length=2, max_length=50)
    actor: str = Field("OFFICER", max_length=100)
    reason: Optional[str] = Field(None, max_length=1000)
    resolution_notes: Optional[str] = Field(None, max_length=2000)


class ComplaintRead(BaseModel):
    id: int
    tracking_id: str
    citizen_name: str
    citizen_contact: str
    citizen_email: Optional[str] = None
    title: str
    description: str
    department_id: Optional[int] = None
    category_id: Optional[int] = None
    status: str
    priority: str
    classification_confidence: Optional[float] = None
    classification_method: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    is_breached: bool
    breached_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Populated nested details
    department: Optional[DepartmentRead] = None
    category: Optional[CategoryRead] = None
    status_logs: List[StatusLogRead] = []

    # Dynamic SLA indicator helper fields
    sla_status: Optional[str] = None  # GREEN, AMBER, RED
    sla_hours_remaining: Optional[float] = None

    class Config:
        from_attributes = True
