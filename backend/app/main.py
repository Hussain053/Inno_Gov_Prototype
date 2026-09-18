import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import AsyncSessionLocal
from app.routers import (
    activity,
    admin,
    applications,
    auth,
    challenges,
    contracts,
    dashboard,
    evaluations,
    evaluator_assignments,
    matching,
    notifications,
    pilot_submissions,
    pilots,
    startups,
)

from app.database import AsyncSessionLocal, engine, Base
import app.models

app = FastAPI(
    title="Startup-Friendly Public Procurement API",
    description="Backend API for the InnoGov hackathon project",
    version="1.0.0",
)

# Comprehensive CORS setup for hackathon frontend evaluation
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8000"
)
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    """Ensure all database tables exist and seed demo data if database is fresh."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from seed import seed
        await seed()
    except Exception as exc:
        print(f"[Startup Notice] Seed check: {exc}")


app.include_router(auth.router)
app.include_router(challenges.router)
app.include_router(applications.router)
app.include_router(pilots.router)
app.include_router(pilot_submissions.router)
app.include_router(evaluations.router)
app.include_router(evaluator_assignments.router)
app.include_router(contracts.router)
app.include_router(startups.router)
app.include_router(matching.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(activity.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {
        "message": "Startup-Friendly Public Procurement API is running"
    }

@app.get("/db-test")
async def db_test():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "database": "connected",
        "result": value
    }