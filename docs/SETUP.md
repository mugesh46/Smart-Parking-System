# Installation and Configuration

## Prerequisites

- Python 3.12
- Node.js 22
- Docker Desktop
- PostgreSQL 17 for non-Docker development
- CUDA-enabled GPU for production video inference

## Configuration

Copy `backend/.env.example` to `backend/.env` and update secrets, database URL,
payment keys, Google Maps key, and notification credentials.

## AI Model

Place model weights at `ai/models/yolo-parking.pt`. Start with an Ultralytics
vehicle model, then fine-tune on site camera images for best accuracy.

## Deployment

Use `deployment/docker-compose.yml` for local and small VM deployments. For AWS
or Azure, run PostgreSQL as managed database, put model artifacts in object
storage, and deploy backend/frontend containers behind HTTPS load balancing.
