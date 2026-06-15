# TfNSW Trip Planner integration

Reference: Trip Planner API v1 (`/v1/tp`), Swagger `tripplanner_v1_swag_efa11_20251002.yml`.

## Authentication

API requests use header-based authentication: `Authorization: apikey <token>`. The token is supplied through the backend environment variable `TFNSW_API_KEY`.

## Station data

Train stations are stored in PostgreSQL (`train_stations`). Records are imported from the Sydney Trains GTFS schedule feed (`/v1/gtfs/schedule/sydneytrains`) on first startup when the table is empty, then refreshed daily at 03:00 Australia/Sydney.

Source: `backend/app/services/station_sync_service.py`, `backend/app/scheduler.py`.

Client endpoints read from the database only (`GET /api/transit/stations/all`).

## GET /trip — journey search

Used for station-to-station schedules. Called from `backend/app/services/schedule_service.py`.

| Parameter           | Value                                             |
| ------------------- | ------------------------------------------------- |
| `outputFormat`      | `rapidJSON`                                       |
| `coordOutputFormat` | `EPSG:4326`                                       |
| `depArrMacro`       | `dep`                                             |
| `itdDate`           | `YYYYMMDD`                                        |
| `itdTime`           | `HHMM`                                            |
| `type_origin`       | `any`                                             |
| `name_origin`       | Origin `stop_id`                                  |
| `type_destination`  | `any`                                             |
| `name_destination`  | Destination `stop_id`                             |
| `calcNumberOfTrips` | `10` per request (paginated until 6-hour horizon) |
| `TfNSWTR`           | `true`                                            |
| `excludedMeans`     | `checkbox`                                        |
| `exclMOT_5`         | `1`                                               |
| `exclMOT_7`         | `1`                                               |
| `exclMOT_9`         | `1`                                               |
| `exclMOT_11`        | `1`                                               |

## GET /stop_finder

Used during GTFS import for stop ID validation when required. Not called on routine station list requests.

| Parameter           | Value                  |
| ------------------- | ---------------------- |
| `outputFormat`      | `rapidJSON`            |
| `coordOutputFormat` | `EPSG:4326`            |
| `type_sf`           | `any` or `stop`        |
| `name_sf`           | Search term or stop ID |
| `TfNSWSF`           | `true`                 |

## Application mapping

| OpenTransit endpoint            | Data source                 |
| ------------------------------- | --------------------------- |
| `GET /api/transit/stations/all` | PostgreSQL `train_stations` |
| `GET /api/transit/schedule`     | TfNSW `GET /trip`           |
