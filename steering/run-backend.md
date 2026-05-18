---
inclusion: manual
---

# Run Backend

Steps to start all Ubiquity backend services locally. Execute in order.
When asked to "run backend" or "start services" or "test locally", follow this file exactly.

## Prerequisites

- Docker Desktop running (Linux container mode)
- `u3-mssql-dev` container exists (created during initial setup)

## CRITICAL: Strip KIRO_FEED_JSON

Kiro CLI injects `KIRO_FEED_JSON` (~200KB) into the shell environment. Windows has a 65KB limit on environment blocks passed to child processes. The .NET backend's `uqhost` process will fail with:

> The environment block used to start a process cannot be longer than 65535 bytes.  Your environment block is 104662 bytes long.  Remove some environment variables and try again.

**Always remove it before starting dotnet processes:**

```powershell
Remove-Item Env:\KIRO_FEED_JSON -ErrorAction SilentlyContinue
```

This must happen in the same shell session that launches Aspire. It does NOT affect Kiro's operation (Kiro reads it before spawning the shell).

**TIMING IS CRITICAL:** `Start-Process` captures the environment at call time. If you remove the variable AFTER calling `Start-Process`, the child process already has the bloated env. The removal MUST happen BEFORE any `Start-Process` or `dotnet run` call.

## Local Port Map (Single Source of Truth)

All other docs should reference this section, not duplicate it.

| Port | Service | What It Hosts |
|------|---------|---------------|
| 1433 | MSSQL (Docker: u3-mssql-dev) | Backend database |
| 3300 | Admin app (Next.js) | Billing UI |
| 4200 | Prefect (Connectors) | Connector orchestration dashboard |
| 5000 | Connectors API (FastAPI) | Connector CRUD/run |
| 5433 | Postgres (Platform API) | Billing database (moved from 5432) |
| 6379 | Valkey (Platform API) | Cache |
| 8080 | MVC (IIS Express) | Legacy web app |
| 15000 | Aspire Dashboard | Service monitoring |
| 50051 | Remotingbridge (uqhost) | **Main gRPC gateway**: SessionService, AccountService, ListService, ServiceManagementService, FeatureService, MailoutService, CampaignService |
| 50052 | System service (uqhost) | Separate process, NOT the main gateway |
| 50053 | Billing API (platform-api) | PricingService, BillingReportService |

### Port Conflicts (resolved)

| Default Port | Conflict | Local Fix |
|------|-----------|-----------|
| 5432 | Connectors Postgres vs Platform API Postgres | Platform API moved to 5433 |
| 50052 | Backend system service vs Billing API default | Billing API moved to 50053 |

Do NOT revert these. They're in `docker-compose.yml`, `appsettings.Development.json`, and `.env`.

## Admin App .env (Local)

The admin app `.env` at `C:\Projects\GitHub\Ubiquity-WebApps\monorepo\apps\admin\.env` must have:

```
GRPC_BASE_URL=http://localhost:50051
BILLING_GRPC_URL=http://127.0.0.1:50053
```

- `GRPC_BASE_URL` points to the remotingbridge gRPC (port 50051) which hosts AccountService, SessionService, ListService, etc.
- `BILLING_GRPC_URL` points to the Billing API (port 50053, moved from default 50052 to avoid conflict)
- **MUST use `127.0.0.1` not `localhost`** for BILLING_GRPC_URL. On Windows, `localhost` resolves to `::1` (IPv6), but the Billing API binds to `0.0.0.0` (IPv4 only). Using `localhost` causes gRPC error code 14: "Error connecting to subchannel."

The `.env` file is gitignored - these are local-only values.

## Platform API (ubiquity-platform-api)

**Branch:** Always run off `master`. Feature branches may be missing required service implementations or migrations.

**SDK:** The `global.json` specifies the required .NET SDK version. If your installed SDK is slightly behind (e.g. 10.0.102 vs 10.0.103), update `global.json` locally to match your installed version. The `rollForward: latestFeature` setting should handle minor differences but sometimes doesn't.

**Migrations:** The Billing API auto-applies EF Core migrations on startup. No manual `dotnet ef database update` needed for local dev.

**Seed data:** The connector pricing seed ($250/month) is already on master via PR #80. No separate seeding step required.

**Downstream dependency:** The Billing API calls the backend remotingbridge service for session/account data. In `appsettings.json` this is `"System": "http://localhost:50051"` (remotingbridge port). Locally this is the same port - no override needed in `appsettings.Development.json`.

## Startup Sequence

```powershell
# 0. Pre-flight check (recommended - catches version mismatches before they bite)
& "$HOME\.kiro\scripts\proto-check.ps1"

# 1. Strip env bloat (MUST be first, before ANY Start-Process or dotnet run)
Remove-Item Env:\KIRO_FEED_JSON -ErrorAction SilentlyContinue

# 2. Verify Docker + MSSQL
docker ps --filter "name=u3-mssql-dev" --format "{{.Status}}"
# If not running: docker start u3-mssql-dev

# 3. Start Aspire (backend services + gRPC on :50052, dashboard on :15000)
Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory "C:\Projects\GitHub\QT-Ubi-UbiquityBackend\local\AppHost" -WindowStyle Minimized

# 4. Start Platform API infra (Postgres :5433, Valkey :6379)
cd C:\Projects\GitHub\ubiquity-platform-api
docker compose up -d postgres valkey

# 5. Start Billing API (gRPC on :50053)
Start-Process -FilePath "dotnet" -ArgumentList "run","--project","src/Domains/Billing/Billing.Api" -WorkingDirectory "C:\Projects\GitHub\ubiquity-platform-api" -WindowStyle Minimized

# 6. Start Connectors (Prefect :4200, API :5000)
cd C:\Projects\GitHub\Ubiquity-Connectors-Prefect\docker
docker compose up -d

# 7. Start Admin app (Next.js on :3300)
Start-Process -FilePath "bun" -ArgumentList "run","--filter","@monorepo/apps-admin","dev" -WorkingDirectory "C:\Projects\GitHub\Ubiquity-WebApps" -WindowStyle Minimized

# 8. Start Database app (Next.js on :3100) — this is the Connector management UI
# Needed when testing billing (connectors generate billing subscriptions)
Start-Process -FilePath "bun" -ArgumentList "run","--filter","@monorepo/apps-database","dev" -WorkingDirectory "C:\Projects\GitHub\Ubiquity-WebApps" -WindowStyle Minimized
```

## Verify

```powershell
@{50051="Remotingbridge gRPC"; 50053="Billing API"; 3300="Admin App"; 5000="Connectors API"}.GetEnumerator() | ForEach-Object {
    $r = Test-NetConnection -ComputerName localhost -Port $_.Key -WarningAction SilentlyContinue
    Write-Host "$($_.Value) (:$($_.Key)) - $($r.TcpTestSucceeded)"
}
```

Note: The backend services (13 uqhost processes) take 2-3 minutes to fully start due to staggered 10-second delays. The gRPC endpoint on :50052 is the last thing to come up.

## Accessing the App Locally

- **Normal browser access:** `https://engage.local` (via Caddy reverse proxy on :443, requires mkcert certs)
- **MVC app direct:** `http://engage.local:8080` (IIS Express, started by Aspire)
- **Admin app direct:** `http://localhost:3300` (Next.js dev server, no auth)
- **Admin app via MVC proxy:** `https://engage.local/admin/*` (auth-aware, requires login)

### Login Credentials (Local)

- Email: `t000000@spark.co.nz`
- Password: `570RGan1cn3!`

### Puppeteer Testing Limitations

- Puppeteer (MCP tool) CANNOT connect to `https://engage.local` due to self-signed cert and hostname resolution issues in the sandboxed browser
- Puppeteer CAN connect to `http://engage.local:8080` but login fails because auth cookies are `Secure` (HTTPS-only)
- For Puppeteer UI testing, use `http://localhost:3300` directly (bypasses auth, tests UI components only)
- For full auth-aware testing, use a real browser manually

## Don't Do This

- Don't start Aspire without removing KIRO_FEED_JSON first
- Don't change platform-api Postgres back to port 5432 (conflicts with connectors)
- Don't change Billing API back to port 50052 (conflicts with backend system service)
- Don't start Temporal unless you actually need workflow testing (it requires migration setup)
- Don't kill all `bun` or `node` processes when restarting admin app (it kills Kiro CLI). Kill by specific PID only.
- Don't navigate Puppeteer to `https://engage.local` (won't work - self-signed cert + hostname issue)
- Don't ask for permission to log in when testing locally - just do it