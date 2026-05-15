---
sync: draft
lastLocalEdit: 2026-05-13T23:39:00+12:00
---

# Zespri MCS - Data Access Strategy (Tournament-Validated)

## Verdict: Keep Raw SQL, Harden It

The raw SQL in `eapi.ts` is correct. FOR JSON PATH IS the serialization layer. Don't rewrite, just harden.

## Why Raw SQL is Right Here

- `FOR JSON PATH` returns pre-shaped nested JSON in a single DB round-trip
- No ORM can replicate this without N+1 queries or manual assembly
- SQL Server UDFs (`dbo.udf_latest_date`), `STRING_SPLIT`, `JSON_QUERY` have no Prisma equivalent
- This is an external API (SSP/TSP polling) - performance is contractual
- The queries are stable (backed by `vw_samplerequest` view)

## Why C#/Node Duplication is Acceptable

| | Node.js (eapi.ts) | C# (SampleRequestApi) |
|---|---|---|
| Consumer | External SSP/TSP systems | Internal MCS UI |
| Contract | Flat JSON, dot-notation keys | Nested DTOs via AutoMapper |
| Volume | TOP 5000, bulk polling | Paginated, 20-50/page |
| Purpose | Raw data delivery | Domain computation + results |

Different consumers, different contracts. Not duplication - divergence by design.

## Hardening Actions (2 days)

| Action | Effort | What It Solves |
|--------|--------|----------------|
| Add Zod schemas on query responses | 4-6 hours | Catches schema drift at runtime |
| Extract SQL to .sql files | 2-3 hours | Syntax highlighting, reviewable diffs |
| Write ADR | 1-2 hours | Future devs don't try to "fix" it |
| Integration tests against real DB | 4-6 hours | Regression safety |
| Confirm parameterization (injection check) | 1 hour | Security |

## What NOT to Do

- Don't rewrite to Prisma ORM (FOR JSON has no equivalent)
- Don't move to C# (adds network hop, reverts a performance decision)
- Don't build TVFs yet (no DB CI/CD infrastructure exists)
- Don't convert simple routes to ORM as a dedicated effort (do opportunistically if already touching the file)

## Tournament Rulings

| Option | Result | Reason |
|--------|--------|--------|
| Prisma ORM | FATAL | Can't express FOR JSON PATH, would cause N+1 |
| Move to C# | FATAL | Adds latency, reverts measured perf decision |
| SQL Views/TVFs | Future state | Correct but needs DB CI/CD that doesn't exist |
| Hardened status quo | **WINNER** | 2 days effort, preserves performance, adds safety |

## Future: TVFs (Phase 2)

If/when Zespri builds DB migration CI/CD, revisit TVFs as single-source-of-truth for shared queries. Until then, SQL lives in app code.
