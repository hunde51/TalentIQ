#!/usr/bin/env sh
set -eu

echo "[backend] Waiting for dependencies..."

# Run migrations on container startup
alembic upgrade head

echo "[backend] Starting API server"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
