# Battle Plan: Connectors Billing Report UI

**PBI:** #3497804
**Strategy:** Maximum parallelism with blocking gates
**Rule:** No agent proceeds past a gate until the blocker is verified.

---

## Design Clarifications

- **Navbar/Header:** Use shared `@monorepo/packages-navbar` (same as database and journey-builder). Do NOT replicate the header from the Vercel prototype.
- **Pricing page:** Not in scope. No UI for editing prices.
- **Billing cycle:** Derived from API (`GetBillingSchedule`), never hardcoded.
- **Permission:** Admin-only. Non-admin authenticated users are blocked at the app level.

---

## Branch Strategy

> **Updated 2026-05-14:** Reviewer directed all PRs to merge directly into main. No feature branch integration PR needed.

| Repo | Source | Branch | Target | Status |
|------|--------|--------|--------|--------|
| `Ubiquity-WebApps` | `main` | `feature/admin-billing-ui-scaffold` | `main` | ✅ Merged (PR #190) |
| `Ubiquity-WebApps` | `main` | `feature/admin-billing-ui-data` | `main` | ✅ Merged (PR #198) |
| `Ubiquity-WebApps` | `main` | `feature/admin-billing-ui-components` | `main` | Not started |
| `QT-Ubi-UbiquityBackend` | `release/1.178.0` | `feature/admin-proxy-config` | `main` | Unpushed |
| `qt-ubi-platform-api` | `master` | `feature/connector-pricing-seed` | `master` | Uncommitted |

### Merge Order

Each PR merges directly into main. No integration PR needed.

---

## PR Strategy

| PR | Repo | Branch → Target | Tasks | Status |
|----|------|----------------|-------|--------|
| #190 | `Ubiquity-WebApps` | `feature/admin-billing-ui-scaffold` → `main` | Task 1 | ✅ Merged |
| #198 | `Ubiquity-WebApps` | `feature/admin-billing-ui-data` → `main` | Task 2 | ✅ Merged |
| #199 | `Ubiquity-WebApps` | `fix/add-billing-grpc-url-test-env` → `main` | Task 7 (partial) | ✅ Merged |
| TBD | `Ubiquity-WebApps` | `feature/admin-billing-ui-components` → `main` | Task 3 + 4 | Not started |
| TBD | `Ubiquity-WebApps` | TBD → `main` | Task 7 (CI/pipeline) | Not started |
| TBD | `QT-Ubi-UbiquityBackend` | `feature/admin-proxy-config` → `main` | Task 5 | Unpushed |
| TBD | `qt-ubi-platform-api` | `feature/connector-pricing-seed` → `master` | Task 6 | Uncommitted |

---

## QA Strategy

### Automated Checks (every task)

| Check | When | Agent |
|-------|------|-------|
| `typecheck` | After every task | Implementing agent |
| `bun run build` | After Tasks 1, 3, 4 | Implementing agent |
| `terraform validate` | After Task 7 | @infra agent |
| `.NET build` | After Tasks 5, 6 | @backend agent |

### QA Agent Review Points

| Gate | QA Scope | What @quality-assurance checks |
|------|----------|-------------------------------|
| After Task 1 | Scaffold sanity | Config correctness, env schema, gRPC client setup, no dead imports |
| After Task 2 | Data layer | Permission gate logic, period calculation edge cases, tree builder with empty/single/deep hierarchies |
| After Tasks 3+4 | Full feature | AC coverage, state handling (empty/error/draft/zero), filter interactions, CSV content correctness |
| Pre-PR | Final | Full typecheck, build, no console.logs, no TODOs, accessibility basics |

### Manual Testing (Developer)

| Scenario | How to Verify |
|----------|---------------|
| App boots locally | `bun dev`, visit `http://localhost:3300/admin/billing` |
| Proxy works | Run MVC locally, visit `https://engage.local/admin/billing` |
| Permission gate | Log in as non-admin member → should be blocked |
| Billing data renders | Seed test data via billing API, verify tree table |
| CSV download | Click download, verify file contents match table |
| Empty state | Query a period with no data → empty message shown |
| Date picker | Switch billing cycles, verify data refreshes |

---

## Execution Phases

### Phase 1: Foundation (3 parallel streams)

```
Agent A ─── Task 5: settings.xml (Backend)
Agent B ─── Task 6: EF Core seed (Platform API)
Agent C ─── Task 1: App scaffold (WebApps)
```

**Gate 1:** Task 1 complete + typecheck passes.
**QA:** @quality-assurance spot-checks scaffold (config, env, gRPC setup).

### Phase 2: Core + Infra (2 parallel streams)

```
Agent C ─── Task 2: Data layer + server component
Agent D ─── Task 7: CI + Terraform
```

**Gate 2:** Task 2 complete + typecheck passes.
**QA:** @quality-assurance reviews permission gate + period calculation + tree builder.

### Phase 3: UI Build (2 parallel streams)

```
Agent C ─── Task 3: UI components
Agent D ─── Task 4: CSV download
```

**Gate 3:** All tasks complete.
**QA:** @quality-assurance full AC coverage review.

### Phase 4: Ship

```
Agent C ─── Integration verification (build, typecheck, no errors)
         ─── Create PRs (all 3 repos)
         ─── Link PRs to PBI #3497804
```

---

## Agent Assignment

| Agent | Role | Tasks | Repo |
|-------|------|-------|------|
| Agent A | @backend | Task 5 | QT-Ubi-UbiquityBackend |
| Agent B | @backend | Task 6 | qt-ubi-platform-api |
| Agent C | @frontend | Tasks 1 → 2 → 3 | Ubiquity-WebApps |
| Agent D | @infra → @frontend | Task 7, then Task 4 | Ubiquity-WebApps |
| QA | @quality-assurance | Review at each gate | All |

---

## Timeline (Estimated)

```
T+0      ┌─ Agent A: Task 5 (settings.xml)
         ├─ Agent B: Task 6 (EF Core seed)
         └─ Agent C: Task 1 (scaffold)

T+5min   ── Agent A: DONE → PR1 ready
T+30min  ── Agent B: DONE → PR2 ready
T+45min  ── Agent C: Task 1 DONE
         ── QA: scaffold spot-check
         ── ═══ GATE 1 ═══

T+50min  ┌─ Agent C: Task 2 (data layer)
         └─ Agent D: Task 7 (CI + Terraform)

T+1.5hr  ── Agent D: Task 7 DONE
T+2.5hr  ── Agent C: Task 2 DONE
         ── QA: data layer review
         ── ═══ GATE 2 ═══

T+2.5hr  ┌─ Agent C: Task 3 (UI components)
         └─ Agent D: Task 4 (CSV download)

T+3hr    ── Agent D: Task 4 DONE
T+5hr    ── Agent C: Task 3 DONE
         ── QA: full AC review
         ── ═══ GATE 3 ═══

T+5.5hr  ── Integration verify + PRs created
         ── ALL OBJECTIVES SECURED ✓
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Proto package 3.6.0 doesn't have billing | Verify import compiles in Task 1 scaffold |
| Billing API unreachable locally | Can develop against types only; test with API later |
| Port 3300 conflicts | Check before starting; reassign if needed |
| Design mismatch (Vercel prototype) | Use shared navbar; ask Archangel for screenshots of table/filter layout |
| settings.xml merge conflict | Task 5 is tiny, merge early |
