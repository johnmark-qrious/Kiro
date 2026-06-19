---
sync: draft
lastLocalEdit: 2026-06-08T17:08:00+12:00
---

# Connectors API Port 5000 Conflict

## The Problem

The `docker/docker-compose.yml` in Ubiquity-Connectors-Prefect starts a `connectors-helper-server` container that binds to port 5000. If you ALSO run `just api` (local uvicorn), both fight over port 5000.

## How It Worked Before

The Docker container (`docker-connectors-helper-server-1`) was the API all along. The Database app (WebApps) hits `http://localhost:5000` which routed to the Docker container. No local uvicorn was needed.

## When This Breaks

- Running `just api` while the Docker container is up → port conflict, random routing
- Running `just up` (uses `docker-compose.infra.yml`) → starts different infra containers that conflict with `docker/docker-compose.yml` containers (different project names, same ports)

## Correct Local Setup

Pick ONE approach:

### Option A: Docker container serves the API (simplest, previous setup)

```powershell
cd C:\Projects\GitHub\Ubiquity-Connectors-Prefect\docker
docker compose up -d
```

This starts: Postgres, Prefect Server, Prefect Worker, **Connectors Helper Server (port 5000)**, LocalStack.

Do NOT run `just api` — the Docker container handles it.

### Option B: Local uvicorn serves the API (for development/debugging)

```powershell
cd C:\Projects\GitHub\Ubiquity-Connectors-Prefect\docker
docker compose up -d database prefect-server prefect-worker-docker localstack
# Note: explicitly exclude connectors-helper-server
just api
```

Or stop the container after starting everything:

```powershell
docker stop docker-connectors-helper-server-1
just api
```

## Don't Do This

- Don't run `just up` if you already have `docker/docker-compose.yml` containers running (different compose project names = port conflicts)
- Don't run `just api` while `docker-connectors-helper-server-1` is running on port 5000
- Don't use `docker-compose.infra.yml` and `docker-compose.yml` simultaneously — they define overlapping services with different project names

## Version Note

The Docker container image may lag behind the local code. If you need to test recent changes to the Connectors API, use Option B. For normal connector creation/testing, Option A (Docker) is sufficient.
