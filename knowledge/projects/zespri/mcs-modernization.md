---
sync: draft
lastLocalEdit: 2026-05-13T14:54:00+12:00
---

# Zespri MCS - Modernization & Mobile Readiness

## Mobile Support: Currently NONE

No viewport meta tag. 12 total @media queries in 70+ SCSS files (4 are print-only). Tables have `min-width: 65rem`. No hamburger nav. No touch targets. This is a desktop-only app.

### Mobile Effort Estimate

| Approach | Effort | Result |
|----------|--------|--------|
| Basic responsive (scroll tables, collapse nav, stack layouts) | 3-4 weeks | Usable but not great |
| Full responsive (card views for tables, mobile forms, touch targets) | 6-8 weeks | Proper mobile UX |
| Separate mobile views | 10-12 weeks | Not recommended (doubles maintenance) |

### Recommended Phased Approach

**Phase 1 (1 week):** Viewport meta, horizontal scroll on tables, hamburger nav, stack landing tiles
**Phase 2 (2-3 weeks):** Card layout mixin for tables below 768px, single-column forms, fix action bar
**Phase 3 (2 weeks):** Touch targets (44px min), full-screen modals on mobile, PWA manifest

### Key Blockers
- ZTable uses percentage-based column widths (8+ columns = unreadable on mobile)
- Landing page tiles are fixed 22rem x 11rem
- Banner user menu uses `position: fixed; top: 11%; right: 1%`
- No breakpoint variables used despite being defined in qubic-lib

---

## Technology Migration Assessment

### Priority Order (urgency + safety)

| # | Migration | Effort | Risk | Benefit | Incremental? |
|---|-----------|--------|------|---------|--------------|
| 1 | **adal-angular -> MSAL** | 2-3 days | Medium | Security (ADAL deprecated, no patches) | No (big-bang, but isolated to 2 files) |
| 2 | **Recoil -> Jotai** | 1 week | Low | Maintained lib, 85% smaller bundle, same API | Yes (atom by atom, coexist) |
| 3 | **npm -> pnpm** | 2 hours | Low | Faster installs, strict deps, disk savings | Big-bang (low risk) |
| 4 | **Jest -> Vitest** | Half day | Low | Faster, native ESM. But only 5 tests exist. | Big-bang (trivial) |
| 5 | **Yup -> Zod** | 1-2 weeks | Low | Better TS inference, ecosystem standard | Yes (route by route) |
| 6 | **SCSS -> Tailwind** | 2-3 weeks | Medium-High | Co-located styles, faster iteration, purged CSS | Yes (component by component) |
| 7 | **Pages -> App Router** | Defer | High | RSC, streaming, layouts. But requires 1+2 done first. | Partial (pages/ and app/ coexist) |

---

### Detailed Analysis

#### Recoil -> Jotai (RECOMMENDED)

- **6 atoms**, 1 selector (synchronous), 0 advanced features (no atomFamily, no async selectors)
- **463 hook usages** across 140 files
- Migration is mechanical: `useRecoilValue` -> `useAtomValue`, `useRecoilState` -> `useAtom`
- **Automatable with codemod** (regex find-replace covers 90%)
- Jotai and Recoil can coexist during transition
- Recoil is abandoned by Meta. Last meaningful commit was 2023.

## SCSS Strategy (Tournament-Validated)

**Original proposal:** SCSS → Tailwind (2-3 weeks)
**Tournament result:** KILLED. qubic-lib forces dual system.
**Revised finding:** qubic-lib is unmaintained (Spark NZ no longer maintains it).

**Recommended path:**
1. **Now:** SCSS consolidation (4-5 days) - shared tokens, layout mixins, fix imports
2. **Later (optional):** Inline qubic-lib components into MCS (1-1.5 weeks), then adopt Tailwind new-code-only
3. **Natural convergence:** As components are rewritten (React Query, ZTable), they come back in Tailwind

**Do NOT do:** Full 76-file Tailwind migration sprint. Zero user value, high regression risk.

### SCSS Consolidation (4-5 days)
1. Create `_tokens.scss` (single import for qubic-lib + local vars)
2. Extract shared layout partials: `_page.scss`, `_filter-bar.scss`, `_data-table.scss`
3. Fix 28 inconsistent import paths to use `@use`
4. Optional: CSS custom properties bridge for runtime theming
5. Add stylelint rule to prevent re-duplication

#### Pages Router -> App Router (DEFER)

- 0 uses of getServerSideProps/getStaticProps (everything is client-rendered)
- 130 API routes would need to become Route Handlers
- Client-side ADAL auth doesn't map to middleware/server auth pattern
- **Benefit is minimal** for this architecture until auth is server-side
- Do this AFTER MSAL migration + Recoil->Jotai

#### adal-angular -> MSAL (URGENT)

- Only 2 files actually import ADAL (`Login/index.tsx`, `helpers/utils.tsx`)
- Auth pattern: client redirect -> id_token in URL hash -> exchange for MCS token
- MSAL supports the same flow with better token caching and silent refresh
- **Microsoft ended ADAL support June 2023** - no security patches

#### Yup -> Zod

- **73 files** with Yup schemas (all server-side API validation, zero client-side)
- 445 total Yup usages
- Mechanical conversion: `yup.string().required()` -> `z.string()`
- Zod gives you `z.infer<typeof schema>` for free TypeScript types
- Can be done route-by-route alongside other work

---

## Other Modernization Suggestions

### TypeScript 4.9 -> 5.5+
- Enables `satisfies` operator, better type narrowing, decorators
- Low risk, high DX benefit
- Effort: 1-2 hours (update tsconfig, fix any new strict errors)

### Add .nvmrc / engines field
- No Node version pinned anywhere. Different devs may use different versions.
- 5-minute fix that prevents "works on my machine" issues.

### Remove coverage/ from git
- Build output committed to repo. Add to .gitignore, remove from tracking.

### Remove mock API routes
- 6 routes return hardcoded data with no auth, deployed to production
- Either delete them or gate behind `NODE_ENV === 'development'`

### Prisma preview features cleanup
```prisma
previewFeatures = ["microsoftSqlServer", "referentialActions"]
```
Both GA since Prisma 4.x. Remove to avoid confusion.

### Consider React Query / TanStack Query
- Currently every component manages its own loading/error/data state for API calls
- TanStack Query gives: caching, deduplication, background refetch, optimistic updates
- Pairs perfectly with the `useApiCall` hook refactor
- Would eliminate most of the loading state boilerplate

### Error Boundary
- No error boundaries exist in the app
- A single unhandled error in any component crashes the entire page
- Add `<ErrorBoundary>` wrapper in _app.tsx at minimum

---

## Migration Risk Matrix

```
         Low Risk ────────────────────── High Risk
    ┌─────────────────────────────────────────────┐
    │                                             │
H   │                    App Router               │
i   │                                             │
g   │         SCSS->Tailwind                      │
h   │                                             │
    │                                             │
E   ├─────────────────────────────────────────────┤
f   │                                             │
f   │  Yup->Zod          ADAL->MSAL              │
o   │                                             │
r   │  Recoil->Jotai                              │
t   ├─────────────────────────────────────────────┤
    │                                             │
L   │  pnpm              Jest->Vitest             │
o   │  TS 5.5                                     │
w   │  Prisma cleanup                             │
    │                                             │
    └─────────────────────────────────────────────┘
```

**Start bottom-left (quick wins), then middle row (high-value migrations), defer top-right (App Router).**
