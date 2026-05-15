---
sync: draft
lastLocalEdit: 2026-05-13T16:40:00+12:00
---

# Zespri MCS - Reports API Performance Analysis

## Root Cause: 24+ Sequential DB Calls

The reports API (`/api/reports/graphs` + `/api/reports/tables`) makes 24+ database calls sequentially when they could run in parallel. This is the primary performance bottleneck.

## graphs.ts - 16 Sequential Queries

Calls 7 stored procedures and 8 views, all awaited one after another:
- `sp_SampleReportMaturityAreaDetailsByUser`
- `sp_SampleReportColourAgainstCountSize`
- `sp_SampleReportRegressionLineColourAgainstSize`
- `sp_SampleReportRegressionLineDryMatterPercentageAgainstSize`
- `sp_SampleReportDryMatterAgainstCountSize`
- `sp_SampleReportPressureAgainstCountSize`
- `sp_SampleReportDaysFromFullBloomHistory`
- `sp_SampleReportDaysFromFullBloomMA`
- `vw_SampleReportSampleDistributions`
- `vw_SampleReportSampleBandDistributions`
- `vw_SampleReportColourSampleDetails`
- `vw_SampleReportBrixSampleDetails`
- `vw_SampleReportDryMatterSampleDetails`
- `vw_SampleReportPressureSampleDetails`
- `vw_SampleReportSeedSampleDetails`
- `vw_SampleReportFreshWeightSampleDetails`

Plus conditional: `vw_SampleReportSampleSizeBandResults` (Gold variety)

## tables.ts - 8+ Sequential Queries

- `sp_SampleReportMaturityAreaDetailsByUser`
- `vw_SampleReportMaturityResults`
- `vw_SampleReportSampleResultsSummary`
- `vw_SampleReportSampleSizeBandResults`
- `vw_SampleReportIndicativeAverageTZG`
- `Rep.RepMetricCalcClearanceOutput`
- Conditional: `hwSampleProfile()` (Hayward) or `getGold3()` (Gold3) add 1-2 more

## industry-trend - Bug: await Inside Promise.all()

```typescript
// BUG: await resolves BEFORE Promise.all sees it - runs sequentially
const [...] = await Promise.all([
    await client.season.findMany(...),
    await client.sampleType.findMany(...),
    await client.variety.findFirst(...),
]);
```

## Performance Impact

| Scenario | Current | After Fix |
|----------|---------|-----------|
| graphs.ts (16 calls × 50-100ms) | 800-1600ms | 100-200ms |
| tables.ts (8 calls × 50-100ms) | 400-800ms | 80-150ms |
| Combined (both called together) | 1.2-2.4s | 180-350ms |
| industry-trend (6 sequential lookups) | +120ms | +20ms |

## Additional Issues

| Issue | Route | Severity |
|-------|-------|----------|
| No caching (report data is immutable once completed) | All | Medium |
| O(n^2) pivot logic in industry-trend (nested filter inside reduce) | industry-trend | Medium |
| Redundant SeasonId query (already available from initial fetch) | tables.ts | Low |
| Duplicate `plotGraph("Hue")` call | graphs.ts | Low |
| Heavy JS post-processing for Gold3 size-band pivot | tables.ts | Medium |

## Fixes (Priority Order)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | `Promise.all()` independent queries in graphs.ts | 30 min | ~70% faster |
| 2 | `Promise.all()` independent queries in tables.ts | 30 min | ~60% faster |
| 3 | Remove `await` inside `Promise.all()` in industry-trend | 5 min | ~100ms saved |
| 4 | Cache by sampleRequestId (immutable data) | 2-3 hours | Eliminates repeat loads |
| 5 | Remove redundant SeasonId query | 5 min | 1 fewer call |
| 6 | Use Map-based grouping instead of nested filter in trend pivot | 30 min | Faster for large datasets |
| 7 | Move Gold3 pivot logic to SQL stored procedure | 2-3 hours | Reduces app-side CPU |

## Caching Strategy

Sample report data is immutable once sample reaches Cleared/Failed/Completed. Same report viewed by multiple users (grower, packhouse, admin). Every view re-runs all 24 queries.

Cache key: `report:{sampleRequestId}:{type}` (type = graphs|tables)
Invalidation: on sample status change only
TTL: 24 hours (or until status change)
Storage: in-memory (single instance) or Redis (multi-instance)

## What's NOT Slow

- `/api/reports/industry-trend/metrics` - lightweight lookup, 5-15 rows
- `/api/reports/industry-summary` - blob storage fetch, not DB-bound
- The JS post-processing (plotGraph, bandGraph) - operates on 60-150 items, fast
