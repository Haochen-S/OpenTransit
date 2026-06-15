import re
from datetime import datetime, timedelta, timezone
from typing import Any

from app.schemas.trip import ScheduleItem, ScheduleResponse, TripAlert
from app.services.tfnsw_client import TfNSWClient

TRAIN_PRODUCT_CLASSES = {1, 2, 4}
HORIZON_HOURS = 6
TRIPS_PER_REQUEST = 10
MAX_TRIP_PAGES = 6

OCCUPANCY_LEVELS = {
    "EMPTY": 0,
    "FEW_SEATS": 1,
    "MANY_SEATS": 2,
    "FULLY_OCCUPIED": 3,
    "FULL": 3,
}


class ScheduleService:
    """Train schedules between stations via GET /trip."""

    def __init__(self, client: TfNSWClient) -> None:
        self._client = client

    async def fetch_from_api(
        self,
        origin_id: str,
        origin_name: str,
        destination_id: str,
        destination_name: str,
    ) -> ScheduleResponse:
        return await self._fetch_from_tfnsw(
            origin_id, origin_name, destination_id, destination_name
        )

    def rehydrate_items(self, items: list[ScheduleItem]) -> list[ScheduleItem]:
        refreshed: list[ScheduleItem] = []
        for item in items:
            dep_planned = item.departure_planned
            dep_estimated = item.departure_estimated or dep_planned
            delay = self._delay_minutes(dep_planned, dep_estimated)
            is_on_time = delay is None or delay <= 0
            status_text = "On time" if is_on_time else f"running {delay} mins late"

            refreshed.append(
                item.model_copy(
                    update={
                        "minutes_until_departure": self._minutes_until(dep_estimated or dep_planned),
                        "is_on_time": is_on_time,
                        "delay_minutes": delay if delay and delay > 0 else None,
                        "status_text": status_text,
                    }
                )
            )

        return self._sort_by_departure(self._filter_within_horizon(refreshed))

    async def _fetch_from_tfnsw(
        self,
        origin_id: str,
        origin_name: str,
        destination_id: str,
        destination_name: str,
    ) -> ScheduleResponse:
        from zoneinfo import ZoneInfo

        sydney = ZoneInfo("Australia/Sydney")
        cutoff = datetime.now(timezone.utc) + timedelta(hours=HORIZON_HOURS)
        all_items: list[ScheduleItem] = []
        all_alert_ids: set[str] = set()
        seen_deps: set[str] = set()
        itd = datetime.now(sydney)

        base_params = {
            "outputFormat": "rapidJSON",
            "coordOutputFormat": "EPSG:4326",
            "depArrMacro": "dep",
            "type_origin": "any",
            "name_origin": origin_id,
            "type_destination": "any",
            "name_destination": destination_id,
            "calcNumberOfTrips": TRIPS_PER_REQUEST,
            "TfNSWTR": "true",
            "excludedMeans": "checkbox",
            "exclMOT_5": "1",
            "exclMOT_7": "1",
            "exclMOT_9": "1",
            "exclMOT_11": "1",
        }

        for _ in range(MAX_TRIP_PAGES):
            params = {
                **base_params,
                **self._client.itd_params_from_datetime(itd),
            }
            data = await self._client.get("trip", params)
            batch_items, batch_alerts = self._parse_trip_response(
                data, origin_name, destination_name
            )

            new_items: list[ScheduleItem] = []
            max_dep: datetime | None = None

            for item in batch_items:
                dep_key = item.departure_estimated or item.departure_planned
                if not dep_key or dep_key in seen_deps:
                    continue

                dep_dt = self._parse_dt(dep_key)
                if dep_dt is None:
                    continue
                if dep_dt.tzinfo is None:
                    dep_dt = dep_dt.replace(tzinfo=timezone.utc)
                if dep_dt > cutoff:
                    continue

                seen_deps.add(dep_key)
                new_items.append(item)
                if max_dep is None or dep_dt > max_dep:
                    max_dep = dep_dt

            all_items.extend(new_items)
            all_alert_ids.update(batch_alerts)

            if not new_items or max_dep is None:
                break
            if max_dep >= cutoff - timedelta(minutes=1):
                break

            itd = (max_dep + timedelta(minutes=1)).astimezone(sydney)

        all_items = self._sort_by_departure(all_items)
        items = self._filter_within_horizon(all_items)

        return ScheduleResponse(
            origin_id=origin_id,
            origin_name=origin_name,
            destination_id=destination_id,
            destination_name=destination_name,
            items=items,
            service_alert_count=len(all_alert_ids),
            fetched_at=datetime.now(timezone.utc),
        )

    def _sort_by_departure(self, items: list[ScheduleItem]) -> list[ScheduleItem]:
        def sort_key(item: ScheduleItem) -> datetime:
            dt = self._parse_dt(item.departure_estimated or item.departure_planned)
            if dt is None:
                return datetime.min.replace(tzinfo=timezone.utc)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt

        return sorted(items, key=sort_key)

    def _parse_trip_response(
        self,
        data: dict[str, Any],
        origin_name: str,
        destination_name: str,
    ) -> tuple[list[ScheduleItem], set[str]]:
        journeys = data.get("journeys", [])
        if not isinstance(journeys, list):
            return [], set()

        items: list[ScheduleItem] = []
        alert_ids: set[str] = set()

        for journey in journeys:
            if not isinstance(journey, dict):
                continue
            item, ids = self._parse_journey(journey, origin_name, destination_name)
            if item:
                items.append(item)
                alert_ids.update(ids)

        return items, alert_ids

    def _filter_within_horizon(self, items: list[ScheduleItem]) -> list[ScheduleItem]:
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(hours=HORIZON_HOURS)
        filtered: list[ScheduleItem] = []

        for item in items:
            dep = self._parse_dt(item.departure_estimated or item.departure_planned)
            if dep is None:
                continue
            if dep.tzinfo is None:
                dep = dep.replace(tzinfo=timezone.utc)
            if now - timedelta(minutes=2) <= dep <= cutoff:
                filtered.append(item)

        return filtered

    def _parse_journey(
        self,
        journey: dict[str, Any],
        default_origin: str,
        default_destination: str,
    ) -> tuple[ScheduleItem | None, set[str]]:
        legs = journey.get("legs", [])
        if not isinstance(legs, list):
            return None, set()

        train_legs = [leg for leg in legs if isinstance(leg, dict) and self._is_train_leg(leg)]
        if not train_legs:
            return None, set()

        first_leg = train_legs[0]
        last_leg = train_legs[-1]
        alert_ids: set[str] = set()

        for leg in train_legs:
            for info in leg.get("infos") or []:
                if isinstance(info, dict) and info.get("id"):
                    alert_ids.add(str(info["id"]))

        transportation = first_leg.get("transportation") or {}
        line_code = transportation.get("disassembledName") or transportation.get("number")
        line_name = transportation.get("name")

        origin_stop = first_leg.get("origin") if isinstance(first_leg.get("origin"), dict) else {}
        dest_stop = last_leg.get("destination") if isinstance(last_leg.get("destination"), dict) else {}

        dep_planned = origin_stop.get("departureTimePlanned")
        dep_estimated = origin_stop.get("departureTimeEstimated") or dep_planned
        arr_planned = dest_stop.get("arrivalTimePlanned")
        arr_estimated = dest_stop.get("arrivalTimeEstimated") or arr_planned

        delay = self._delay_minutes(dep_planned, dep_estimated)
        is_on_time = delay is None or delay <= 0
        status_text = "On time" if is_on_time else f"running {delay} mins late"

        origin_props = origin_stop.get("properties") if isinstance(origin_stop.get("properties"), dict) else {}
        dest_props = dest_stop.get("properties") if isinstance(dest_stop.get("properties"), dict) else {}
        origin_platform = origin_props.get("platformName") or origin_props.get("stoppingPointPlanned")
        dest_platform = dest_props.get("platformName") or dest_props.get("stoppingPointPlanned")
        occupancy = origin_props.get("occupancy")

        leg_alerts = self._parse_leg_alerts(first_leg)

        return ScheduleItem(
            line_code=str(line_code) if line_code else None,
            line_name=str(line_name) if line_name else None,
            origin_name=self._clean_station_name(origin_stop.get("name"), default_origin),
            platform=str(origin_platform) if origin_platform else None,
            destination_name=self._clean_station_name(dest_stop.get("name"), default_destination),
            destination_platform=str(dest_platform) if dest_platform else None,
            departure_planned=self._as_iso(dep_planned),
            departure_estimated=self._as_iso(dep_estimated),
            arrival_planned=self._as_iso(arr_planned),
            arrival_estimated=self._as_iso(arr_estimated),
            minutes_until_departure=self._minutes_until(dep_estimated or dep_planned),
            is_realtime=bool(first_leg.get("isRealtimeControlled")),
            is_on_time=is_on_time,
            delay_minutes=delay if delay and delay > 0 else None,
            status_text=status_text,
            occupancy=str(occupancy) if occupancy else None,
            occupancy_level=OCCUPANCY_LEVELS.get(str(occupancy), None),
            has_alert=len(leg_alerts) > 0,
            alerts=leg_alerts,
        ), alert_ids

    def _parse_leg_alerts(self, leg: dict[str, Any]) -> list[TripAlert]:
        alerts: list[TripAlert] = []
        for info in leg.get("infos") or []:
            if not isinstance(info, dict):
                continue
            alerts.append(
                TripAlert(
                    id=str(info["id"]) if info.get("id") else None,
                    title=info.get("subtitle") or info.get("urlText"),
                    priority=info.get("priority"),
                )
            )
        return alerts

    def _is_train_leg(self, leg: dict[str, Any]) -> bool:
        transportation = leg.get("transportation")
        if not isinstance(transportation, dict):
            return False
        product = transportation.get("product")
        if isinstance(product, dict) and product.get("class") in TRAIN_PRODUCT_CLASSES:
            return True
        name = str(transportation.get("name") or "").lower()
        return any(k in name for k in ("train", "metro", "light rail", "rail"))

    def _clean_station_name(self, raw: Any, fallback: str) -> str:
        if not isinstance(raw, str) or not raw.strip():
            return fallback
        name = raw.split(",")[0].strip()
        name = re.sub(r"\s+Station\s*$", "", name, flags=re.IGNORECASE)
        return name or fallback

    def _as_iso(self, value: Any) -> str | None:
        if not value:
            return None
        return str(value)

    def _parse_dt(self, value: Any) -> datetime | None:
        if not value:
            return None
        text = str(value).replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(text)
        except ValueError:
            return None

    def _minutes_until(self, value: Any) -> int | None:
        dt = self._parse_dt(value)
        if dt is None:
            return None
        now = datetime.now(timezone.utc)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        delta = (dt - now).total_seconds() / 60
        return max(0, int(round(delta)))

    def _delay_minutes(self, planned: Any, estimated: Any) -> int | None:
        p = self._parse_dt(planned)
        e = self._parse_dt(estimated)
        if p is None or e is None:
            return None
        diff = (e - p).total_seconds() / 60
        return int(round(diff)) if diff > 0 else 0
