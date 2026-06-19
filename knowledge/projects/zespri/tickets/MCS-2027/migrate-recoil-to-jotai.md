# Migrate State Management from Recoil to Jotai

**Type:** Task / Tech Debt
**Priority:** Medium
**Project:** MCS FY2027 Modernization

---

## Summary

Replace Recoil with Jotai for client-side state management. Recoil is abandoned by Meta (last meaningful commit 2023, no security patches, no React 19 support path). Jotai is actively maintained, smaller bundle, and API-compatible enough for a mechanical migration.

---

## Why

1. **Recoil is dead.** Meta stopped maintaining it. No releases since 2023. Open issues pile up with no response. It will break on a future React version with no fix coming.
2. **Security risk.** Unmaintained dependency = no patches for vulnerabilities discovered in future.
3. **React 19 compatibility.** Recoil has known issues with React concurrent features. Jotai is built for them.
4. **Bundle size.** Recoil ~79KB min+gzip. Jotai ~3.5KB. Meaningful reduction for a mobile-heavy user base (4,800 growers on phones during harvest).
5. **Developer experience.** New devs joining the project will find zero community support, stale docs, and a library npm marks as deprecated.
6. **Low effort, high safety.** Only 6 atoms and 1 synchronous selector. No atomFamily, no async selectors, no advanced features. Migration is a find-replace codemod.

---

## Scope

| Item | Count |
|------|-------|
| Atoms to migrate | 6 |
| Selectors to migrate | 1 (synchronous) |
| Files with hook usages | ~140 |
| Total hook call sites | ~463 |

**Mapping:**
- `useRecoilValue(x)` -> `useAtomValue(x)`
- `useRecoilState(x)` -> `useAtom(x)`
- `useSetRecoilState(x)` -> `useSetAtom(x)`
- `atom({key, default})` -> `atom(default)`
- `selector({key, get})` -> `atom((get) => get(...))` (derived atom)
- `RecoilRoot` -> `Provider` (Jotai)

---

## Acceptance Criteria

- [ ] All 6 Recoil atoms converted to Jotai atoms
- [ ] The 1 Recoil selector converted to a Jotai derived atom
- [ ] All ~463 hook usages updated to Jotai equivalents
- [ ] `RecoilRoot` replaced with Jotai `Provider` in `_app.tsx`
- [ ] `recoil` package removed from `package.json`
- [ ] No runtime errors or console warnings related to state management
- [ ] All existing unit/component tests pass without modification (or updated if they mock Recoil internals)
- [ ] Application builds successfully with no TypeScript errors
- [ ] Bundle size reduced (verify with `next build` output or bundle analyzer)

---

## Regression Testing

### Critical Paths (Manual or Automated)

| # | Area | What to Test | Why |
|---|------|-------------|-----|
| 1 | Login/Auth flow | Login, token refresh, logout, session expiry | Auth state likely stored in atoms |
| 2 | Sample Request creation | Full create flow end-to-end | Core workflow, state-heavy |
| 3 | Sample Request list/filters | Filter, sort, paginate | Shared filter state across components |
| 4 | Map view | Load map, interact with markers, switch views | Map state (viewport, selected orchard) |
| 5 | Clearance decisions | Approve/reject flow | Critical business logic |
| 6 | Multi-tab behaviour | Open 2 tabs, act in one, check the other | Recoil had implicit tab isolation via RecoilRoot |
| 7 | Permission-gated UI | Login as different roles (SSP, TSP, Zespri admin) | Permission atoms drive conditional rendering |
| 8 | Page navigation | Navigate between pages, check state persistence/reset | Verify atoms reset correctly on route change |

### Automated Checks

- [ ] Existing test suite passes (zero tolerance for new failures)
- [ ] Lighthouse performance audit (before/after comparison)
- [ ] No `recoil` imports remain anywhere in codebase (`grep -r "from 'recoil'" src/`)

---

## Approach

1. Install Jotai alongside Recoil (they coexist)
2. Run codemod (regex covers ~90% of call sites)
3. Manually fix remaining ~10% (any non-standard patterns)
4. Swap `RecoilRoot` for Jotai `Provider`
5. Remove Recoil from deps
6. Run full test suite + manual smoke test of critical paths
7. Deploy to DEV/TST, soak for a sprint before PPE/PRD

---

## Estimate

**2-3 days** (including testing). The migration is mechanical. Most time is in regression testing, not code changes.

---

## Dependencies

- None. Can be done independently of other modernization work.
- Recommended before App Router migration (fewer moving parts).

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Subtle re-render differences between Recoil and Jotai | Jotai re-renders on atom value change (same as Recoil). Test components that subscribe to multiple atoms. |
| Derived atom (selector) behaves differently | Only 1 synchronous selector. Verify output matches manually. |
| DevTools/debugging changes | Install `jotai-devtools` for equivalent debugging experience. |
