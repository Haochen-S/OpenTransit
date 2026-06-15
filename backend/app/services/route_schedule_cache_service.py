import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict

from app.schemas.trip import ScheduleItem, ScheduleResponse
from app.services.schedule_service import ScheduleService

CACHE_TTL_SECONDS = 60
MAX_CACHE_ENTRIES = 80

_route_locks: Dict[str, asyncio.Lock] = {}


@dataclass
class _MemoryCacheEntry:
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    items: list[dict[str, Any]]
    service_alert_count: int
    fetched_at: datetime


class RouteScheduleCacheService:
    """
    In-memory shared schedule cache (per origin → destination).

    Not stored in PostgreSQL — cleared on process restart. Users and saved trips
    remain in the database; schedules are refreshed from TfNSW on demand.
    """

    def __init__(self, schedule_service: ScheduleService) -> None:
        self._schedule = schedule_service
        self._memory: Dict[str, _MemoryCacheEntry] = {}

    async def get(
        self,
        origin_id: str,
        origin_name: str,
        destination_id: str,
        destination_name: str,
        refresh: bool = False,
    ) -> ScheduleResponse:
        route_key = self._route_key(origin_id, destination_id)
        cached = self._memory.get(route_key)

        if not refresh and cached and self._is_fresh(cached):
            return self._from_entry(cached)

        lock = _route_locks.setdefault(route_key, asyncio.Lock())

        if not refresh and cached and lock.locked():
            return self._from_entry(cached)

        async with lock:
            cached = self._memory.get(route_key)
            if not refresh and cached and self._is_fresh(cached):
                return self._from_entry(cached)

            schedule = await self._schedule.fetch_from_api(
                origin_id, origin_name, destination_id, destination_name
            )
            self._store(route_key, schedule)
            return schedule.model_copy(update={"from_cache": False})

    def stale_cached_response(
        self,
        origin_id: str,
        destination_id: str,
        refresh: bool,
    ) -> ScheduleResponse | None:
        if refresh:
            return None
        entry = self._memory.get(self._route_key(origin_id, destination_id))
        if entry is None or self._is_fresh(entry):
            return None
        return self._from_entry(entry)

    async def refresh_background(
        self,
        origin_id: str,
        origin_name: str,
        destination_id: str,
        destination_name: str,
    ) -> None:
        route_key = self._route_key(origin_id, destination_id)
        lock = _route_locks.setdefault(route_key, asyncio.Lock())
        async with lock:
            entry = self._memory.get(route_key)
            if entry and self._is_fresh(entry):
                return
            schedule = await self._schedule.fetch_from_api(
                origin_id, origin_name, destination_id, destination_name
            )
            self._store(route_key, schedule)

    @staticmethod
    def _route_key(origin_id: str, destination_id: str) -> str:
        return f"{origin_id}:{destination_id}"

    def _is_fresh(self, entry: _MemoryCacheEntry) -> bool:
        age = datetime.now(timezone.utc) - entry.fetched_at
        return age.total_seconds() < CACHE_TTL_SECONDS

    def _from_entry(self, entry: _MemoryCacheEntry) -> ScheduleResponse:
        items = [ScheduleItem.model_validate(item) for item in entry.items]
        items = self._schedule.rehydrate_items(items)

        return ScheduleResponse(
            origin_id=entry.origin_id,
            origin_name=entry.origin_name,
            destination_id=entry.destination_id,
            destination_name=entry.destination_name,
            items=items,
            service_alert_count=entry.service_alert_count,
            fetched_at=entry.fetched_at,
            from_cache=True,
        )

    def _store(self, route_key: str, schedule: ScheduleResponse) -> None:
        self._memory[route_key] = _MemoryCacheEntry(
            origin_id=schedule.origin_id,
            origin_name=schedule.origin_name,
            destination_id=schedule.destination_id,
            destination_name=schedule.destination_name,
            items=[item.model_dump() for item in schedule.items],
            service_alert_count=schedule.service_alert_count,
            fetched_at=schedule.fetched_at,
        )
        self._evict_if_needed()

    def _evict_if_needed(self) -> None:
        while len(self._memory) > MAX_CACHE_ENTRIES:
            oldest_key = min(self._memory, key=lambda key: self._memory[key].fetched_at)
            self._memory.pop(oldest_key, None)
            _route_locks.pop(oldest_key, None)
