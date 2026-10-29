from fastapi import FastAPI
from sqlalchemy import text

from app.database.connection import engine
from app.database.init_db import init_db
from app.api.enquiries import router as enquiries_router

from pathlib import Path

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(
    title="BizLead API",
    description="Business enquiry and follow-up management API",
    version="0.1.0",
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

init_db()
app.include_router(enquiries_router)


@app.get("/", include_in_schema=False)
def serve_frontend():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {"status": "healthy", "database": "MySQL", "test_result": value}


@app.get("/service-worker.js", include_in_schema=False)
def service_worker():
    return FileResponse(
        FRONTEND_DIR / "service-worker.js",
        media_type="application/javascript",
        headers={"Service-Worker-Allowed": "/"},
    )
