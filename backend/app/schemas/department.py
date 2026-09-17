from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.category import CategoryRead


class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    supervisor_email: Optional[str] = None
    is_active: bool = True


class DepartmentRead(DepartmentBase):
    id: int
    created_at: datetime
    categories: List[CategoryRead] = []

    class Config:
        from_attributes = True
