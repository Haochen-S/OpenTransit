from sqlalchemy.orm import Session

from app.models import TrainStation
from app.schemas.trip import Station


class StationService:
    """Read train stations from PostgreSQL."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def list_all(self) -> list[Station]:
        rows = self._db.query(TrainStation).order_by(TrainStation.name).all()
        return [Station(id=row.stop_id, name=row.name) for row in rows]

    def count(self) -> int:
        return self._db.query(TrainStation).count()
