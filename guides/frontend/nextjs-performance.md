---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Next.js Performance Optimization

## Core Web Vitals

### LCP (Largest Contentful Paint)
- Hero images use `<Image>` with `priority` prop
- Above-the-fold content loads without JavaScript dependency
- Fonts preloaded with `next/font` (no FOIT/FOUT)
- Server Components for initial content rendering
- No client-side data fetching for primary content

### INP (Interaction to Next Paint)
- `'use client'` boundaries minimize client JavaScript
- Heavy computations offloaded to Web Workers or server
- Event handlers don't block the main thread
- Third-party scripts loaded with `next/script` strategy

### CLS (Cumulative Layout Shift)
- Images have explicit `width`/`height` (or `fill` with sized container)
- Skeleton loaders match final layout dimensions
- Fonts loaded via `next/font` (no layout shift)
- Dynamic content has reserved space

## Image Optimization

All images must use `<Image>` component, not `<img>`.

```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero banner"
  width={1200}
  height={600}
  priority              // Above the fold
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

- Above-the-fold images: `priority={true}`
- Always specify `width`/`height` or use `fill` with sized container
- Set `sizes` prop for responsive images
- Configure remote domains in `next.config.js`

## Bundle Optimization

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-only if uses browser APIs
});
```

### Tree Shaking

```typescript
// ❌ Imports entire library
import _ from 'lodash';

// ✅ Named import — tree-shakeable
import debounce from 'lodash/debounce';
```

- Named imports over default imports for large libraries
- No barrel file re-exports that pull in entire modules
- Remove unused dependencies from `package.json`

## Font Optimization

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});
```

- All fonts through `next/font/google` or `next/font/local`
- Specify subsets to reduce file size
- Use `display: 'swap'` for visible text during load

## Third-Party Scripts

```typescript
import Script from 'next/script';

<Script
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload" // Loads after page is idle
/>
```

- Analytics: `strategy="afterInteractive"` or `"lazyOnload"`
- No render-blocking third-party scripts
- `strategy="beforeInteractive"` only when truly necessary

## Server-Side Performance

- Select only needed fields (no `SELECT *`)
- Pagination for list endpoints
- Connection pooling (PgBouncer, connection limits)
- No N+1 queries (use eager loading or batching)
- API routes validate input early to fail fast
- Background jobs for long-running operations

## Middleware Performance

- Run only on necessary routes (use `matcher`)
- Keep logic fast — no heavy computation
- No database queries in middleware (Edge-compatible only)
- Short-circuit with early returns

## Monitoring

- Core Web Vitals tracked in production
- Bundle size monitored in CI (`@next/bundle-analyzer`)
- Performance budgets defined for key pages
- Lighthouse CI on pull requests
