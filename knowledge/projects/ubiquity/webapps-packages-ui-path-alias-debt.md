---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-14T12:04:00+12:00
lastPublished:
---

# Tech Debt: packages/ui shadcn @/lib/utils Path Alias

## Problem

Shadcn components in `packages/ui/src/shadcn/` use `import { cn } from "@/lib/utils"`. This path alias resolves within packages/ui's own tsconfig (`@/*` maps to `./src/*`), but when consuming apps typecheck and follow imports into the package source, TypeScript resolves `@/` against the consuming app's path mapping instead.

## Current Workaround

Every app that imports from `@monorepo/packages-ui/shadcn` must have:
1. `src/lib/utils.ts` exporting a `cn` function
2. `clsx` and `tailwind-merge` as dependencies

This creates a hidden contract. If a new app is created without this file, typecheck breaks with `Cannot find module '@/lib/utils'`.

## Affected Files (6)

- `monorepo/packages/ui/src/shadcn/accordion.tsx`
- `monorepo/packages/ui/src/shadcn/button.tsx`
- `monorepo/packages/ui/src/shadcn/card.tsx`
- `monorepo/packages/ui/src/shadcn/checkbox.tsx`
- `monorepo/packages/ui/src/shadcn/dialog.tsx`
- `monorepo/packages/ui/src/shadcn/input.tsx`

## Proper Fix

Replace `import { cn } from "@/lib/utils"` with `import { cn } from "../lib/utils"` in all 6 files. This makes the package self-contained - no hidden dependency on consuming apps having a specific file at a specific path.

## Why It Was Masked

Turbo cache. Once an app typechecked successfully, the cached result persisted. Only cache misses (new apps, cleared cache) exposed the bug. Database and journey-builder both happen to have `src/lib/utils.ts` with a `cn` export, so the accidental path collision worked.

## Effort

5 minutes. Change 6 import paths. Verify all 3 apps + packages/ui typecheck.

## Risk

Low. Same module, same export, just a path that resolves correctly from any context. No runtime behavior change.

## When to Fix

Next available slot for a small chore PR. Branch off main, fix the 6 imports, verify typecheck, PR to main.
