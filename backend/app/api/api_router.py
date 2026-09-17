from fastapi import APIRouter
from app.api.endpoints import departments, complaints, classify, sla, analytics

api_router = APIRouter()

api_router.include_router(departments.router, prefix="/departments", tags=["Departments & SLAs"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints & Tracking"])
api_router.include_router(classify.router, prefix="/classify", tags=["Auto-Classification Engine"])
api_router.include_router(sla.router, prefix="/sla", tags=["SLA Engine & Escalation"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Admin Analytics"])
