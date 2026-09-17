from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.classification import ClassifyRequest, ClassifyResponse
from app.classifier.engine import classifier_engine
from app.models.department import Department
from app.models.category import Category

router = APIRouter()


@router.post("/", response_model=ClassifyResponse)
def test_classification(request: ClassifyRequest, db: Session = Depends(get_db)):
    """
    Standalone endpoint to test automatic classification and routing logic.
    Returns predicted department, category, SLA hours, priority, and confidence.
    """
    res = classifier_engine.classify(request.title, request.description)
    
    dept = db.query(Department).filter(Department.code == res["department_code"]).first()
    category = None
    if dept:
        category = db.query(Category).filter(
            Category.department_id == dept.id,
            Category.name == res["category_name"]
        ).first()

    return ClassifyResponse(
        department_id=dept.id if dept else None,
        department_code=res["department_code"],
        department_name=dept.name if dept else res["department_code"],
        category_id=category.id if category else None,
        category_name=res["category_name"],
        priority=category.priority if category else "MEDIUM",
        default_sla_hours=category.default_sla_hours if category else 24,
        confidence=res["confidence"],
        method=res["method"],
        matched_keywords=res["matched_keywords"]
    )
