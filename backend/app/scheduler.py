import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import SessionLocal
from app.services.station_sync_service import StationSyncService
from app.services.tfnsw_client import TfNSWClient

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="Australia/Sydney")
_client = TfNSWClient()
_sync_service = StationSyncService(_client)


async def sync_train_stations() -> None:
    db = SessionLocal()
    try:
        count = await _sync_service.sync(db)
        logger.info("Station sync completed: %d stations", count)
    except Exception:
        logger.exception("Station sync failed")
        db.rollback()
    finally:
        db.close()


async def ensure_stations_loaded() -> None:
    db = SessionLocal()
    try:
        from app.services.station_service import StationService

        if StationService(db).count() == 0:
            logger.info("Train stations table empty — running initial GTFS sync")
            await _sync_service.sync(db)
    except Exception:
        logger.exception("Initial station sync failed")
        db.rollback()
    finally:
        db.close()


def start_scheduler() -> None:
    scheduler.add_job(sync_train_stations, "cron", hour=3, minute=0, id="sync_stations")
    scheduler.start()
    logger.info("Scheduler started — station sync daily at 03:00 Australia/Sydney")


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
