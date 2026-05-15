# Design Document: Connectors Billing Report UI (Admin App)

**PBI:** #3497804 — Connectors Billing Report UI
**Status:** Proposed (Awaiting Approval)
**Date:** 2026-05-05
**Backend Branch:** `release/1.178.0` (QT-Ubi-UbiquityBackend)

---

## 1. Requirements

### 1.1 PBI Acceptance Criteria

| # | Criterion | Implementation |
|---|-----------|---------------|
| AC1 | Billing report displays integration data in expandable account tree with rolled-up totals | BillingTreeTable: AccountRow (rolled-up items + total) → expandable LineItemRows |
| AC2 | Date range picker defaults to current billing cycle (26th-25th) with calendar and preset options for previous cycles | DateRangePicker fed by `GetBillingSchedule` API (dynamic, not hardcoded). Presets for previous N cycles. |
| AC3 | Account filter allows selection of specific account or all accounts, with hierarchical display. Default: All Accounts | AccountFilter dropdown using AccountService hierarchy. Root → child → grandchild. |
| AC4 | Table shows Items, Unit Price, and Total columns with correct calculations per line item | Columns from BillingLineItem: quantity (Items), unit_price, total. Parent rows show sum. |
| AC5 | Download CSV exports all visible data with current prices matching table columns | Server Action calls `DownloadBillingReport` with same filters as visible table. Columns match. |
| AC6 | Empty and zero-value states handled gracefully (blank cells for $0, empty state when no data) | 4 states: loading skeleton, empty (no data), error (API failure), draft period indicator. Blank cells for $0. |

### 1.2 Additional Requirements (Architect Discussion 2026-05-05)

| # | Requirement | Detail |
|---|-------------|--------|
| R1 | New Next.js app "admin" | Third app in `Ubiquity-WebApps` monorepo (`monorepo/apps/admin/`). Scaffolded from `templates/app/`. |
| R2 | Base path `/admin` | `next.config.js`: `basePath: "/admin"`, `assetPrefix: "/admin"`. No conflict with existing routes (verified). |
| R3 | Permission gate (admin-only) | FrontendAppProxy handles authentication but not authorization. Logged-in non-admin members could access the URL without this gate. Check admin role in session claims via `@monorepo/packages-auth`. |
| R4 | Billing cycle from API | Fetch `GetBillingSchedule`, derive period from `close_day_of_month`. Never hardcode 26th-25th. |
| R5 | Two gRPC transports | `billingTransport` (platform-api) and `backendTransport` (legacy u3). Separate services, separate hosts. |
| R6 | No pricing page | Pricing managed via EF Core migrations. No UI. Per architect meeting decision. |
| R7 | Health check route | `src/app/health/route.ts` returns 200. Path: `/admin/health`. Required for ALB. |
| R8 | Port 3300 (local dev) | Admin app runs on port 3300. Database = 3100. No collision. |

### 1.3 Dependencies (Must be in place for the app to function)

| # | Dependency | Detail | Repo |
|---|------------|--------|------|
| D1 | FrontendProxyUrls (5 envs) | Add `<item key="admin" value="..." />` to `settings.xml` in all environments. | `QT-Ubi-UbiquityBackend` (`release/1.178.0`) |
| D2 | Seed $250 connector pricing | EF Core migration: insert charge + price row (retail=250). | `qt-ubi-platform-api` |
| D3 | Proto package 3.8.0 (WebApps) | `@qriousnz/ubiquity-protos` must include `billing/v1` exports. | `ubiquity-protos` (already published) |
| D4 | CI paths-filter | Add `admin:` block to `build.yml` detect-changes. | `Ubiquity-WebApps` |
| D5 | Terraform deployment | `tf/admin/` with shared `fargate-web-service` module. Listener priority 210. | `Ubiquity-WebApps` |
| D6 | Billing API deployed | Must be reachable at `platform-api.internal.ubiquity-{env}.co.nz:50051`. | `qt-ubi-platform-api` (already deployed) |
| D7 | Billing SQS consumer | Connectors publish billing events to SQS. | `Ubiquity-Connectors-Prefect` (confirmed done) |
| D8 | Proto package 3.8.0 (Platform API) | Bump `Ubiquity.Protos` from 3.7.0 → 3.8.0 in `Directory.Packages.props`. Without this, Billing API returns `[unimplemented]` for RPCs the admin app calls. **Needs PR.** | `ubiquity-platform-api` |
| D9 | Proto package 3.8.0 (Backend) | Bump `Ubiquity.Protos` from 3.6.0 → 3.8.0 in `remotingbridge/core/remotingbridge.core.csproj` (and other projects referencing it). Without this, remotingbridge crashes on startup: `Could not load type 'MessageServiceBase'`. **Needs PR.** | `QT-Ubi-UbiquityBackend` |

### 1.4 settings.xml Exact Values

```xml
<!-- local -->
<item key="admin" value="http://localhost:3300" />

<!-- docker -->
<item key="admin" value="http://host.docker.internal:3300" />

<!-- dev -->
<item key="admin" value="https://admin-webapp.web.internal.ubiquity-dev.co.nz" />

<!-- test -->
<item key="admin" value="https://admin-webapp.web.internal.ubiquity-test.co.nz" />

<!-- prod -->
<item key="admin" value="https://admin-webapp.web.internal.ubiquity-prod.co.nz" />
```

### 1.5 Environment Variables (Admin App)

```env
APP_NAME=ubiquity-admin
PORT=3300
GRPC_BASE_URL=https://api.u3.internal.ubiquity-{env}.co.nz:50051
BILLING_GRPC_URL=https://platform-api.internal.ubiquity-{env}.co.nz:50051
SITE_NAME=UbiQuity
```

Local dev:
```env
APP_NAME=ubiquity-admin
PORT=3300
GRPC_BASE_URL=http://localhost:5001
BILLING_GRPC_URL=http://localhost:5052
SITE_NAME=UbiQuity
```

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Legacy MVC (.NET)                             │
│  FrontendAppProxy: /admin/* → http://localhost:3300 (local)     │
│                              → admin-webapp.internal (deployed)  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP Proxy (auth headers forwarded)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Admin App (Next.js 15 / React 19)                  │
│  basePath: /admin                                               │
│  Port: 3300 (local dev)                                         │
│                                                                 │
│  Route: /admin/billing → Billing Report page                    │
│                                                                 │
│  gRPC Clients (billing transport):                              │
│    BillingReportService → GetBillingReport, DownloadBillingReport│
│    PricingService       → GetCharges, GetDefaultPricing         │
│                                                                 │
│  gRPC Clients (backend transport):                              │
│    AccountService       → Account hierarchy (from system/v1)    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ gRPC (Connect protocol)
                               ▼
┌───────────────────────────────┐  ┌──────────────────────────────┐
│  qt-ubi-platform-api          │  │  Legacy Backend (u3)         │
│  (Billing API)                │  │  (AccountService)            │
│  Port: 5052 local / 50051 ALB│  │  Port: 5001 local / 50051 NLB│
│  Services:                    │  │                              │
│    BillingReportService       │  │                              │
│    PricingService             │  │                              │
│  DB: Postgres                 │  │                              │
└───────────────────────────────┘  └──────────────────────────────┘
```

---

## 3. Key Decisions (ADRs)

### ADR-001: New App in Existing Monorepo
**Decision:** New `admin` app in `Ubiquity-WebApps/monorepo/apps/admin/`.
**Why:** Follows established pattern. Shares packages. Architects confirmed.

### ADR-002: Base Path `/admin`
**Decision:** `/admin`. Verified no conflict in Routes.cs (only `administrators/` exists).
**Consequence:** Add to FrontendProxyUrls in all environments.

### ADR-003: Two gRPC Transports
**Decision:** Separate transports for billing API and legacy backend.
**Why:** Different services, different ALBs, different hosts in all environments.

### ADR-004: No Pricing Page
**Decision:** Skip. Pricing managed via EF Core migrations.
**Why:** Architect meeting decision (Brad + Stuart). <10 line items. Code-managed is sufficient.

### ADR-005: Billing Cycle from API
**Decision:** Fetch `GetBillingSchedule`, derive period from `close_day_of_month`.
**Why:** Cycle could change. Don't hardcode.

### ADR-006: Permission Gate
**Decision:** Admin role check using `@monorepo/packages-auth`.
**Why:** Billing data is sensitive. Must not be accessible to non-admin users.

---

## 4. Repo Changes Summary

### Repo 1: `Ubiquity-WebApps` (Primary)

| Area | Files |
|------|-------|
| App scaffold | `monorepo/apps/admin/` (from template) |
| Config | `next.config.js`, `package.json`, `.env.template`, `tsconfig.json` |
| gRPC | `src/lib/grpc-clients.ts`, `src/lib/grpc-session-interceptor.ts`, `src/config/env.ts` |
| Page | `src/app/billing/page.tsx`, `src/app/layout.tsx`, `src/app/health/route.ts` |
| Domain | `src/domains/billing/components/`, `src/domains/billing/utils/`, `src/domains/billing/types/` |
| CI | `.github/workflows/build.yml` (add admin paths-filter) |
| Terraform | `tf/admin/main.tf`, `tf/admin/terragrunt.hcl`, `tf/admin/variables.tf`, `tf/admin/environments/*.hcl` |

### Repo 2: `QT-Ubi-UbiquityBackend` (branch: `release/1.178.0`)

| Area | Files |
|------|-------|
| Settings | `mvc/settings.xml` — add admin to FrontendProxyUrls (5 environments) |

### Repo 3: `qt-ubi-platform-api`

| Area | Files |
|------|-------|
| Migration | EF Core migration: seed connector charge + $250 price |

---

## 5. Page Architecture — `/admin/billing`

### Component Tree

```
BillingPage (Server Component)
├── Data fetches:
│   ├── GetBillingSchedule() → current period
│   ├── GetBillingReport(account_id, period_start, period_end)
│   ├── GetCharges() → charge display names
│   ├── GetDefaultPricing() → unit prices
│   └── AccountService → account hierarchy
│
├── BillingReportClient (Client Component wrapper)
│   ├── PageHeader ("Billing Report" + subtitle)
│   ├── FilterBar
│   │   ├── DateRangePicker (calendar + billing cycle presets)
│   │   ├── AccountFilter (hierarchical dropdown, default: All)
│   │   └── ResetButton
│   ├── BillingTreeTable
│   │   ├── SortableColumnHeaders (Account, Type, Description, Send Date, Created/Activated, User, Items, Unit Price, Total)
│   │   ├── AccountRow (expandable, shows rolled-up items + total)
│   │   │   └── LineItemRow (individual billing line items)
│   │   └── EmptyState / ErrorState / DraftIndicator
│   └── DownloadCSVButton (primary action)
```

### UI States

| State | Trigger | Display |
|-------|---------|---------|
| Loading | Initial fetch | Skeleton placeholders for table and filters |
| Empty | No line items for period | "No billing data for this period" centered message |
| Error | API failure/timeout | Error boundary with retry button |
| Draft | Period status = DRAFT | Indicator badge: "Current period — data may change" |
| Zero value | unit_price or total = 0 | Blank cell (not "$0.00") |

### Table Columns

| Column | Source | Notes |
|--------|--------|-------|
| Account | AccountService (name) | Tree hierarchy display |
| Type | Charge.display_name | Joined from GetCharges() |
| Description | BillingLineItem.description | |
| Send Date | TBD from line item | |
| Created/Activated | BillingSubscription.activated_at | |
| User | TBD | |
| Items | BillingLineItem.quantity | |
| Unit Price | BillingLineItem.unit_price | Blank if $0 |
| Total | BillingLineItem.total | Blank if $0 |

---

## 6. Data Flow

### Report Load
1. Server Component fetches `GetBillingSchedule` → computes current period (close_day_of_month)
2. Fetches `GetBillingReport` with period + "all accounts"
3. Fetches `GetCharges()` + `GetDefaultPricing()` for display metadata
4. Fetches account hierarchy from AccountService
5. Passes all data as props to client component

### Filter Change (Client-Side)
1. User changes date range or account filter
2. Client triggers server action / revalidation with new params
3. Server re-fetches `GetBillingReport` with updated filters
4. Table re-renders with new data

### CSV Download
1. User clicks "Download CSV"
2. Server Action receives current filter params
3. Calls `DownloadBillingReport` (streaming) with same params
4. Collects chunks → returns as file download
5. Columns match visible table exactly

### Account Hierarchy Resilience
- Cache account data on first load
- If AccountService unavailable → show account IDs as fallback
- Billing data remains accessible regardless of AccountService status

---

## 7. Infrastructure

### Local Dev
- Docker Compose (Postgres, Valkey, Temporal) — existing in `qt-ubi-platform-api`
- Terragrunt (SQS) — existing
- Run: billing-api + billing-worker + admin app (`bun dev --port 3300`)
- Legacy MVC on IIS/Kestrel with `settings.xml` local environment

### Deployed (per environment)
- ECS Fargate task (standalone Next.js, ARM64)
- ALB listener rule (priority 210, host-header match)
- Route53 A record: `admin-webapp.web.internal.ubiquity-{env}.co.nz` → ALB
- ECR image: `webapp-admin-v{version}`
- CloudWatch logs

### Terraform Values per Environment

| Variable | Dev | Test | Prod |
|----------|-----|------|------|
| subdomain | admin-webapp | admin-webapp | admin-webapp |
| root_domain | ubiquity-dev.co.nz | ubiquity-test.co.nz | ubiquity-prod.co.nz |
| container_port | 3000 | 3000 | 3000 |
| health_check_path | /admin/health | /admin/health | /admin/health |
| listener_rule_priority | 210 | 210 | 210 |
| GRPC_BASE_URL | https://api.u3.internal.ubiquity-dev.co.nz:50051 | https://api.u3.internal.ubiquity-test.co.nz:50051 | https://api.u3.internal.ubiquity-prod.co.nz:50051 |
| BILLING_GRPC_URL | https://platform-api.internal.ubiquity-dev.co.nz:50051 | https://platform-api.internal.ubiquity-test.co.nz:50051 | https://platform-api.internal.ubiquity-prod.co.nz:50051 |

---

## 8. Proto Contract Reference

### BillingReportService (`@qriousnz/ubiquity-protos/billing/v1`)
- `GetBillingReport(account_id, period_start, period_end, page_size, page_token)` → `{line_items[], status, next_page_token}`
- `DownloadBillingReport(account_id, period_start, period_end)` → stream `{chunk: bytes}`
- `GetActiveSubscriptions(account_id)` → `{subscriptions[]}`
- `GetClosedPeriods()` → `{periods[]}`
- `GetBillingSchedule()` → `{schedule: {close_day_of_month, enabled}}`
- `GetBillingRunHistory(page_size, page_token)` → `{runs[], next_page_token}`

### PricingService (`@qriousnz/ubiquity-protos/billing/v1`)
- `GetCharges()` → `{charges[]: {id, name, display_name, domain, billing_type, billing_cycle, aggregation_method, position}}`
- `GetDefaultPricing(account_level)` → `{prices[]}`
- `GetPricing(account_id)` → `{prices[]}`
- `GetResolvedPrice(account_id, charge_name)` → `{price}`

### AccountService (`@qriousnz/ubiquity-protos/system/v1`)
- Account hierarchy (names, parent-child relationships)

---

## 9. Tech Debt / Future

| Item | Priority | Notes |
|------|----------|-------|
| Proxy SPOF | Low | All Next.js apps route through legacy MVC. Direct ALB routing needs auth reimplementation. |
| Pricing UI | Low | If pricing changes frequently, may need UI. Currently <10 items, code-managed. |
| Report pagination | Low | Small dataset now. `page_token` in proto ready for future scale. |
| Account hierarchy caching | Medium | Consider caching strategy if AccountService latency becomes an issue. |
