---
sync: draft
lastLocalEdit: 2026-05-14T00:08:00+12:00
---

# Zespri MCS - Knowledge Index

> Scan this first. Drill into linked files for detail.

## System at a Glance

- **What:** Kiwifruit maturity clearance system. 5,000 users. $400M in grower bonuses calculated annually.
- **Stack:** Next.js 14 (Pages Router) + Azure Functions v4 (.NET 6) + SQL Server + Prisma + EF Core
- **Pain:** 133KB god-class API, zero tests, secrets in repo, deprecated deps, 5 different CSV patterns
- **Locations:** UI: `C:\Projects\Experimental\Z\Zespri.MCS.UI` | API: `C:\Projects\Experimental\Z\API Source`

## Key Files (drill down)

| File | One-Line Summary |
|------|-----------------|
| [mcs-architecture.md] | System diagram, auth flow, domain model, entity relationships |
| [mcs-api-nextjs.md] | 120+ Next.js routes with caller tracing |
| [mcs-api-csharp.md] | 31 C# endpoints + SampleRequestApi split plan |
| [mcs-api-migration-plan.md] | Which Next.js routes should move to C# |
| [mcs-code-audit.md] | 5 critical security issues, 7 warnings, 7 oddities |
| [mcs-technical-debt.md] | Full debt registry (security, architecture, code smells, DB) |
| [mcs-refactor-plan.md] | Frontend refactor: DataTable, hooks, modals, layout (risk-rated) |
| [mcs-modernization.md] | Tech migrations: Jotai, MSAL, pnpm, Zod, mobile readiness |
| [mcs-legacy-patterns.md] | 193 manual auth headers, 82 useEffect fetches, 199 error handlers |
| [mcs-csv-architecture.md] | 5 CSV patterns → 1. Batch prefetch + SqlBulkCopy (no Durable Functions) |
| [mcs-reports-performance.md] | 24 sequential DB calls → Promise.all = 70% faster |
| [mcs-integration-test-strategy.md] | TestContainers + dacpac. Priority: state machine first. |
| [mcs-ui-unit-test-strategy.md] | High-value only: permissions, status logic, form validation |
| [mcs-pagination-strategy.md] | Search-first + circuit breaker. Don't paginate bounded lists. |
| [mcs-data-access-strategy.md] | Keep raw SQL in eapi.ts. Harden with Zod + .sql files + ADR. |
| [mcs-api-csharp-modernization.md] | .NET 8 migration path, service extraction, SDK upgrades |
| [mcs-business-context.md] | Domain: varieties, process flow, users, external systems |

## Critical Actions (Do First)

1. **Fix auth permission bug** (ZespriAuthorize null counting) - 10 min
2. **Fix reports Promise.all** - 30 min, 70% perf gain
3. **Auto-inject auth headers in api.ts** - 30 min, eliminates 193 manual passes
4. **Rotate all secrets** (committed to repo) - coordinate with team

## Tournament Decisions (validated)

| Decision | Verdict | Rationale |
|----------|---------|-----------|
| Durable Functions for CSV | KILLED | Batch prefetch + SqlBulkCopy processes 10k rows in 2 seconds |
| SCSS → Tailwind | KILLED | qubic-lib (unmaintained) forces dual system. Do SCSS consolidation instead. |
| TestContainers | SURVIVED | Dacpac extraction solves schema problem |
| DataTable design | Option A (custom) | Based on SeasonRollover pattern (Archangel's). No TanStack needed. |
| React Query | SURVIVED | Caching matters during harvest. Jotai first, then RQ. |
| Pagination everywhere | KILLED | Search-first + circuit breaker. Fix 4 dangerous lists only. |
| Prisma raw SQL | Status quo SURVIVED | FOR JSON PATH is correct. Harden, don't rewrite. |
| RAG support assistant | SURVIVED (conditions) | Scoped to "how-to" only. Pilot first. 6 conditions before prod. |
