---
sync: draft
lastLocalEdit: 2026-05-13T14:58:00+12:00
---

# Zespri MCS - Legacy Patterns & Convention Violations

> Modern Next.js 14 / React 18 has native solutions for problems this codebase solves manually.

## The Numbers

| Anti-Pattern | Occurrences | Files |
|-------------|-------------|-------|
| Manual auth header injection | 193 | 92 |
| useEffect for data loading | 105 | 82 |
| toaster.danger error handling | 199 | 72 |
| Manual setLoading(true/false) | 86 | 61 |
| Components reading auth from Recoil | 99 | 96 |

---

## 1. CRITICAL: Manual Auth Header Injection (193x)

**Legacy pattern:**
```tsx
const auth = useRecoilValue(authState);
await api.next("/endpoint", {
  headers: [["Authorization", auth.authorization]],
});
```

**Modern solution:** Modify `api.ts` to auto-inject token from a central source. Zero component changes needed.

**Fix effort:** 1 PR, 1 file change. Eliminates 193 manual header passes.

---

## 2. CRITICAL: useEffect + useState for Data Fetching (82 files)

**Legacy pattern:**
```tsx
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
useEffect(() => { fetchData(); }, []);
```

**Modern solution:** TanStack Query
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['kpin-list', filters],
  queryFn: () => api.next('/kpin-list', { body: filters }),
});
```

**What you get for free:** Caching, deduplication, background refetch, stale-while-revalidate, retry, loading/error states, race condition prevention.

**Fix effort:** Incremental per component. Add React Query provider once, migrate components one at a time.

---

## 3. CRITICAL: Every Component Does Its Own Error Handling (72 files)

**Legacy pattern:**
```tsx
try { await api.next(...); }
catch { toaster.danger(lang.failedToLoadData); }
```

**Modern solution:** Global error handler on query client
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { onError: (err) => toaster.danger(err.message) },
    mutations: { onError: (err) => toaster.danger(err.message) },
  },
});
```

**Fix effort:** 5 lines of config. Components stop needing try/catch.

---

## 4. HIGH: Manual Form State (9+ useState per form)

**Legacy pattern:**
```tsx
const [severity, setSeverity] = useState("");
const [hazardType, setHazardType] = useState("");
const [description, setDescription] = useState("");
// ... 6 more fields
const [showValidation, setShowValidation] = useState(false);
```

**Modern solution:** React Hook Form + Zod
```tsx
const form = useForm<HazardFormData>({
  resolver: zodResolver(hazardSchema),
  defaultValues: existing,
});
```

**What you get:** Uncontrolled inputs (fewer re-renders), declarative validation, dirty tracking, error messages, single form object.

---

## 5. HIGH: Global State for Server Data (Recoil misuse)

**Legacy pattern:** `filtersState` atom stores server-fetched reference data (17+ tables worth). Never refetches. Never invalidates. If data changes server-side, client is stale forever.

**Modern solution:** React Query cache. Data is fetched, cached with TTL, auto-refetched when stale.

**What's actually client state (keep in Jotai):** auth session, UI preferences, toaster queue, language selection.
**What's server cache (move to React Query):** filters, seasons, users, roles, packhouses, test groups.

---

## 6. MEDIUM: Client-Side Auth Guards (flash of content)

**Legacy pattern:**
```tsx
useIsomorphicLayoutEffect(() => {
  if (!authorized) { router.push("/"); toaster.danger("No access"); }
}, []);
```

Page renders, THEN redirects. User briefly sees unauthorized content.

**Modern solution:** Next.js middleware.ts - runs at edge before page loads. Zero flash.

**Dependency:** Requires auth token in cookies (not localStorage).

---

## 7. LOW: API Route Method Switching

**Legacy pattern:**
```tsx
export default RequestUtils.secure((req, res, body, user, client) => {
  switch (req.method) {
    case "POST": return postHandler(...);
    case "GET": return getHandler(...);
    default: return MethodNotAllowed(...);
  }
});
```

**Modern solution:** App Router Route Handlers export named functions (`export async function POST()`, `export async function GET()`).

**Note:** The existing `RequestUtils.secure` wrapper is actually well-designed. This is low priority.

---

## 8. MISSING: No Error Boundaries

Zero `<ErrorBoundary>` components in the entire app. One unhandled render error crashes the whole page with a white screen.

**Fix:** Add `<ErrorBoundary>` in _app.tsx wrapping `<Component>`. Takes 10 minutes.

---

## 9. MISSING: No Suspense Boundaries

Zero `<Suspense>` usage. Every loading state is manual. No streaming, no progressive rendering.

**When to add:** After adopting React Query (which supports Suspense mode).

---

## 10. MISSING: No React.memo / useMemo for Expensive Renders

Tables with 100+ rows re-render entirely on any state change (filter typing, loading toggle). No memoization anywhere.

**When to fix:** After React Query adoption (fewer re-renders from loading state changes).

---

## The Single Biggest Win

**Modify `src/helpers/api.ts` to auto-inject auth headers.**

This one change:
- Eliminates 193 manual header injections
- Removes the need for 96 components to import authState
- Decouples components from auth implementation
- Takes 30 minutes

```tsx
// Before: every component does this
const auth = useRecoilValue(authState);
api.next("/endpoint", { headers: [["Authorization", auth.authorization]] });

// After: api.ts reads token internally
api.next("/endpoint"); // auth injected automatically
```

---

## Recommended Adoption Order

```
Week 1:  Auto-inject auth headers (1 PR, instant win)
         Add Error Boundary (10 min)
         
Week 2:  Install TanStack Query, add provider
         Migrate 3 simple list components as proof
         
Week 3+: Migrate remaining components to React Query
         (eliminates useEffect fetching, manual loading, manual error handling)
         
Later:   React Hook Form for new/rewritten forms
         Move server data out of Recoil into query cache
         Auth to cookies + middleware (bigger project)
```

Each step is independent and incremental. No big-bang required.
