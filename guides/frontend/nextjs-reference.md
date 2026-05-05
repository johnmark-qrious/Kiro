---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Next.js Reference

Extended patterns — read only when working on the specific topic.

## Caching Strategies

```typescript
fetch(url, { cache: 'no-store' });           // Always fresh
fetch(url, { cache: 'force-cache' });         // Cache forever (static)
fetch(url, { next: { revalidate: 3600 } });   // ISR — revalidate after N seconds
fetch(url, { next: { tags: ['products'] } }); // Tag-based invalidation
```

### On-Demand Revalidation

Prefer `revalidateTag`/`revalidatePath` over time-based revalidation.

```typescript
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function updateProduct(id: string, data: ProductData) {
  await db.product.update({ where: { id }, data });
  revalidateTag(`product-${id}`);
  revalidatePath('/products');
}
```

### Static Generation

```typescript
export async function generateStaticParams() {
  const products = await db.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}
```

## Metadata & SEO

Use `generateMetadata` for dynamic pages. Include Open Graph and Twitter card data.

```typescript
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, width: 1200, height: 630 }],
    },
  };
}
```

## Parallel Routes

Use for independent sections with their own loading/error states.

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div className="dashboard-grid">
      <main>{children}</main>
      <aside>{analytics}</aside>
      <aside>{team}</aside>
    </div>
  );
}
// app/dashboard/@analytics/page.tsx — loads independently
// app/dashboard/@team/page.tsx — loads independently
```

## Middleware

Scope to specific routes. Keep it fast — no heavy computation or DB queries.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

## Intercepting Routes (Modal Pattern)

```
app/
├── @modal/
│   ├── (.)photos/[id]/page.tsx  # Intercept (modal)
│   └── default.tsx
├── photos/
│   └── [id]/page.tsx            # Full page (direct navigation)
└── layout.tsx                   # Renders {children} + {modal}
```

## Route Handlers (API Routes)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = createUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
  }
  const user = await createUser(result.data);
  return NextResponse.json(user, { status: 201 });
}
```

## Context Providers

Wrap third-party providers in a dedicated Client Component at the layout level.

```typescript
// app/providers.tsx
'use client';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="system">{children}</ThemeProvider>;
}

// app/layout.tsx (Server Component)
import { Providers } from './providers';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
```

## Optimistic Updates

```typescript
'use client';
import { useOptimistic } from 'react';

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  async function addTodo(formData: FormData) {
    const title = formData.get('title') as string;
    addOptimistic({ id: 'temp', title, completed: false });
    await createTodo(formData);
  }

  return (
    <form action={addTodo}>
      <input name="title" />
      <button type="submit">Add</button>
      <ul>
        {optimisticTodos.map(todo => <li key={todo.id}>{todo.title}</li>)}
      </ul>
    </form>
  );
}
```
