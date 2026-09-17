from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.department import Department
from app.schemas.department import DepartmentRead

router = APIRouter()


@router.get("/", response_model=List[DepartmentRead])
def list_departments(db: Session = Depends(get_db)):
    """List all civic departments along with their categories and SLA windows."""
    departments = db.query(Department).filter(Department.is_active == True).all()
    return departments


@router.get("/{department_id}", response_model=DepartmentRead)
def get_department(department_id: int, db: Session = Depends(get_db)):
    """Get single department details."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept
