# Deployment (Docker + Compose + Nginx)

This project is prepared for production-style deployment with:
- FastAPI backend
- Celery worker + Redis
- PostgreSQL
- Frontend served by Nginx
- HTTPS termination in Nginx
- Flower (Celery monitoring)

## 1) Prepare environment

From repo root:

```bash
cp deploy/.env.example deploy/.env
```

Edit `deploy/.env` and set strong values:
- `DATABASE_PASSWORD`
- `JWT_SECRET_KEY`
- `AI_API_KEY` (if used)
- SMTP settings (if used)

## 2) Build and run

```bash
docker compose --env-file deploy/.env up -d --build
```

Services:
- App: `https://localhost`
- API docs: `https://localhost/api/docs`
- Flower: `http://localhost:5555`

Note: If no TLS cert exists, Nginx auto-generates a self-signed cert in `nginx_certs` volume.

## 3) Migrations

Backend runs `alembic upgrade head` automatically on container startup.

## 4) Logs

```bash
docker compose logs -f backend
docker compose logs -f celery_worker
docker compose logs -f frontend
```

Container log rotation is configured (`max-size: 10m`, `max-file: 3`).

## 5) Health checks

```bash
docker compose ps
curl -k https://localhost/nginx-health
curl -k https://localhost/api/health
```

## 6) Monitoring

- Celery tasks: Flower on `http://localhost:5555`
- Service status: `docker compose ps`
- API health endpoint: `/api/health`

## 7) Stop

```bash
docker compose down
```

To remove volumes too:

```bash
docker compose down -v
```

## 8) Production TLS certs (recommended)

Replace self-signed cert with real cert/key inside the `nginx_certs` volume:
- `/etc/nginx/certs/tls.crt`
- `/etc/nginx/certs/tls.key`

Then restart frontend container:

```bash
docker compose restart frontend
```

## 9) Useful hardening next steps

- Restrict Flower with auth/reverse-proxy.
- Add centralized logs (Loki/ELK) and metrics (Prometheus + Grafana).
- Use managed Postgres and Redis in cloud.
- Rotate secrets via secret manager.
