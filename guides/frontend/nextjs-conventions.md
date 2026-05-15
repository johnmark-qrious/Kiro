---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Next.js Conventions (Core)

For caching, metadata, parallel routes, middleware, intercepting routes, route handlers, context providers, and optimistic updates, see: `.kiro/guides/frontend/nextjs-reference.md`

## App Router Fundamentals

- Server Components by default — add `'use client'` only when needed
- Async Server Components for data fetching (no useEffect)
- Server Actions for mutations
- `params` and `searchParams` are Promises in Next.js 15+ — always `await` them
- Proper `loading.tsx`, `error.tsx`, and `not-found.tsx` for every route segment

### File Structure

- `app/` for routes, `components/` for shared, `lib/` for utilities, `types/` for types, `actions/` for Server Actions

## Server/Client Component Boundaries

Push `'use client'` as deep in the tree as possible.

### Server Components (Default)
- Data fetching, server-side resources, static content, sensitive logic

### Client Components
- Event handlers, React hooks, browser APIs, third-party libs using hooks

```typescript
// ❌ Entire page marked client when only a button needs interactivity
'use client';
export default async function ProductPage({ params }) { /* ... */ }

// ✅ Server Component with isolated Client Component
import { AddToCartButton } from './add-to-cart-button';
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

### Data Passing Patterns

- Server → Client via serializable props only (no functions, Dates, Maps)
- Use the children pattern to keep Server Components inside Client wrappers
- Use `server-only` package to prevent accidental imports in Client Components

```typescript
// Children pattern: Server Components inside Client wrapper
'use client';
const Accordion = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}>Toggle</button>
      {open && children}
    </div>
  );
};
```

## Data Fetching

### Parallel — Avoid Waterfalls

```typescript
// ❌ Sequential waterfall
const user = await getUser();
const orders = await getOrders(user.id);
const analytics = await getAnalytics(user.id);

// ✅ Parallel
const user = await getUser();
const [orders, analytics] = await Promise.all([
  getOrders(user.id),
  getAnalytics(user.id),
]);
```

### Streaming with Suspense

```typescript
export default async function DashboardPage() {
  const user = await getUser();
  return (
    <div>
      <UserHeader user={user} />
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersSection userId={user.id} />
      </Suspense>
    </div>
  );
}
```

## Logging

| Context | Import | Usage |
|---|---|---|
| Client Components, hooks, browser code | `clientLogger` from `@monorepo/packages-logger` | `clientLogger.error(...)` |
| Server Actions, Server Components, API routes | `serverLogger` from `@monorepo/packages-logger` | `serverLogger.error(...)` |

> Never use `createClientLogger` or `clientLogger` inside `"use server"` files.

## Server Actions

Always validate inputs, check authorization, and handle errors.

**Auth is mandatory per-action.** Every `"use server"` action that accesses protected data must call `requireSessionInfoCached()` and verify permissions independently. Layout-level auth does NOT protect server actions — they are directly callable as RPC endpoints regardless of which page rendered them.

**Pattern-first rule.** Before writing a new server action (or any new file), check how existing actions in the same app handle auth, error handling, and logging. Match the established pattern exactly — don't invent a new approach when one already exists in the codebase.

```typescript
'use server';
import { z } from 'zod';

const schema = z.object({ id: z.string().uuid() });

export async function deleteUser(rawData: { id: string }) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') throw new Error('Unauthorized');
  const { id } = schema.parse(rawData);
  await db.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}
```

## Custom Hooks

Custom hooks belong in their own files — never define them inline inside component files.

| Hook type | Directory | Example |
|---|---|---|
| Data-fetching hooks (useQuery, useMutation) | `domains/{domain}/api-hooks/` | `useActivityLog.ts` |
| Non-data hooks (local state, UI logic) | `domains/{domain}/hooks/` | `useScheduleForm.ts` |

- File name matches the hook: `use{HookName}.ts`
- One hook per file, named export (not default)
