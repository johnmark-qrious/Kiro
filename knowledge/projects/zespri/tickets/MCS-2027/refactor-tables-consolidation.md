# Refactor: Consolidate Tables to Single DataTable Component

**Type:** Task / Tech Debt
**Priority:** Medium
**Project:** MCS FY2027 Modernization

---

## Summary

Replace `ZTable` (used in 47 files) and 8 other duplicate table implementations with a single `<DataTable>` component. Every consumer currently copy-pastes 10-15 lines of row rendering boilerplate. The existing sort implementation mutates parent state (bug-prone). The new component renders rows internally, sorts immutably, and eliminates ~700-1000 lines of duplication.

---

## Why

1. **47 files with copy-paste row rendering.** Every ZTable consumer manually maps data to cells in a `renderRow` function. Same 10-15 lines repeated 47 times. A column change means editing every consumer.
2. **Sort mutates parent state.** ZTable's `sortBy()` in `utils.tsx` calls `setData` on the parent component's state. This causes unexpected re-renders, breaks React's unidirectional data flow, and makes debugging sort issues painful.
3. **4 near-identical SeasonRollover tables.** Differ only in column definitions. ~200 lines of duplication.
4. **4 near-identical IndustryPricing tables.** Same Header/Cell pattern repeated 4 times.
5. **No shared column config format.** Each table defines columns differently (some use arrays, some use objects, some hardcode widths inline).
6. **Maintenance cost.** Adding a feature to "all tables" (e.g., loading skeleton, empty state, accessibility) means touching 55 files instead of 1.

---

## Scope

| What | Files | Action |
|------|-------|--------|
| ZTable consumers | 47 | Replace with `<DataTable>` |
| SeasonRollover tables | 4 | Merge into 1 generic usage of `<DataTable>` |
| IndustryPricing Header/Cell | 4 | Replace with `<DataTable>` column config |
| `useTableSort` hook | 1 | Promote to shared, use inside DataTable |
| **Total** | **55 files** | |

**Not in scope (leave as-is):**
- `TrendReport.tsx` (unique collapsible sections, standalone)
- `TooltipTable.tsx`, `InfoTable.tsx`, `SizeManagement` (legitimate HTML `<table>` uses, different purpose)

---

## DataTable Design (Tournament-Validated)

**Decision:** Custom component from scratch. TanStack Table rejected as overkill (no virtualisation needed, max ~200 rows per table).

**Based on:** SeasonRollover table pattern (`useTableSort` hook, immutable sort, auto-headers).

**Props:**

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];  // { key, header, render?, width?, sortable? }
  sortable?: boolean;
  scrollable?: boolean;
  equalWidth?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  renderRow?: (row: T) => ReactNode;  // escape hatch for complex cases
}
```

**Key behaviours:**
- Renders rows internally (no consumer boilerplate)
- Sort is immutable (`useMemo` + spread, no parent state mutation)
- Column widths configurable or auto
- Supports custom cell renderers via `columns[].render`
- `renderRow` escape hatch for tables that need full custom row markup

---

## Sub-Tasks

### Sub-Task 1: Build DataTable component + useTableSort hook

**What:** Create the shared `<DataTable>` component and promote `useTableSort` to a shared hook.

**AC:**
- [ ] `<DataTable>` component created with props above
- [ ] `useTableSort` hook extracted to shared location
- [ ] Sort is immutable (no parent state mutation)
- [ ] Supports: sortable columns, custom cell renderers, row click, empty state, scrollable mode
- [ ] Accessible: proper `<table>` semantics, `aria-sort` on headers, keyboard navigation for sort
- [ ] Storybook or standalone test page showing all modes

**Estimate:** 0.5-1 day

---

### Sub-Task 2: Migrate simple ZTable consumers (batch 1)

**What:** Migrate the simplest ZTable usages first - tables with basic columns, no custom row rendering, no complex interactions.

**Target:** ~15-20 files (admin lists: RolesList, TestGroups, ClearanceCriteria, Notifications, SapLogs, IndustryPricing x4, SeasonRollover x4, etc.)

**AC:**
- [ ] Each migrated table renders identically to before (same columns, same data, same sort behaviour)
- [ ] 10-15 lines of `renderRow` boilerplate removed per file
- [ ] SeasonRollover 4 tables merged into 1 reusable usage
- [ ] IndustryPricing 4 tables use shared column config
- [ ] No visual regression (same spacing, alignment, widths)

**Estimate:** 1-1.5 days

---

### Sub-Task 3: Migrate complex ZTable consumers (batch 2)

**What:** Migrate tables with custom row rendering, conditional formatting, action buttons in cells, or row click handlers.

**Target:** ~25-30 files (SampleRequestList, Associations, KpinList, HazardTable, MeasureList, etc.)

**AC:**
- [ ] Each migrated table uses `columns[].render` for custom cells or `renderRow` escape hatch where needed
- [ ] Action buttons (edit, delete, state change) still work
- [ ] Conditional formatting (status colours, warning icons) preserved
- [ ] Row click navigation still works
- [ ] Sort behaviour unchanged per table

**Estimate:** 1.5-2 days

---

### Sub-Task 4: Remove ZTable + cleanup

**What:** Delete the old `ZTable` component, remove `sortBy()` from utils.tsx, delete unused SCSS.

**AC:**
- [ ] `ZTable` component deleted
- [ ] `sortBy()` removed from `src/helpers/utils.tsx`
- [ ] Associated SCSS files cleaned up (11+ files with duplicate table class names)
- [ ] No imports of ZTable remain in codebase
- [ ] Build passes with no dead code warnings

**Estimate:** 1-2 hours

---

## Total Estimate

**3-5 days**

| Sub-Task | Effort |
|----------|--------|
| 1. Build DataTable | 0.5-1 day |
| 2. Simple migrations (batch 1) | 1-1.5 days |
| 3. Complex migrations (batch 2) | 1.5-2 days |
| 4. Cleanup | 1-2 hours |

---

## Acceptance Criteria (Overall)

- [ ] Single `<DataTable>` component used across all 55 files
- [ ] Zero copy-paste row rendering boilerplate in consumers
- [ ] Sort is immutable (no parent state mutation anywhere)
- [ ] All tables render identically to before (visual parity)
- [ ] All sort, filter, click, and action behaviours preserved
- [ ] `ZTable` component and `sortBy()` utility deleted
- [ ] ~700-1000 lines of duplication removed
- [ ] Build passes, no TypeScript errors

---

## Regression Testing

| # | Scenario | What to Check |
|---|----------|---------------|
| 1 | Sample Request list (Results tab) | Columns render, sort works, row click navigates to detail |
| 2 | Sample Request list (Releases tab) | Status colours correct, action buttons work |
| 3 | Associations table | TSP/SSP columns, bulk actions, filter interaction |
| 4 | KPIN list (2,800 rows) | Renders without lag, infinite scroll still works |
| 5 | Hazard table | Conditional icons, severity colours, edit/delete actions |
| 6 | Admin: Roles list | Simple table, sort by name/date |
| 7 | Admin: Test Groups | Sort, delete action |
| 8 | Admin: Clearance Criteria | Nested data display, activate/deactivate toggle |
| 9 | Season Rollover tables | All 4 config tables display correctly with single component |
| 10 | Industry Pricing tables | All 4 pricing tables display correctly |
| 11 | Column widths | Tables with explicit widths maintain them. Auto-width tables distribute evenly. |
| 12 | Empty state | Table with no data shows empty message (not blank space) |
| 13 | Mobile responsiveness | Tables with `scrollable` prop scroll horizontally on mobile |

---

## Migration Strategy

1. Build `<DataTable>` alongside existing `ZTable` (coexist)
2. Migrate in batches (simple first, complex last)
3. Each batch is a separate PR (reviewable in isolation)
4. Old and new components coexist until all 55 files migrated
5. Delete ZTable only after all consumers migrated and verified

---

## Dependencies

- None blocking. Fully independent.
- Benefits from Recoil -> Jotai being done first (if `useApiCall` hook is created, table consumers get simpler). But not required.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Subtle visual differences after migration | Screenshot comparison before/after for each table. Use Dynatrace session replay to compare. |
| Complex tables don't fit DataTable API | `renderRow` escape hatch exists. Accept that 2-3 tables may use it. |
| KpinList (2,800 rows) performance regression | No virtualisation needed (confirmed max ~200 rows in unpaginated tables). KpinList uses infinite scroll - test separately. |
| Sort order changes | `useTableSort` uses same comparison logic. Verify sort output matches for each sortable column. |
