from app.services.route_schedule_cache_service import RouteScheduleCacheService
from app.services.schedule_service import ScheduleService
from app.services.tfnsw_client import TfNSWClient

_client = TfNSWClient()
schedule_service = ScheduleService(_client)
schedule_cache_service = RouteScheduleCacheService(schedule_service)
