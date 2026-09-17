import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.seed_data import seed_database
from app.services.sla_engine import run_sla_scan
from app.api.api_router import api_router


async def sla_background_worker():
    """Background task that runs periodically to evaluate SLA breaches."""
    while True:
        try:
            db = SessionLocal()
            try:
                run_sla_scan(db)
            finally:
                db.close()
        except Exception as e:
            print(f"[SLA Background Worker Error] {e}")
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure all tables are created and initial seed data is loaded
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Launch background SLA monitor task
    worker_task = asyncio.create_task(sla_background_worker())
    yield
    # Shutdown: Cancel background worker
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Public Grievance Routing & SLA-Tracking Engine (CPGRAMS-Style)",
    version="1.0.0",
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS configuration for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vite dev server (e.g. http://localhost:5173) and production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "system": "Grievance Grid",
        "description": "Public Grievance Routing & SLA-Tracking Engine",
        "version": "1.0.0",
        "status": "HEALTHY",
        "docs_url": f"{settings.API_V1_STR}/docs"
    }
