---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-20T17:18:00+12:00
lastPublished:
---

# Connectors Local Dev & Zod Union Ordering Bug

## Local Dev: Use `just up` Not Docker

The `docker-compose.yml` `connectors-helper-server` container is the **legacy** approach. It requires CodeArtifact auth to rebuild and easily goes stale (was running v0.67.3 while local code was v1.2.10).

**Correct approach:** Run the API natively via `just up` from the repo root. This:
- Starts infra (Postgres, Prefect, MinIO) in Docker
- Runs the helper API directly from source via `uv run uvicorn`
- Always uses your local code (no image rebuild needed)
- Sets `ENVIRONMENT=local` (dev mode, bypasses auth)

If `just up` fails due to uv version mismatch, run manually:
```powershell
cd C:\Projects\GitHub\Ubiquity-Connectors-Prefect
$env:PREFECT_API_URL = "http://127.0.0.1:4200/api"
$env:ENVIRONMENT = "local"
$env:LOG_LEVEL = "DEBUG"
$env:PREFECT_LOGGING_TO_API_WHEN_MISSING_FLOW = "ignore"
Start-Process -FilePath "uv" -ArgumentList "run","uvicorn","connectors_interface_api.main:app","--port","5000","--host","0.0.0.0" -WorkingDirectory "C:\Projects\GitHub\Ubiquity-Connectors-Prefect" -WindowStyle Minimized
```

Prefect infra must be running first (port 4200). The old docker-compose stack keeps it up.

## Zod Union Ordering Bug (PR #216)

**Problem:** `z.union([SFTP, Azure, S3])` - Azure schema has all fields `.nullish()`, so it matches ANY object. When creating an S3 connector, Azure matches first, strips `role_name`/`role_arn` as unrecognized, sends `{}` to API - 422.

**Fix:** Reorder to `z.union([SFTP, S3, Azure])` - schemas with required fields first. Azure (all optional) goes last as the catch-all.

**Rule:** In Zod unions, always put schemas with required/discriminating fields before schemas with all-optional fields. The all-optional schema acts as a greedy catch-all.

**Affected file:** `packages/schemas/src/prefect-connector.schemas.ts` - both `BlockDataSchema` and `BlockCreationRequestSchema`.

## CodeArtifact Access

AWS profile for CodeArtifact: `UbiQuityControlCodeArtifact-882582158506` (SSO). The personal sandbox IAM user does NOT have cross-account access to CodeArtifact. Use the SSO profile via `aws sso login --profile UbiQuityControlCodeArtifact-882582158506`.
