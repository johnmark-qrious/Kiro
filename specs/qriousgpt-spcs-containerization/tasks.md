---
status: approved
approvedBy: Archangel
approvedDate: 2026-06-17
---

# Tasks: QriousGPT SPCS Containerization

## Phase 1: Container Fixes (PR #1)

### Task 0: Resolve SPCS Network Policy Block + Validate Native Auth

**Effort:** 1-2 hrs (spike)
**Depends on:** Nothing — this is prerequisite for everything

**Files:**
- `spcs/spcs-setup.sql` (modify — add compute pool network rule if needed)
- `spcs/README.md` (modify — document network policy requirement)

**AC:**
- [ ] `SHOW NETWORK POLICIES` run, blocking policy identified
- [ ] Compute pool network rule created: `CREATE NETWORK RULE ... TYPE = COMPUTE_POOL MODE = INGRESS VALUE_LIST = ('DASH_POOL')`
- [ ] OR: SPCS internal IP range added to allowed list
- [ ] Verify: service can reach Snowflake APIs (no more 390422)
- [ ] Spike: confirm `/snowflake/session/token` file exists in running container (check via service logs or test endpoint)
- [ ] Spike: confirm native OAuth token works for Cortex Agents REST API calls

**Notes:**
- Native auth uses internal networking — may bypass the network policy entirely
- If native auth works, the network policy fix may only be needed for the EAI fallback path
- If native auth does NOT work for Cortex Agents REST API, fall back to PAT via Snowflake SECRET (Task 1-alt)

---

### Task 1: Replace PAT with SPCS-Native OAuth Auth

**Effort:** 2-3 hrs
**Depends on:** Task 0 (confirms native auth works)

**Files:**
- `server/lib/snowflake.js` (modify — read `/snowflake/session/token` instead of env PAT)
- `server/constants.js` (modify — remove PAT references)
- `spcs/spec.yaml.example` (modify — remove SNOWFLAKE_PAT env var)
- `spcs/spcs-setup.sql` (modify — add GRANT statements for service owner role)

**AC:**
- [ ] Backend reads token from `/snowflake/session/token` on each request (not cached — file is auto-rotated)
- [ ] `SNOWFLAKE_PAT` env var removed from spec.yaml.example
- [ ] Service owner role granted: USAGE on Cortex database/schema + warehouse
- [ ] Dual-path auth: token file exists → SPCS path, else → `SNOWFLAKE_PAT` from env
- [ ] `.env.example` updated: documents `SNOWFLAKE_PAT`, `SNOWFLAKE_HOST`, `SNOWFLAKE_ACCOUNT` for local dev
- [ ] `SNOWFLAKE_HOST` and `SNOWFLAKE_ACCOUNT` auto-detected in SPCS (env vars set by platform), read from `.env` locally
- [ ] Local dev works: `npm run start:server` with `.env` → agents load
- [ ] SPCS works: deploy without PAT → agents load via native token
- [ ] Docker local test works: `docker run --env-file .env` → agents load

**Abort condition:** If Cortex Agents REST API doesn't accept the SPCS OAuth token (it might only work for SQL connections), fall back to:
- Task 1-alt: Store PAT in Snowflake SECRET, reference via `secretKeyRef` in spec.yaml
- Still eliminates plaintext PAT from spec

---

### Task 2: Process-Aware Entrypoint

**Effort:** 1 hr
**Depends on:** Nothing

**Files:**
- `spcs/entrypoint.sh` (create)
- `Dockerfile` (modify — replace supervisord with entrypoint)
- `supervisord.conf` (delete)

**AC:**
- [ ] Entrypoint starts Node background + nginx foreground
- [ ] Either process dying → container exits (triggers SPCS restart)
- [ ] Uses trap + wait -n pattern
- [ ] supervisord removed from image
- [ ] Local test: docker run → kill Node → container exits

---

### Task 3: Multi-Stage Dockerfile

**Effort:** 1 hr
**Depends on:** Task 2

**Files:**
- `Dockerfile` (rewrite — add build stage)
- `spcs/README.md` (modify — remove "build locally first" instruction)

**AC:**
- [ ] Stage 1: node:18, install deps, run craco build
- [ ] Stage 2: node:18-alpine, prod deps only, copy build + server + nginx + entrypoint
- [ ] No local npm run build required before docker build
- [ ] `docker build --platform linux/amd64 -t dash:latest .` works from clean clone
- [ ] Image size ≤ 200MB

---

### Task 4: Deploy Script

**Effort:** 30 min
**Depends on:** Task 3

**Files:**
- `spcs/deploy.sh` (create)
- `spcs/deploy.ps1` (create — Windows)
- `spcs/README.md` (modify — add deploy section)

**AC:**
- [ ] Script: build → tag with git SHA → push to DASH_REPO → ALTER SERVICE
- [ ] Requires SNOW_CONNECTION env var
- [ ] Tags with git short SHA (not just :latest)
- [ ] Prints service status after deploy
- [ ] Documents rollback command

---

### Task 5: Cut Over + Verify

**Effort:** 30 min
**Depends on:** Tasks 1-4

**Files:**
- `spcs/spec.yaml.example` (final version)
- `spcs/README.md` (final version)

**AC:**
- [ ] New image pushed with SHA tag
- [ ] ALTER SERVICE succeeds
- [ ] `/health` and `/api/health` return 200 via ingress URL
- [ ] Agent selector loads (Cortex connectivity works)
- [ ] Old image tag documented as rollback

---

## Phase 2: Build Modernization (PR #2, after Phase 1 merges)

### Task 6: Vite Migration

**Effort:** 1-2 days
**Depends on:** Phase 1 complete

**Files:**
- `package.json` (modify — swap CRA/CRACO for Vite)
- `vite.config.ts` (create)
- `index.html` (move from public/ to root)
- `src/**` (rename REACT_APP_* → VITE_* or import.meta.env)
- `craco.config.js` (delete)
- `Dockerfile` (modify — build command: vite build)
- `tsconfig.json` (modify if needed)

**AC:**
- [ ] `npm run dev` starts Vite dev server, app works locally
- [ ] `npm run build` produces production bundle
- [ ] `docker build` works end-to-end
- [ ] All env vars resolved correctly
- [ ] No REACT_APP_ references remain
- [ ] Deploy to SPCS, verify via ingress URL

**Abort condition:** If >1.5 days spent and still broken, ship Phase 1 without Vite. Revisit later.

---

## Phase 3: CI/CD (Optional, future)

### Task 7: GitHub Actions Deploy Workflow

**Effort:** 1 day
**Depends on:** Phases 1-2

**Files:**
- `.github/workflows/deploy-spcs.yml` (create)

**AC:**
- [ ] Push to main → build image → push to DASH_REPO → ALTER SERVICE
- [ ] Requires GitHub secrets for Snowflake credentials
- [ ] Manual trigger option (workflow_dispatch)
- [ ] Reports success/failure

---

## Summary

| Phase | Tasks | Days | Outcome |
|-------|-------|------|---------|
| 1 — Container fixes | 1-5 | 2-3 | Proper secrets, self-contained build, one-command deploy |
| 2 — Build modernization | 6 | 1-2 | CRA removed, Vite, smaller bundles |
| 3 — CI/CD | 7 | 1 | Auto-deploy on push (optional) |
