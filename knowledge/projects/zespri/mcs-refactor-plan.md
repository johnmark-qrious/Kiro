---
sync: draft
lastLocalEdit: 2026-05-13T14:51:00+12:00
---

# Zespri MCS - Refactor Opportunities & Risk Assessment

> **Audit date:** 2026-05-13. Based on full codebase analysis.

## Executive Summary

~3,000-4,000 lines of pure duplication identified. 47 files use a broken table component. 91 files repeat the same API call boilerplate. 25+ modals follow identical patterns. The codebase works but is expensive to maintain and easy to introduce bugs into.

---

## 1. ZTable Replacement (Tournament-Validated)

**Winner: Custom DataTable from scratch (Option A)**
- Based on the SeasonRollover table pattern (created by Archangel) - `useTableSort` hook, immutable sort, auto-headers
- Expanded to cover ZTable use cases: column config, custom formatters, width control, scrollable, equalWidth modes
- No external dependency (TanStack Table rejected as overkill - no virtualization needed, max ~200 rows per table)

**Props:**
- `data`, `columns` (or `autoColumns`), `sortable`, `scrollable`, `equalWidth`, `emptyMessage`, `onRowClick`, `renderRow` (escape hatch)

**Covers 55 files:** 47 ZTable + 4 IndustryPricing Header/Cell + 4 SeasonRollover tables

**Key design decisions (tournament-validated):**
- Sort: uses `useTableSort` pattern (useMemo + spread, no parent state mutation)
- No virtualization (confirmed: max rows in any unpaginated table is ~200)
- KpinList edge case (2,800 rows via infinite scroll): switch to pagination if perf issue, don't add virtualization
- Renders rows internally (eliminates the 10-15 line copy-paste boilerplate per consumer)

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | Medium | 55 files touched, but each migration is mechanical |
| Rollback | Low | Old components can coexist during migration |
| Timeline risk | Medium | Batch in groups (simple lists first, complex last) |

---

## 2. useApiCall Hook (Auth + Loading + Error)

**Problem:** 91 files repeat: get auth from Recoil, set loading true, try/catch with API call, toast on error, set loading false. Auth headers (`["Authorization", auth.authorization]`) appear 186 times.

**Scale:** 91 files, ~300+ lines of boilerplate

**Proposal:** 
- `useApiCall()` hook handles try/catch/loading/toast
- Bake auth headers into the `api` helper automatically (read from Recoil/context)

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **Low-Medium** | Each migration is small (remove boilerplate, wrap in hook). But 91 files. |
| Test coverage | **Medium** | API call mocking in tests may need updating if the helper signature changes. |
| Business disruption | **None** | No behavior change. Same API calls, same error handling. |
| Rollback difficulty | **Low** | Hook is additive. Old pattern still works alongside it. |
| Dependency risk | **None** | Pure internal refactor. |
| Timeline risk | **Low** | Hook creation: 1 hour. Migration: can be done incrementally per component. |

**Mitigation:** Create hook first, migrate one component as proof, then batch-migrate. Old pattern continues working - no big-bang required.

---

## 3. FormModal Wrapper

**Problem:** 25+ modal components follow identical structure: loading state, load data on mount, validate, submit API call, success toast + close, error toast. 4 IndustryPricing modals are near-identical (differ only in field names).

**Scale:** 25+ modals, ~500-800 lines of duplication

**Proposal:** Generic `<FormModal>` handles open/close, loading, save/cancel buttons, error display. Children = just form fields.

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **Medium** | Modals have subtle behavioral differences (some load data, some don't; some validate async). Generic wrapper must handle all cases. |
| Test coverage | **Low** | Most modals have minimal test coverage. |
| Business disruption | **Low** | No logic changes. Visual/behavioral parity required. |
| Rollback difficulty | **Medium** | Once migrated, reverting means recreating boilerplate. But can be done per-modal. |
| Dependency risk | **None** | Internal component. |
| Timeline risk | **Medium** | Designing the generic API to cover all 25+ cases without over-engineering takes thought. |

**Mitigation:** Start with the 4 identical IndustryPricing modals (guaranteed win). Then HoldComment/ReleaseComment (identical pair). Expand to others only after pattern is proven.

---

## 4. ListPage Shell Component

**Problem:** 30 components duplicate the same page layout: close icon, header, filter bar, search/reset buttons, result count, loading panel, table. 11+ SCSS files duplicate identical class names.

**Scale:** 30 components, ~640-960 lines + ~500 lines CSS

**Proposal:** `<ListPage>` component accepts title, filters (render prop), columns, data, onSearch, onReset.

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **Medium-High** | Layout changes affect every list page. Subtle spacing/alignment differences between pages may be intentional. |
| Test coverage | **Low** | Layout components rarely have unit tests. Need visual regression. |
| Business disruption | **Low** | No logic changes. |
| Rollback difficulty | **High** | Once 30 components use the shell, changing the shell affects all of them. Must get the API right first. |
| Dependency risk | **None** | Internal component. |
| Timeline risk | **High** | Designing a flexible-enough shell for 30 different pages is the hard part. Risk of over-abstraction. |

**Mitigation:** Start with 3 simple list pages (KpinList, SapLogsList, RolesList). Validate the shell API covers their needs. Only then expand. Accept that complex pages (SampleRequestList) may not fit the shell.

---

## 5. useListQuery Hook

**Problem:** 8 list components independently implement: loading state, data state, page state, totalPages, doSearch function, useEffect on page change, error handling.

**Scale:** 8 components, ~400 lines

**Proposal:** `useListQuery<T>(fetcher, filters)` returns `{ data, loading, doSearch, reset, page, totalPages }`.

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **Low** | Each list's fetch logic is isolated. Hook replaces it 1:1. |
| Test coverage | **Medium** | Hook is easily unit-testable. Consumer tests may need mock updates. |
| Business disruption | **None** | Same data, same behavior. |
| Rollback difficulty | **Low** | Hook is additive. |
| Dependency risk | **None** | Internal hook. |
| Timeline risk | **Low** | Hook: 2 hours. Migration per component: 30 min. |

**Mitigation:** Lowest risk refactor. Do this early to build confidence.

---

## 6. FormActions Footer

**Problem:** 21 components render identical save/cancel button footer.

**Scale:** 21 components, ~100-170 lines

**Proposal:** `<FormActions onSave onCancel saveLabel loading disabled />`

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **Very Low** | Pure presentational. No logic. |
| Test coverage | **N/A** | Trivial component. |
| Business disruption | **None** | |
| Rollback difficulty | **Very Low** | |
| Dependency risk | **None** | |
| Timeline risk | **Very Low** | 30 min to create, 5 min per migration. |

**Mitigation:** None needed. Safe to do anytime.

---

## 7. Dropdown/Filter Merge

**Problem:** 3 separate dropdown components doing the same thing. Import confusion.

**Scale:** Many consumers, ~60 lines saved

**Proposal:** Merge into one `<SelectField>` with optional props.

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **Low** | Props may differ slightly between current implementations. |
| Test coverage | **Low** | Dropdown rendering rarely tested. |
| Business disruption | **None** | |
| Rollback difficulty | **Low** | |
| Timeline risk | **Low** | |

---

## 8. useCurrentSeason Hook

**Problem:** 7 files independently fetch current season with identical code.

**Scale:** 7 files, ~105 lines

**Proposal:** `useCurrentSeason(kpin?)` hook with caching.

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **Very Low** | Simple data fetch. |
| Rollback difficulty | **Very Low** | |
| Timeline risk | **Very Low** | 1 hour total. |

---

## 9. SampleRequestApi.cs Split (C# Backend)

**Problem:** 133KB, 2,420 lines, 10 endpoints, ~1,500 lines of private helpers. Self-admitted hacks. Untestable.

**Scale:** 1 file -> 5 files + 2 services

**Proposal:** Split into CrudApi, SearchApi, AssociationsApi, StateApi, CsvApi + ResultsService + ValidationService.

| Risk Factor | Rating | Detail |
|-------------|--------|--------|
| Regression risk | **High** | Core business logic. Any mistake = incorrect clearance decisions = incorrect grower payments. |
| Test coverage | **Very Low** | Only 1 test file exists (IsProvisionalResolverTests). No tests for the 10 endpoints. |
| Business disruption | **High** | This is the heart of the system. 100+ tests/day flow through these endpoints. |
| Rollback difficulty | **Medium** | Git revert is straightforward but deployment pipeline adds delay. |
| Dependency risk | **None** | Internal restructure. |
| Timeline risk | **High** | Needs comprehensive test suite BEFORE splitting. Without tests, you're flying blind. |

**Mitigation:** 
1. Write integration tests for all 10 endpoints FIRST (capture current behavior)
2. Extract services (no endpoint changes) - verify tests still pass
3. Split endpoints into separate files - verify tests still pass
4. Deploy to TST, run full regression with real data

---

## 10. Non-ZTable Table Patterns (Consolidation Opportunity)

Beyond ZTable (47 files), there are **4 additional table patterns** that should be consolidated:

### Pattern A: SeasonRollover Tables (4 near-identical components)

Files: `TZGBandTable.tsx`, `TZGCapTable.tsx`, `TasteBandTable.tsx`, `SizeBandTable.tsx`

All follow the exact same structure:
- Import shared `styles.module.scss`
- Use custom `useTableSort` hook (local, not shared with ZTable)
- Render `div.tableHeader` with clickable sort columns
- Render `div.tableRow` with `div.tableColumn` per cell
- Manual column rendering (no column config)

**Consolidation:** These 4 files are nearly identical. One generic `<ConfigTable data={data} />` component that auto-generates columns from object keys (which they already do for headers) would replace all 4.

**Savings:** ~200 lines (4 files x ~50 lines each -> 1 file of ~50 lines)

### Pattern B: TrendReport Table (Custom with CSV export)

File: `TrendReport.tsx`

- Fixed column widths array (`COL_WIDTHS = [14, 3, 3, ...]`)
- Manual header/row rendering with `div.tableHeader` / `div.tableRow`
- Built-in CSV export via `jsonexport`
- Collapsible sections per season

**Consolidation:** Unique enough to stay standalone, but the CSV export should use the shared utility (when created).

### Pattern C: HTML `<table>` Elements (3 uses)

| File | Purpose | Pattern |
|------|---------|---------|
| `TooltipTable.tsx` | Small data table inside tooltips | Standard `<table><thead><tbody>` |
| `InfoTable.tsx` | Key-value pairs in 3-column grid | `<table>` with grouped rows |
| `SizeManagement/index.tsx` | Checkbox grid for size bands | `<table>` with interactive cells |

**Consolidation:** These are legitimate HTML table uses (small, semantic, accessible). Leave as-is. They're not the same pattern as the data list tables.

### Pattern D: Duplicate Sort Implementations

| Location | Implementation |
|----------|---------------|
| `ZTable` | `sortBy()` in `src/helpers/utils.tsx` - mutates parent state via `setData` prop |
| `SeasonRollover/Tables/useTableSort.ts` | Local hook with `useMemo` - immutable, self-contained |
| `TrendReport` | No sort (static data) |

The `useTableSort` hook is actually **better** than ZTable's sort pattern (immutable, no external state mutation). When building the new `<DataTable>`, adopt `useTableSort`'s approach internally.

### Summary: What to Consolidate

| Pattern | Action | Effort |
|---------|--------|--------|
| 4 SeasonRollover tables | Merge into 1 generic `<ConfigTable>` | 2-3 hours |
| ZTable (47 files) | Replace with `<DataTable>` (already planned) | 3-4 hours |
| `useTableSort` hook | Promote to shared, use in DataTable | 30 min |
| TrendReport | Keep standalone, share CSV utility | 30 min |
| HTML tables (3 files) | Leave as-is (different purpose) | 0 |
| **Total additional** | | **~3-4 hours** |
| **2. Foundation** | #2 useApiCall hook, #5 useListQuery hook | Low | 2-3 days | None |
| **3. ZTable** | #1 DataTable replacement (simple tables first) | Medium | 3-5 days | Phase 2 (hooks used in new table consumers) |
| **4. Modals** | #3 FormModal (IndustryPricing first, then expand) | Medium | 3-4 days | Phase 2 |
| **5. Layout** | #4 ListPage shell (3 simple pages, then expand) | Medium-High | 3-5 days | Phase 2 + 3 |
| **6. Backend** | #9 SampleRequestApi split | High | 5-8 days | Integration test suite written first |

**Total estimated effort:** 3-4 weeks for phases 1-5 (frontend). Phase 6 (backend) is a separate initiative requiring test infrastructure investment first.

---

## Risk Matrix

```
         Low Effort ──────────────────── High Effort
    ┌─────────────────────────────────────────────┐
    │                                             │
H   │                        #9 SampleRequestApi  │
i   │                        split                │
g   │                                             │
h   │              #4 ListPage                    │
    │              shell                          │
R   ├─────────────────────────────────────────────┤
i   │                                             │
s   │  #3 FormModal    #1 ZTable replacement      │
k   │                                             │
    │  #2 useApiCall                              │
M   │                                             │
e   ├─────────────────────────────────────────────┤
d   │                                             │
    │  #7 Dropdown     #5 useListQuery            │
L   │  #6 FormActions                             │
o   │  #8 useSeason                               │
w   │                                             │
    └─────────────────────────────────────────────┘
```

**Start bottom-left, work toward top-right.** Never touch #9 without tests.


---

## Recommended Execution Order

| Phase | Items | Risk | Effort | Prerequisite |
|-------|-------|------|--------|--------------|
| **1. Quick wins** | #6 FormActions, #8 useCurrentSeason, #7 Dropdown merge | Very Low | 1 day | None |