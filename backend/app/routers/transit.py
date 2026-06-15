from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.trip import ScheduleResponse, Station
from app.services import schedule_cache_service
from app.services.station_service import StationService

router = APIRouter(prefix="/transit", tags=["transit"])


@router.get("/stations/all", response_model=list[Station])
def list_all_stations(db: Session = Depends(get_db)):
    stations = StationService(db).list_all()
    if not stations:
        raise HTTPException(status_code=503, detail="Station list not loaded yet")
    return stations


@router.get("/schedule", response_model=ScheduleResponse)
async def get_schedule(
    background_tasks: BackgroundTasks,
    origin_id: str = Query(min_length=1),
    origin_name: str = Query(min_length=1),
    destination_id: str = Query(min_length=1),
    destination_name: str = Query(min_length=1),
    refresh: bool = Query(False, description="Force refresh from TfNSW and update shared cache"),
):
    stale_response = schedule_cache_service.stale_cached_response(
        origin_id, destination_id, refresh
    )
    if stale_response is not None:
        background_tasks.add_task(
            schedule_cache_service.refresh_background,
            origin_id,
            origin_name,
            destination_id,
            destination_name,
        )
        return stale_response

    try:
        return await schedule_cache_service.get(
            origin_id=origin_id,
            origin_name=origin_name,
            destination_id=destination_id,
            destination_name=destination_name,
            refresh=refresh,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
