---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-14T13:29:00+12:00
lastPublished:
---

# Process Compose Dev Stack

## Location
`C:\Projects\Experimental\process-compose-starter`

## What It Is
Centralized orchestrator for all local Ubiquity services. Single `dev up` starts everything with dependency ordering, health checks, and a dashboard.

## Dashboard
- URL: http://localhost:3000 (Vite + React)
- Process-compose API: http://localhost:8080 (Swagger at root)

## Current Services (dev-stack.yaml)

| Process | Namespace | Port | Depends On |
|---------|-----------|------|------------|
| mssql | databases | 1433 | - |
| connectors-infra | connectors | 4200 (Prefect) | - |
| connectors-api | connectors | 5000 | connectors-infra |
| aspire | backend | 15000 (dashboard), 50051 (remotingbridge gRPC) | mssql |
| platform-api-infra | platform | 5433 (Postgres), 6379 (Valkey), 7233 (Temporal) | - |
| platform-api-billing | platform | 50053 (gRPC) | platform-api-infra |
| admin-app | frontend | 3300 | aspire, platform-api-billing |

Note: See `.kiro/steering/run-backend.md` for the full port map (single source of truth).

## API Endpoints (process-compose on :8080)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /processes | GET | List all processes with status |
| /process/{name} | GET | Single process details |
| /process/logs/{name}/{endOffset}/{limit} | GET | Fetch log lines |
| /process/logs/ws | GET (WS) | Stream logs real-time |
| /process/start/{name} | POST | Start a process |
| /process/stop/{name} | PATCH | Stop a process |
| /process/restart/{name} | POST | Restart a process |
| /process/states/ws | GET (WS) | Stream state changes |
| /namespace/start/{name} | POST | Start all in namespace |
| /namespace/stop/{name} | POST | Stop all in namespace |

## Usage

```bash
cd C:\Projects\Experimental\process-compose-starter
dev up                    # start everything
dev up admin-app          # start admin + dependencies only
dev validate              # check YAML syntax
dev down                  # stop all
```

## Backlog (AI-Requested Improvements)

### 1. Log search/filter endpoint
**Why:** When debugging crashes, need to find errors in thousands of log lines. Currently must paginate through all output.
**Proposed:** `GET /process/logs/{name}/search?query=error&level=error`
**Value:** Jump straight to the problem instead of manual log scanning.

### 2. Start process with env var overrides
**Why:** Testing different configurations (e.g. pointing at dev vs local gRPC) requires editing .env files.
**Proposed:** `POST /process/start/{name}` with `{ "env": { "BILLING_GRPC_URL": "http://..." } }` in body
**Value:** Spin up test configurations on the fly without touching files.

### 3. Aggregate health status with last error
**Why:** When a service crashes and restarts, need to know why without pulling full logs.
**Proposed:** Add `last_error` field to process state response (last stderr/exception before exit).
**Value:** Instant diagnosis without a round-trip to logs.

### 4. Tail endpoint without offset
**Why:** Current API requires `endOffset` which means you need to know total log length first.
**Proposed:** `GET /process/logs/{name}/tail?lines=50` - most recent N lines, no offset needed.
**Value:** One call instead of two for the most common log access pattern.
