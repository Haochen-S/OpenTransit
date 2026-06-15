import csv
import io
import re
import zipfile
import logging

from sqlalchemy.orm import Session

from app.models import TrainStation
from app.schemas.trip import Station
from app.services.tfnsw_client import TfNSWClient

logger = logging.getLogger(__name__)

GTFS_SYDNEY_TRAINS_URL = "https://api.transport.nsw.gov.au/v1/gtfs/schedule/sydneytrains"


class StationSyncService:
    """Download Sydney Trains GTFS and upsert stations into PostgreSQL."""

    def __init__(self, client: TfNSWClient) -> None:
        self._client = client

    async def sync(self, db: Session) -> int:
        stations = await self._fetch_from_gtfs()
        if not stations:
            raise RuntimeError("GTFS returned no train stations")

        seen_ids: set[str] = set()
        for station in stations:
            seen_ids.add(station.id)
            row = db.query(TrainStation).filter(TrainStation.stop_id == station.id).first()
            if row is None:
                db.add(TrainStation(stop_id=station.id, name=station.name))
            else:
                row.name = station.name

        stale = db.query(TrainStation).filter(TrainStation.stop_id.notin_(seen_ids)).all()
        for row in stale:
            db.delete(row)

        db.commit()
        logger.info("Synced %d train stations", len(seen_ids))
        return len(seen_ids)

    async def _fetch_from_gtfs(self) -> list[Station]:
        content = await self._client.get_url_bytes(GTFS_SYDNEY_TRAINS_URL)
        stations: list[Station] = []

        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            with archive.open("stops.txt") as raw:
                reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig"))
                for row in reader:
                    if row.get("location_type") != "1":
                        continue
                    stop_id = row.get("stop_id", "").strip()
                    stop_name = row.get("stop_name", "").strip()
                    if not stop_id or not stop_name or not stop_id.isdigit():
                        continue
                    stations.append(
                        Station(id=stop_id, name=self._clean_name(stop_name))
                    )

        unique: dict[str, Station] = {s.id: s for s in stations}
        return sorted(unique.values(), key=lambda s: s.name.lower())

    def _clean_name(self, raw_name: str) -> str:
        name = raw_name.strip()
        return re.sub(r"\s+Station\s*$", "", name, flags=re.IGNORECASE).strip()
