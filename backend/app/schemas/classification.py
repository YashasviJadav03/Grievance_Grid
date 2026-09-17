from pydantic import BaseModel
from typing import Optional, List


class ClassifyRequest(BaseModel):
    title: str
    description: str


class ClassifyResponse(BaseModel):
    department_id: Optional[int] = None
    department_code: Optional[str] = None
    department_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    priority: str = "MEDIUM"
    default_sla_hours: int = 24
    confidence: float = 0.0
    method: str = "RULE_BASED"  # RULE_BASED or TF_IDF_ML
    matched_keywords: List[str] = []
