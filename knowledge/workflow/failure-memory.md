# Failure Memory

A queryable log of approaches that failed during tasks. Agents check this before proposing solutions to avoid repeating dead ends.

## Format

Each entry:
```
### [date] [project] [task-context]
**Approach:** what was tried
**Why it failed:** root cause
**What worked instead:** the solution (or "unresolved")
```

## How to Use

- **Before implementing:** search this file for the domain/pattern you're about to touch
- **After a failure:** append a new entry immediately (don't wait until end of session)
- **Pruning:** entries older than 6 months with "what worked instead" filled in can be archived

## Log

### 2026-06-12 ubiquity-webapps biome-pre-commit-hook
**Approach:** Using lefthook/husky pre-commit to run biome check
**Why it failed:** Biome pre-commit hook segfaults on Windows. Known issue, no fix available.
**What worked instead:** Manual `biome check <files>` before committing. CI catches misses.

### 2026-06-12 ubiquity-webapps multi-commit-prs
**Approach:** Pushing multi-commit PRs when base is a merge commit
**Why it failed:** commitlint CI uses shallow clone (fetch-depth: commits + 1), can't resolve base SHA at merge commit boundary.
**What worked instead:** Squash to 1 commit on fresh branch off base. Real fix needs fetch-depth: 0 in CI yaml.

### 2026-06-12 ubiquity-platform-api localhost-grpc
**Approach:** Using `localhost` for BILLING_GRPC_URL in admin app .env
**Why it failed:** On Windows, `localhost` resolves to `::1` (IPv6) but Billing API binds `0.0.0.0` (IPv4 only). gRPC error code 14.
**What worked instead:** Use `127.0.0.1` explicitly. Must use IPv4 address.
