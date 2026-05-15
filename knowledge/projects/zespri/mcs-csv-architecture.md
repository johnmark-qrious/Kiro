---
sync: draft
lastLocalEdit: 2026-05-13T21:32:00+12:00
---

# Zespri MCS - CSV Architecture & Consolidation Plan

## Current State: 5 Patterns, Zero Consistency

### Export (Download) - 5 Different Approaches

| Pattern | Where | Library | BOM | Line Endings | Issues |
|---------|-------|---------|-----|--------------|--------|
| A: Server → Blob → SAS URL | block-association, hazards, orchard-info | jsonexport | Yes | \r\n | Best pattern, but not used everywhere |
| B: Server JSON → Client CSV | sample results, fruit-level-data | jsonexport | Yes | \r\n | Large datasets held in browser memory |
| C: data:text/csv URI | MA tracker, trend, measures, releases | jsonexport | No | Mixed | No BOM, size limits |
| D: Manual string building | DispensationRequestList, SeasonRollover | None | No | \n | No escaping, fragile |
| E: XLSX workbook | Sample report | exceljs | N/A | N/A | Fine for its purpose |

### Import (Upload) - Client-Side Chunking

Current flow:
```
Browser reads entire file into memory
  → Splits into 100-row chunks (naive newline split)
  → Fires ALL chunks in parallel (Promise.all)
  → Each chunk POSTed independently to C# API
  → C# CsvApiBase parses + validates + saves per chunk
  → No transaction across chunks
```

**Why chunking exists:** Users upload large CSVs (thousands of rows). The C# Azure Function has request size limits and timeout constraints. Chunking was the workaround.

**Why it's broken:**
- No ordering guarantee (parallel upload)
- No transaction boundary (chunk 3 fails, 1/2/4/5 committed)
- Naive `\n` split corrupts quoted fields with embedded newlines
- File hash dedup meaningless (each chunk = different hash)
- No rollback on partial failure
- User can't tell which rows succeeded vs failed across chunks

---

## Better Approach: Batch Prefetch + SqlBulkCopy (No Orchestration Needed)

**Adversarial review (tournament-style) killed the Durable Functions proposal.** The 5-minute timeout was never the real constraint. The real problem is per-row DB lookups. Fix that and 10k rows processes in under 2 seconds.

### The Winning Architecture

```
Client uploads file to Azure Blob (2-5 seconds)
  → Next.js API route calls C# backend with blob reference
  → Backend pre-loads ALL reference data (5-6 queries, ~500ms)
  → Validates 10k rows in-memory against dictionaries/HashSets (~200ms)
  → SqlBulkCopy valid rows in one atomic operation (~500ms)
  → Returns { inserted: 9847, errors: 153, errorCsvUrl: "..." }

Total backend time: ~1-2 seconds for 10k rows
```

### Why This Works (The Math)

| Step | Time | Notes |
|------|------|-------|
| Pre-load reference data | ~500ms | 5-6 queries loading bounded sets |
| Validate 10k rows in-memory | ~200ms | Dictionary/HashSet lookups, O(1) per field |
| SqlBulkCopy valid rows | ~500ms | Single bulk operation, no EF overhead |
| Generate error CSV | ~200ms | Only if errors exist |
| **Total** | **~1.4 seconds** | 150x under the 5-min timeout |

### Reference Data Pre-Loading Strategy

| Lookup | Cardinality | Load Strategy |
|--------|-------------|---------------|
| Current season | 1 | Single query, cache for request |
| Orchards (KPIN→ID) | ~2,800 in NZ | `ToDictionaryAsync(o => o.Kpin, o => o.Id)` |
| Varieties | 5-10 | Load all into dictionary |
| GrowMethods | 10-20 | Load all into dictionary |
| Packhouses | ~50 | Load all into dictionary |
| Blocks (for relevant orchards) | Subset | `WHERE OrchardId IN (@ids)` |
| Existing records (dedup) | Subset | `SELECT CompositeKey WHERE SeasonId = @s` into HashSet |

### Why NOT Durable Functions

| Durable Functions solve... | This problem has... |
|---------------------------|---------------------|
| Multi-hour workflows | 1-2 second processing |
| Human-in-the-loop | No human steps |
| Cross-service coordination | Single service + DB |
| Unbounded work | Bounded (10k rows max) |
| Checkpoint/resume | Just retry (it's 2 seconds) |

Durable Functions add: orchestration state storage, replay semantics, cold start chains, debugging complexity, new billing model. All for a 2-second operation.

### What Needs to Change

| Change | Effort | Impact |
|--------|--------|--------|
| Refactor CsvApiBase to pre-load reference data | 2-4 hours | Eliminates 80k DB queries → 6 queries |
| Replace EF Core AddRange with SqlBulkCopy | 2-3 hours | 10x faster inserts |
| Upload whole file to blob (remove client chunking) | 2-3 hours | Fixes corruption/transaction bugs |
| Remove CsvUploadModal chunking logic | 1 hour | Simplifies client code |
| **Total** | **~1 day with AI** | **No new infrastructure** |

---

## Export Consolidation: One Pattern

### Target: All exports use Pattern A (server-side)

```
UI component → POST /api/download/{type} with filters
  → Next.js API route queries DB (Prisma)
  → csv-stringify (streaming) generates CSV
  → Upload to Azure Blob (temp-files container, 24h TTL)
  → Return { url, filename }
  → UI opens URL in new tab (browser handles download)
```

**Why Pattern A for everything:**
- Proper BOM for Excel
- Consistent \r\n line endings
- No browser memory issues (server generates, blob stores)
- Works for any size dataset (streaming)
- Single place to add CSV injection protection
- Single place to standardize date formats

**Migration path:**
1. Create shared `generateCsv(data, columns, options)` utility using `csv-stringify`
2. Move Pattern B routes (sample results) to generate server-side
3. Move Pattern C/D components to call server-side download routes
4. Delete `createCsvUrl()` client utility
5. Delete manual CSV builders in DispensationRequestList and SeasonRollover

---

## Security Fixes

### CSV Injection Protection (Add to Export)

```typescript
function sanitizeCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}
```

Apply to all cell values before CSV generation. One place if using a shared utility.

### File Size Limits

| Layer | Limit | Implementation |
|-------|-------|----------------|
| Client | 10MB | Check `file.size` before upload, show error |
| Next.js | 10MB | `bodyParser: { sizeLimit: '10mb' }` in API route config |
| C# | 10MB | Check `Content-Length` header before reading stream |

---

## Date Format Standard

**Decision: `yyyy-MM-dd` everywhere (ISO 8601)**

- Unambiguous (no dd/mm vs mm/dd confusion)
- Sortable as string
- C# `ZespriDateConverter` already accepts it
- Excel recognizes it

Apply in the shared `generateCsv` utility. One place to enforce.

---

## Libraries

| Current | Replace With | Why |
|---------|-------------|-----|
| `jsonexport` (unmaintained since 2022) | `csv-stringify` (actively maintained, streaming) | Better escaping, streaming support, configurable |
| Manual string building | Same `csv-stringify` utility | Proper quoting, injection protection |
| `exceljs` | Keep (XLSX only) | Different format, fine as-is |
| CsvHelper (C#) | Keep | Well-designed, ClassMap validation works |

---

## Effort Estimate

| Work | With AI |
|------|---------|
| Fix upload: Option 3 (quick fix - sequential + CSV-aware split) | 3-4 hours |
| Fix upload: Option 1 (full streaming redesign) | 1.5-2 days |
| Consolidate exports to Pattern A | 1-2 days |
| Add CSV injection protection | 1 hour |
| Standardize dates | 2-3 hours |
| Replace jsonexport with csv-stringify | 3-4 hours |
| Add file size limits | 30 min |
| **Total (Option 3 + export consolidation)** | **~3-4 days** |
| **Total (Option 1 + export consolidation)** | **~4-5 days** |

---

## Recommendation

**Short-term (this sprint):** Option 3 (fix chunking bugs) + CSV injection protection + file size limits. Low risk, fixes the critical issues.

**Medium-term (next sprint):** Consolidate exports to Pattern A + replace jsonexport. Eliminates 4 patterns down to 1.

**Long-term (when capacity):** Option 1 (full streaming upload). Best architecture but bigger change.
