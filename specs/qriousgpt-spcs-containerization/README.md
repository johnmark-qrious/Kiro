# QriousGPT SPCS Containerization

**Repo:** https://github.com/ebonAtQrious/qriousgpt
**Branch:** dustin/stabilize-qriousgpt
**Local:** C:\Projects\GitHub\qriousgpt

## Quick Reference

- Snowflake account: qriousdatahub.ap-southeast-2
- SnowCLI connection: `qrious`
- SPCS objects: DASH_SPCS.APPS, DASH_REPO, DASH_POOL, DASH_SERVICE
- Ingress: https://mx6ie-sparknz-qriousdatahub.snowflakecomputing.app
- Users: ~10 (internal Qrious/Spark staff)

## Decision Record

- **Deathmatch (2026-06-17):** Option B (single container, Vite, secrets) won. Option A (keep CRA) killed. Option C (two-container) killed.
- **Mandatory pre-deploy:** Snowflake SECRETs for PAT, process-aware entrypoint with crash recovery
- **Execution strategy:** Ship container fixes first (Tasks 1-5), Vite migration separately (Task 6)
