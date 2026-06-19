# CSV Logic Consolidation

**Type:** Task / Tech Debt
**Priority:** Medium
**Project:** MCS FY2027 Modernization

---

## Summary

Consolidate 5 different CSV export patterns into 1 shared server-side approach. Replace unmaintained `jsonexport` library with `csv-stringify`. Add missing basics (BOM, injection protection, consistent date format).

---

## Why

1. **5 patterns, zero consistency.** Each export has different encoding, line endings, escaping, and failure modes. Bugs fixed in one pattern don't apply to others.
2. **Browser memory crashes.** Pattern B (sample results, fruit-level-data) loads entire datasets into browser memory before generating CSV. Large orchards crash mobile browsers.
3. **Missing basics.** No BOM (Excel shows garbled characters), no CSV injection protection, inconsistent date formats across exports.
4. **Unmaintained dependency.** `jsonexport` hasn't been updated since 2022. `csv-stringify` is actively maintained with streaming support.
5. **Security gap.** No CSV injection protection anywhere. A cell starting with `=SUM(...)` gets executed by Excel.

---

## Current State

| Pattern | Where Used | Issues |
|---------|-----------|--------|
| A: Server -> Blob -> SAS URL | block-association, hazards, orchard-info | **Best pattern.** Keep this. |
| B: Server JSON -> Client CSV | sample results, fruit-level-data | Large datasets in browser memory |
| C: data:text/csv URI | MA tracker, trend, measures, releases | No BOM, ~2MB size limit in some browsers |
| D: Manual string building | DispensationRequestList, SeasonRollover | No escaping, fragile, wrong line endings |
| E: XLSX workbook | Sample report | Fine (different format, leave as-is) |

---

## Target State

All exports use Pattern A:

```
UI component -> POST /api/download/{type} with filters
-> Next.js API route queries DB (Prisma)
-> csv-stringify (streaming) generates CSV
-> Upload to Azure Blob (temp-files container, 24h TTL)
-> Return { url, filename }
-> UI opens URL in new tab (browser handles download)
```

---

## Acceptance Criteria

- [ ] Shared `generateCsv(data, columns, options)` utility created using `csv-stringify`
- [ ] Utility includes: BOM, `\r\n` line endings, CSV injection protection, ISO 8601 date formatting
- [ ] Pattern B routes (sample results, fruit-level-data) generate CSV server-side
- [ ] Pattern C routes (MA tracker, trend, measures, releases) use server-side download endpoint
- [ ] Pattern D routes (DispensationRequestList, SeasonRollover) use shared utility
- [ ] `createCsvUrl()` client utility deleted
- [ ] `jsonexport` removed from `package.json`
- [ ] No CSV generation happens in the browser anymore
- [ ] All exports open correctly in Excel without manual encoding selection

---

## CSV Injection Protection

```typescript
function sanitizeCell(value: string): string {
    if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
    return value;
}
```

Applied in the shared utility. One place to enforce.

---

## Regression Testing

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Download sample results (small orchard, 20 rows) | CSV downloads, opens in Excel, correct encoding |
| 2 | Download sample results (large, 2000+ rows) | Downloads without browser freeze |
| 3 | Download MA tracker | CSV has BOM, correct columns, ISO dates |
| 4 | Download associations | Correct data, no garbled characters |
| 5 | Download hazards | Same as current but with BOM |
| 6 | Download on mobile (iPhone Safari) | No crash, file downloads to device |
| 7 | Data with commas, quotes, newlines in fields | Properly escaped |
| 8 | Data with `=SUM(A1)` in a field | Cell prefixed with `'` (escaped) |
| 9 | Download dispensation request list | Uses new utility, same data as before |
| 10 | Download season rollover export | Uses new utility, same data as before |

---

## Estimate

**1-2 days**

---

## Dependencies

- None. Can be done independently.
- CSV Download Performance ticket benefits from this being done first (shared utility exists) but doesn't require it.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Changing export format breaks grower workflows | BOM + `\r\n` + ISO dates is MORE compatible. But verify with a sample export before full rollout. |
| Pattern A requires Azure Blob access | Already used by 3 existing exports. Infrastructure exists. |
| Some exports have custom column ordering | Shared utility accepts `columns` config. Per-export customisation preserved. |
