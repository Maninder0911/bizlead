from fastapi import FastAPI
from sqlalchemy import text

from app.database.connection import engine
from app.database.init_db import init_db
from app.api.enquiries import router as enquiries_router


app = FastAPI(
    title="BizLead API",
    description="Business enquiry and follow-up management API",
    version="0.1.0"
)

init_db()
app.include_router(enquiries_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to BizLead API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.get("/health/db")
def database_health_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "status": "healthy",
        "database": "MySQL",
        "test_result": value
    }