# CSV Download Performance

**Type:** Task / Performance
**Priority:** Medium
**Project:** MCS FY2027 Modernization
**Related:** CSV Logic Consolidation (can be done in parallel but benefits from consolidation being done first)

---

## Summary

The data queries that feed CSV exports are slow. Reports API makes 24 sequential DB calls when they could run in parallel. C# API over-fetches with `.Include()` chains instead of projections. No caching on immutable data that gets re-queried by every viewer.

---

## Why

1. **Report pages take 2-3 seconds to load.** 24 sequential DB calls at 50-100ms each. Could be 100-200ms with parallelisation.
2. **Same data re-queried by every viewer.** Sample report data is immutable once cleared/failed. 10 users viewing the same report = 240 identical DB calls.
3. **C# API over-fetches.** Endpoints that feed CSV exports load full entity graphs (88 `.Include()` chains, 0 `.Select()` projections) when only specific columns are needed.
4. **Bug: `await` inside `Promise.all()`.** Industry trend report defeats its own parallelism.

---

## Sub-Tasks

### Sub-Task 1: Parallelise report queries

**What:** Wrap independent DB calls in `Promise.all()` in graphs.ts and tables.ts. Fix the `await` inside `Promise.all()` bug.

**AC:**
- [ ] `graphs.ts`: 16 sequential queries run in parallel where independent
- [ ] `tables.ts`: 8 sequential queries run in parallel where independent
- [ ] `industry-trend`: `await` removed from inside `Promise.all()`
- [ ] Response times measured before/after (target: 70% reduction for graphs, 60% for tables)
- [ ] No change to response shape or data

**Estimate:** 2-3 hours

---

### Sub-Task 2: Add caching for immutable report data

**What:** Cache report query results by sampleRequestId. Data is immutable once sample reaches Cleared/Failed/Completed.

**AC:**
- [ ] Cache key: `report:{sampleRequestId}:{type}` (graphs|tables)
- [ ] Cache invalidated on sample status change only
- [ ] TTL: 24 hours
- [ ] Second viewer of same report gets cached response (no DB queries)
- [ ] Cache storage: in-memory (acceptable for single-instance Azure App Service)

**Estimate:** 2-3 hours

---

### Sub-Task 3: C# API query optimisation for export-heavy endpoints

**What:** Add `AsNoTracking()`, `.Select()` projections, and remove unnecessary `.Include()` chains on endpoints that feed CSV exports.

**Endpoints to target:**
- `SearchSampleRequestResults` (POST) - feeds sample results CSV
- `SearchSampleRequestReleases` (POST) - feeds releases CSV
- `GetSampleRequestsAssociations` (POST) - feeds associations CSV

**AC:**
- [ ] Export-feeding endpoints use `AsNoTracking()` (read-only data)
- [ ] Queries use `.Select()` to return only columns needed for export (not full entity graphs)
- [ ] Response payload size reduced (measure before/after)
- [ ] No change to response shape (same fields, same data)
- [ ] Response time improved (target: 30-50% reduction on large result sets)

**Estimate:** 1-2 days

---

## Total Estimate

**2-3 days**

| Sub-Task | Layer | Effort |
|----------|-------|--------|
| 1. Parallelise queries | UI (Next.js) | 2-3 hours |
| 2. Add caching | UI (Next.js) | 2-3 hours |
| 3. C# query optimisation | C# API | 1-2 days |

---

## Acceptance Criteria (Overall)

- [ ] Report page load time reduced by 60%+ (measured via Dynatrace)
- [ ] Cached reports serve in <50ms on second view
- [ ] C# export endpoints return 30-50% smaller payloads
- [ ] No change to data correctness or response shapes

---

## Regression Testing

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Report page load (50+ results) | Loads in <1s (was 2-3s) |
| 2 | Report viewed by second user | Cached response, near-instant |
| 3 | Report after sample status change | Cache invalidated, fresh data |
| 4 | Sample results search (large result set) | Faster response, same data |
| 5 | Associations search (all packhouses) | Faster response, same data |
| 6 | Industry trend report | No sequential delay, same charts |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Parallelising queries hits DB connection pool limits | Azure SQL supports 100+ concurrent connections. 16 parallel queries is fine. |
| Caching serves stale data | Only cache immutable states (Cleared/Failed/Completed). Active samples never cached. |
| `.Select()` projections miss a field needed downstream | Verify response shape matches current output before/after. Run existing UI against optimised endpoints. |
