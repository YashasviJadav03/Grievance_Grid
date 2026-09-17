from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StatusLogRead(BaseModel):
    id: int
    complaint_id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by: str
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
