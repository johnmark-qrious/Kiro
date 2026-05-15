---
sync: draft
lastLocalEdit: 2026-05-13T15:34:00+12:00
---

# Zespri MCS - API Migration Plan (Next.js -> C#)

## Rationale

Moving write operations and SP callers to C# consolidates business logic in one testable layer. Next.js becomes a pure read-only BFF. Integration tests only need to target the C# API.

**Target architecture:**
```
C# API: All writes, all business logic, all external APIs, all stored procs
Next.js: All reads, UI-specific transforms, Power BI tokens, CSV downloads
```

---

## Tier 1: Stored Procedure Callers (definitely move)

These are just thin wrappers around SQL stored procs - they belong in the service layer, not a BFF:

| Route | Why Move | SP Called |
|-------|----------|-----------|
| `/api/update-status` | Calls `[Stg].[USPSampleRequestStateUpdate]` | State machine logic |
| `/api/update-criteria` | Same SP, admin variant | State machine logic |
| `/api/sample-request` (PUT) | Calls `[Stg].[USPSampleRequestStateUpdate]` + notifications | External SSP/TSP API |
| `/api/duplicate-request` | Calls `[Stg].[USPDuplicateSampleRequest]` | Business logic |
| `/api/duplicate-area` | Calls `[Stg].[USPDuplicateMaturityArea]` | Business logic |
| `/api/season-rollover/activities/*` (8 routes) | Each calls a different SP | Admin operations |
| `/api/season-rollover/activities/update-current-season` | Raw SQL update | Critical data change |

## Tier 2: Write Operations with Complex Validation

| Route | Why Move |
|-------|----------|
| `/api/test-results` (PUT) | External TSP API, bulk insert with allocation validation |
| `/api/release` + `/api/release/provisional` | Bulk status updates with KPIN-scoped auth |
| `/api/orchard/hazard` (POST) | Creates hazard + cancels SRs + sends notifications |
| `/api/clearance-criteria-override` (POST) | Overrides clearance with audit log |
| `/api/admin/clearance-criteria/*` (all writes) | Complex criteria rule management |
| `/api/admin/test-group` (POST) | Upsert with dependency checks |

## Tier 3: External-Facing APIs (should be behind APIM with the rest)

| Route | Current Consumer | Why Move |
|-------|-----------------|----------|
| `/api/packhouse/fruit-results` | External packhouse systems | Rate-limited, should be with other external APIs |
| `/api/packhouse/sample-request-info` | External packhouse systems | Same |
| `/api/packhouse/sample-results` | External packhouse systems | Same |
| `/api/send/notification` | Azure Functions backend | Should be internal service call |
| `/api/ma-notifications` | Azure Function (15-min schedule) | Should be internal |

---

## Routes That Should STAY in Next.js

Pure reads with simple Prisma queries - faster and simpler as BFF routes:

| Route | Why Stay |
|-------|----------|
| `/api/filters` | Simple multi-table read, already migrated FROM C# for performance |
| `/api/kpin-list` | Paginated read with permission filtering |
| `/api/current-season` | Trivial single-row read |
| `/api/users`, `/api/roles` | CRUD with Prisma, no business logic |
| `/api/samplerequestsfilters/filter-set` | User preference CRUD |
| `/api/reports/*` | Read-only report data |
| `/api/powerbi/*` | Token exchange, Power BI specific |
| `/api/download/*` | CSV generation from views |
| `/api/size-management` | Simple config reads |
| `/api/industry-pricing/*` | CRUD on reference tables |
| `/api/incoming-measures` | Complex read query (no writes) |
| `/api/sap-logs` | Read-only log query |
| All tooltip routes | Simple reads |
| All validation routes | Simple existence checks |

---

## Effort Estimate

| Work | With AI |
|------|---------|
| Move Tier 1 (SP callers, 12 routes) | 2-3 days |
| Move Tier 2 (complex writes, 8 routes) | 2-3 days |
| Move Tier 3 (external APIs, 5 routes) | 1 day |
| Update Next.js to proxy to new C# endpoints | 0.5 day |
| **Total** | **5-7 days** |

Pairs naturally with service extraction - new C# endpoints become thin controllers calling extracted services.
