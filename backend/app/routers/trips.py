from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.trip import SavedTripCreate, SavedTripResponse
from app.services.trip_service import TripService

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[SavedTripResponse])
def list_trips(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TripService(db).list_for_user(user)


@router.post("", response_model=SavedTripResponse, status_code=201)
def save_trip(
    request: Request,
    payload: SavedTripCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TripService(db).create(user, payload)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(
    request: Request,
    trip_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not TripService(db).delete(user, trip_id):
        raise HTTPException(status_code=404, detail="Trip not found")
