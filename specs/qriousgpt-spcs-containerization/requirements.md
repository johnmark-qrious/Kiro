---
status: approved
approvedBy: Archangel
approvedDate: 2026-06-17
---

# Requirements: QriousGPT SPCS Containerization

## Problem

QriousGPT is deployed on Snowpark Container Services but the deployment process is manual, fragile, and has security gaps:
- CRA must be built locally before `docker build` (manual step, easy to forget)
- PAT is baked into spec.yaml env vars (plaintext secret in a file)
- supervisord manages processes (extra dependency, masks crashes)
- No deploy script or CI/CD — manual docker tag/push/ALTER SERVICE
- No rollback strategy documented

## Target State

Repeatable, self-contained Docker build with:
- Build happens inside Docker (no local pre-build)
- SPCS-native OAuth auth (no PAT at all) — reads `/snowflake/session/token` at runtime
- Process-aware entrypoint that exits on crash (lets SPCS restart)
- One-command deploy script with image tagging by git SHA
- Rollback = ALTER SERVICE with previous SHA tag
- Network policy resolved (SPCS compute pool allowed)

## Auth Strategy: SPCS-Native OAuth (Eliminates PAT)

SPCS automatically provides every container with:
- `/snowflake/session/token` — short-lived OAuth token, auto-rotated every few minutes
- `SNOWFLAKE_ACCOUNT` env var — account locator
- `SNOWFLAKE_HOST` env var — hostname for internal Snowflake connectivity

The Express backend should read the token from this file instead of using a PAT. This:
- Eliminates ALL secret management (no PAT, no Snowflake SECRET objects, no spec.yaml secrets)
- Uses internal Snowflake networking (no EAI needed, no network policy issues for auth)
- Token auto-rotates (no expiry concerns)
- Can't be leaked (token only works inside SPCS)

**Backend auth change:**
```javascript
// Before (PAT):
headers: { Authorization: `Bearer ${process.env.SNOWFLAKE_PAT}` }

// After (SPCS native):
const fs = require('fs');
function getToken() {
  return fs.readFileSync('/snowflake/session/token', 'utf8');
}
headers: { Authorization: `Bearer ${getToken()}` }
```

The service runs as the service user (owner role of the service). This role needs:
- USAGE on the Cortex Agents database/schema
- USAGE on the warehouse
- Any other privileges the app currently uses via the PAT user

**Network policy fix:** The current 390422 error happens because the PAT auth goes over the EAI (public internet path). Native auth uses internal networking — the network policy may not apply at all. This likely fixes both problems simultaneously.

**Fallback:** If native auth doesn't work for Cortex Agents REST API specifically (it's a REST API, not a SQL connection), keep PAT via Snowflake SECRET as documented fallback.

## Local Development Auth

The backend must work in both SPCS and local dev without code changes. Dual-path pattern:

| Environment | Auth Source | Config |
|-------------|-----------|--------|
| SPCS (prod) | `/snowflake/session/token` | Automatic — zero config |
| Local dev (native Node) | `SNOWFLAKE_PAT` in `.env` | Dev creates PAT in Snowflake UI |
| Local dev (Docker) | `SNOWFLAKE_PAT` via `--env-file .env` | Same `.env` file |

**Rules:**
- `.env` is gitignored — PAT never committed
- `.env.example` documents required vars (no values)
- Code auto-detects environment: token file exists → SPCS path, else → env var path
- Same API calls downstream regardless of auth source
- `SNOWFLAKE_HOST` for local dev comes from `.env` (not auto-provided like in SPCS)

## Architecture Decision: Single Container (Option B) + Native Auth

### Options Evaluated

| Option | Verdict | Reason |
|--------|---------|--------|
| A: Polish existing (keep CRA + supervisord) | KILLED | Dead-end, accumulates tech debt |
| B: Single container + Vite + secrets | DEPLOY | Right-sized, addresses all issues |
| C: Two-container split | KILLED | Over-engineered for ~10 users |

### Auth Options Evaluated

| Option | Verdict | Reason |
|--------|---------|--------|
| PAT in spec.yaml env var | KILLED | Plaintext secret, leaks via DESCRIBE SERVICE |
| PAT in Snowflake SECRET | FALLBACK | Better, but still manual credential management |
| SPCS-native OAuth (`/snowflake/session/token`) | DEPLOY | Zero secrets, auto-rotated, can't leak, internal networking |

### Deathmatch Results (2026-06-17)

| # | Challenge | Severity | Final |
|---|-----------|----------|-------|
| 1 | No crash recovery with & backgrounding | SERIOUS | WOUNDED — must implement entrypoint with trap+wait |
| 2 | CRA investment wasted | SERIOUS | KILLED — argues FOR migrating |
| 3 | Option C over-engineered | SERIOUS | KILLED — validates recommendation |
| 4 | Vite estimate optimistic | MINOR | WOUNDED — +1 day buffer |
| 5 | PAT in plaintext | FATAL→WOUNDED | Fix is trivial (30 min) but must be done |

### Wargame Results (2026-06-17)

**Key risks:**
- F1 (LIKELY): Vite migration breaks `REACT_APP_*` env vars → Mitigation: do Vite separately, abort if >1.5 days
- F2 (POSSIBLE): Snowflake SECRET syntax unclear → Fallback: keep env var (no worse than today)
- F3 (POSSIBLE): Backgrounded Node crashes silently → Mitigation: trap+wait entrypoint pattern

**Walk-away threshold:** If after 2 days no working `docker build` → ship secrets + entrypoint only, defer Vite.

## Constraints

- Must not break existing SPCS deployment during migration
- Old image tag must remain available for instant rollback
- SPCS charges per container — stay single-container
- No downtime acceptable (ALTER SERVICE with new image is near-instant on SPCS)

## Dependencies

- SnowCLI access (confirmed: connection `qrious`)
- Docker Desktop (local builds)
- GitHub repo write access
- Snowflake ACCOUNTADMIN or equivalent for CREATE SECRET
