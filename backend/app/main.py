import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routers import auth, trips, transit
from app.scheduler import ensure_stations_loaded, shutdown_scheduler, start_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

is_production = settings.environment == "production"

app = FastAPI(
    title="OpenTransit Sydney API",
    version="2.1.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(transit.router, prefix="/api")
app.include_router(trips.router, prefix="/api")


@app.on_event("startup")
async def on_startup():
    settings.validate_production()
    logger.info("Starting API (environment=%s)", settings.environment)
    await ensure_stations_loaded()
    start_scheduler()


@app.on_event("shutdown")
async def on_shutdown():
    shutdown_scheduler()
    await engine.dispose()


@app.get("/api/health")
def health():
    return {"status": "ok"}
