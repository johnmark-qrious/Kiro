---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-14T15:58:00+12:00
lastPublished:
---

# Ubiquity Local Development Setup

Source: Confluence "Local Environment Setup Guide" (page 11978506310) and child pages.

## CRITICAL: KIRO_FEED_JSON Environment Variable

Kiro CLI injects `KIRO_FEED_JSON` (~200KB) into the shell. Windows limits child process env blocks to 65KB. The .NET backend (`uqhost`) will crash with:

> The environment block used to start a process cannot be longer than 65535 bytes.

**Fix:** Before ANY `Start-Process` or `dotnet run` call:
```powershell
Remove-Item Env:\KIRO_FEED_JSON -ErrorAction SilentlyContinue
```

This does NOT affect Kiro. Timing matters: `Start-Process` captures env at call time.

## Required Tooling

- .NET 8.0 SDK
- Visual Studio 2022 (needs license via ServiceNow)
- Docker Desktop (WSL 2 enabled, Linux container mode, needs license via ServiceNow)
- SQL Server Management Studio (SSMS)
- Terraform
- AWS CLI + Session Manager Plugin
- Volta (JS tool manager): `volta install node yarn sass aws-ssm-session docker-mssql-restore`
- Chocolatey (Windows package manager)
- nuget CLI: `choco install nuget.commandline`
- mkcert: `choco install mkcert`
- Aspire: `dotnet workload install aspire`
- GitHub CLI: `winget install --id GitHub.cli` then `gh auth login`

## Private Package Access

### NuGet (for .NET packages)
Add to `%APPDATA%\NuGet\NuGet.Config`:
```xml
<packageSourceCredentials>
  <github>
    <add key="Username" value="USERNAME" />
    <add key="ClearTextPassword" value="YOUR_GITHUB_PAT" />
  </github>
</packageSourceCredentials>
```

### NPM (for @qriousnz packages)
Set system environment variable: `NODE_AUTH_TOKEN` = GitHub PAT with `read:packages` scope.

## AWS Setup

- SSO URL: https://qriousaws.awsapps.com/start
- Dev account ID: 449946921058
- Each dev gets a personal sandbox account with IAM user (AdministratorAccess)
- App settings stored in AWS SSM Parameter Store
- Import settings: copy `dev/UbiquitySettings.json` from Ubiquity-Dev Secrets Manager, then run `local\scripts\Import-SsmParametersCli.ps1 -FilePath "<path>"`
- Personal subdomain: `{name}.ubiquity-dev.co.nz` (Route 53 hosted zone in sandbox, NS delegation from dev account)

## Architecture (Local)

Uses .NET Aspire to orchestrate everything. One `dotnet run` from `local/AppHost` starts all backend services + Caddy reverse proxy. Frontend apps can be started manually from Aspire dashboard or via CLI args.

## Daily Workflow

1. Start Docker Desktop (Linux container mode)
2. Verify `u3-mssql-dev` container is running
3. `cd local/AppHost && dotnet run` (starts 13 backend services + Caddy)
4. Aspire dashboard at https://localhost:17000
5. Start frontend apps: `dotnet run mvc react` or start from dashboard

## Local URLs

| Service | Direct URL | Via Caddy (HTTPS) |
|---------|-----------|-------------------|
| MVC Website | http://localhost:8080 | https://engage.local |
| React App | http://localhost:3000 | https://react-engage.local |
| APIv2 | http://localhost:8081 | https://api.local |
| Aspire Dashboard | https://localhost:17000 | - |
| WebApps (database) | http://localhost:3100 | proxied via MVC at /database/* |
| WebApps (admin) | http://localhost:3300 | proxied via MVC at /admin/* |

## How WebApps Connect Locally

MVC acts as reverse proxy for Next.js apps. `settings.xml` has `FrontendProxyUrls`:
- `database` -> `http://localhost:3100`
- `admin` -> `http://localhost:3300`

Access via `https://engage.local/database/*` or `https://engage.local/admin/*`.

To run WebApps locally:
```bash
cd Ubiquity-WebApps
bun install
bun run --filter @monorepo/apps-database dev   # port 3100
bun run --filter @monorepo/apps-admin dev      # port 3300
```

## HTTPS Setup (one-time)

Uses Caddy + mkcert. From `local/caddy`:
```bash
mkcert -install
mkcert -key-file ./certs/engage.local-key.pem -cert-file ./certs/engage.local.pem engage.local
mkcert -key-file ./certs/react-engage.local-key.pem -cert-file ./certs/react-engage.local.pem react-engage.local
mkcert -key-file ./certs/api.local-key.pem -cert-file ./certs/api.local.pem api.local
```

Also need URL ACLs (admin terminal):
```bash
netsh http add urlacl url=http://engage.local:8080/ user=everyone
netsh http add urlacl url=http://api.local:8081/ user=everyone
```

## Hosts File

```
127.0.0.1 engage.local
127.0.0.1 react-engage.local
127.0.0.1 api.local
```

## Backend Services (13 total, managed by Aspire)

system, event, forms, list, mail, push, remotingbridge, share, smta, social, survey, txt, webhooks

All start automatically with 10-second delay. Require Docker + `u3-mssql-dev` container.

## Building .NET Solutions

First time:
```bash
nuget restore u3.sln
msbuild u3.sln
```

Then open in VS and Build Solution. Build order: u3.sln first, then mvc/mvc.sln, then apiv2/api2.sln.

## Git Hooks (Backend repo)

Uses Lefthook + commitlint. Setup: `npm install` from repo root.

## Debugging

Attach VS debugger to running service process. Find PID in Aspire dashboard Resources page.

## Login Credentials (Local)

- Email: `t000000@spark.co.nz`
- Password: `570RGan1cn3!`

## Backend Branching

Branches per versioned release: `release/X.XXX.X` (e.g. `release/1.178.0`). Default branch is usually the release currently in testing. Changes merge to release branch via PR for test deployment.

## Cost Note

Run `terraform destroy` in `tf/applications/ubiquity/` when done for the day to de-provision AWS sandbox resources.

## Platform API (ubiquity-platform-api) — Local Setup

Separate from the main backend. Runs its own Postgres + Valkey + Temporal via docker-compose.

**Repo:** `C:\Projects\GitHub\ubiquity-platform-api`
**Stack:** .NET 10, gRPC, PostgreSQL 17, EF Core, Temporal, Valkey

### Start locally:
```bash
cd C:\Projects\GitHub\ubiquity-platform-api

# Start infra (Postgres, Valkey, Temporal)
docker compose up -d

# Run the Billing API
dotnet run --project src/Domains/Billing/Billing.Api
```

### Ports:
| Service | Port |
|---------|------|
| Billing.Api (gRPC) | 50053 (moved from 50052) |
| JourneyBuilder.Api (gRPC) | 50051 |
| PostgreSQL | 5433 (moved from 5432) |
| Valkey (Redis-compatible) | 6379 |
| Temporal | 7233 |
| Temporal UI | 58080 |

### Ports & .env

See `.kiro/steering/run-backend.md` "Local Port Map" section for the full port matrix and correct `.env` values. That file is the single source of truth for local service ports.

## Process Compose (Centralized Dev Stack)

All services can be started together via process-compose at `C:\Projects\Experimental\process-compose-starter`.

**Dashboard:** http://localhost:3000

**Config:** `dev-stack.yaml` defines:
- `mssql` (namespace: databases) - SQL Server for backend
- `connectors-infra` (namespace: connectors) - Prefect server
- `connectors-api` (namespace: connectors) - Helper API on port 5000
- `aspire` (namespace: backend) - All 13 .NET backend services + Caddy
- `platform-api-infra` (namespace: platform) - Postgres + Valkey + Temporal
- `platform-api-billing` (namespace: platform) - Billing gRPC on port 50052
- `admin-app` (namespace: frontend) - Admin Next.js app on port 3300

**Start everything:**
```bash
cd C:\Projects\Experimental\process-compose-starter
dev up
```

**Start subset:**
```bash
dev up admin-app  # starts admin + its dependencies (aspire, platform-api-billing, etc.)
```
