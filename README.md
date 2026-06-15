# OpenTransit Sydney

A mobile-first Sydney Trains trip planner built with Transport for NSW Open Data.
Users can save frequent station-to-station trips, view upcoming train services, check platforms, line information, arrival times, and real-time delay status where available.

## Features

- Save frequent station-to-station trips
- View upcoming services for the next 6 hours
- Check platforms, line, arrival time, and delay status
- Guest mode with session storage
- Login/register with persistent saved trips
- Auto-refresh schedules every 60 seconds

## Tech Stack

| Layer          | Technologies                                       |
| -------------- | -------------------------------------------------- |
| Frontend       | React, TypeScript, Vite, Tailwind CSS, React Query |
| Backend        | FastAPI, SQLAlchemy, Alembic                       |
| Database       | PostgreSQL                                         |
| Infrastructure | Docker, Docker Compose, AWS-ready                  |
| Data           | Transport for NSW Open Data API                    |

## Architecture

The React frontend communicates with a FastAPI backend that handles trip lookup, authentication, saved trips, and database persistence.

Transport for NSW API requests are handled by the backend so that external API credentials are not exposed in the browser. Saved trips and user accounts are stored in PostgreSQL, while live schedule results are fetched from Transport for NSW Open Data and cached briefly by the backend.

## Quick Start

```bash
git clone https://github.com/Haochen-S/OpenTransit.git
cd OpenTransit
cp .env.example .env
docker compose up --build
```

Edit `.env` and set `TFNSW_API_KEY` and `JWT_SECRET` (min 32 characters) before first run.

- App: http://localhost:3000
- API health: http://localhost:8000/api/health
