from datetime import datetime

from pydantic import BaseModel, Field


class Station(BaseModel):
    id: str
    name: str


class SavedTripCreate(BaseModel):
    origin_id: str = Field(min_length=1, max_length=64)
    origin_name: str = Field(min_length=1, max_length=255)
    destination_id: str = Field(min_length=1, max_length=64)
    destination_name: str = Field(min_length=1, max_length=255)


class SavedTripResponse(BaseModel):
    id: int
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TripAlert(BaseModel):
    id: str | None = None
    title: str | None = None
    priority: str | None = None


class ScheduleItem(BaseModel):
    line_code: str | None = None
    line_name: str | None = None
    origin_name: str | None = None
    platform: str | None = None
    destination_name: str | None = None
    destination_platform: str | None = None
    departure_planned: str | None = None
    departure_estimated: str | None = None
    arrival_planned: str | None = None
    arrival_estimated: str | None = None
    minutes_until_departure: int | None = None
    is_realtime: bool = False
    is_on_time: bool = True
    delay_minutes: int | None = None
    status_text: str = "On time"
    occupancy: str | None = None
    occupancy_level: int | None = None
    has_alert: bool = False
    alerts: list[TripAlert] = []


class ScheduleResponse(BaseModel):
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    items: list[ScheduleItem]
    service_alert_count: int = 0
    fetched_at: datetime
    from_cache: bool = False
