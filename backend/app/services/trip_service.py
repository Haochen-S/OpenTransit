from sqlalchemy.orm import Session

from app.models import SavedTrip, User
from app.schemas.trip import SavedTripCreate

MAX_TRIPS = 10


class TripService:
    """Persist and manage saved station-to-station trips for logged-in users."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def list_for_user(self, user: User) -> list[SavedTrip]:
        return (
            self._db.query(SavedTrip)
            .filter(SavedTrip.user_id == user.id)
            .order_by(SavedTrip.created_at.desc())
            .limit(MAX_TRIPS)
            .all()
        )

    def create(self, user: User, payload: SavedTripCreate) -> SavedTrip:
        existing = (
            self._db.query(SavedTrip)
            .filter(
                SavedTrip.user_id == user.id,
                SavedTrip.origin_id == payload.origin_id,
                SavedTrip.destination_id == payload.destination_id,
            )
            .first()
        )
        if existing:
            return existing

        count = self._db.query(SavedTrip).filter(SavedTrip.user_id == user.id).count()
        if count >= MAX_TRIPS:
            oldest = (
                self._db.query(SavedTrip)
                .filter(SavedTrip.user_id == user.id)
                .order_by(SavedTrip.created_at.asc())
                .first()
            )
            if oldest:
                self._db.delete(oldest)

        trip = SavedTrip(
            user_id=user.id,
            origin_id=payload.origin_id,
            origin_name=payload.origin_name,
            destination_id=payload.destination_id,
            destination_name=payload.destination_name,
        )
        self._db.add(trip)
        self._db.commit()
        self._db.refresh(trip)
        return trip

    def delete(self, user: User, trip_id: int) -> bool:
        trip = (
            self._db.query(SavedTrip)
            .filter(SavedTrip.id == trip_id, SavedTrip.user_id == user.id)
            .first()
        )
        if trip is None:
            return False
        self._db.delete(trip)
        self._db.commit()
        return True
