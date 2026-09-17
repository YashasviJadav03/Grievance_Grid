from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SLARuleRead(BaseModel):
    id: int
    category_id: int
    warning_threshold_pct: float
    breach_hours: int
    escalate_to_role: str

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str
    department_id: int
    default_sla_hours: int
    priority: str
    keywords: Optional[str] = None


class CategoryRead(CategoryBase):
    id: int
    created_at: datetime
    sla_rule: Optional[SLARuleRead] = None

    class Config:
        from_attributes = True
