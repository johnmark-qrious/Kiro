---
sync: draft
lastLocalEdit: 2026-05-13T23:20:00+12:00
---

# Zespri MCS - Pagination Strategy (Tournament-Validated)

## Verdict: Search-First + Circuit Breaker (Not Blanket Pagination)

**Tournament result:** "Add pagination everywhere" was KILLED. Three alternative defenders all agreed: the problem is unbounded data fetching, not rendering. Fix the root cause (enforce filters) and monitor the rest.

## The Evidence

- Zero production incidents related to list rendering
- NZ has ~2,800 orchards, grows 2-5% per year (physical ceiling)
- 9 of 14 unpaginated lists are bounded at 20-100 rows by domain constraints
- The 5 "dangerous" lists already have mitigations (infinite scroll, caps, filters)
- Real fires exist elsewhere (security, reports perf, .NET EOL)

## Action Plan

| Action | Effort | Priority |
|--------|--------|----------|
| Add `useCircuitBreaker` hook to all unpaginated lists | 2 hours | This sprint |
| MeasureList: make filters mandatory, remove 2500 cap | 3-4 hours | This sprint |
| Associations: don't load on mount, require filter first | 2-3 hours | Next sprint |
| ReleaseList: server-side pagination (dangerous during harvest) | 1 day | Next sprint |
| SapLogsList: already correct (search-first pattern) | 0 | Done |

## What NOT to Do

- Blanket pagination on all 14 lists (over-engineering)
- Virtual scrolling (overkill for current row counts)
- Any pagination on bounded admin lists (roles, test groups, criteria, notifications)

## Circuit Breaker Pattern

```tsx
const CIRCUIT_BREAKER_THRESHOLD = 500;

export const useCircuitBreaker = (data: unknown[], componentName: string) => {
  useEffect(() => {
    if (data.length > CIRCUIT_BREAKER_THRESHOLD) {
      window.dtrum?.reportCustomError(
        'circuit-breaker-triggered',
        `${componentName} returned ${data.length} rows (threshold: ${CIRCUIT_BREAKER_THRESHOLD})`
      );
    }
  }, [data.length]);
};
```

Fires Dynatrace alert if any "bounded" list unexpectedly exceeds 500 rows. 2 hours to implement across all lists. Tells you IF and WHEN a list becomes a real problem.

## Search-First Pattern (Follow SapLogsList)

The correct pattern (already proven in SapLogsList):
1. Don't load data on mount
2. Show filter panel with prompt: "Select filters to view results"
3. Require at least one meaningful filter (KPIN, date range, or sample number)
4. Role-based defaults (packhouse users auto-filter to their packhouse)
5. Server-side filtering (reduce what's fetched, not just what's displayed)

## List Classification

| Tier | Lists | Strategy |
|------|-------|----------|
| Already handled | KpinList, SampleRequestList, UsersList, ResidueSampleList | No change |
| Fix (search-first) | MeasureList, Associations, ReleaseList | Enforce filters / add server pagination |
| Monitor (circuit breaker) | RolesList, ClearanceCriteria, TestGroups, Kiwistart, Dispensation, IndustryPricing, Notifications, MaDispensationRules, SapLogs | Add hook, leave rendering alone |

## Tournament Note

Round 3 (Dark Architect final review) was not run on this tournament. The synthesis was declared by the orchestrator based on defender convergence. Future tournaments must include Round 3.
