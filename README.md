# AI-Powered Smart Parking System

Production-oriented starter for a computer-vision smart parking platform. The
system detects occupied and vacant slots from camera feeds, exposes FastAPI
services, provides a React dashboard, stores normalized parking data, and
includes deployment and documentation assets.

## Modules

- `backend/` - FastAPI REST API, authentication, reservations, analytics, and payments.
- `ai/` - OpenCV/Ultralytics detection pipeline, slot occupancy logic, and forecasting baseline.
- `frontend/` - React + Vite + Tailwind driver/admin dashboard.
- `database/` - PostgreSQL schema and seed data.
- `deployment/` - Docker, Compose, NGINX, and GitHub Actions workflow.
- `docs/` - Architecture, API, UML/ER diagrams, setup, testing, and report outline.
- `tests/` - Backend API tests.

## Quick Start

```bash
docker compose -f deployment/docker-compose.yml up --build
```

Services:

- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Local Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Local Frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials

- Admin: `admin@smartparking.local` / `ChangeMe123!`
- Driver: `driver@smartparking.local` / `ChangeMe123!`

## Notes

YOLO weights are intentionally not committed. Put your trained or downloaded
model at `ai/models/yolo-parking.pt`, or set `YOLO_MODEL_PATH` in the backend
environment.
