---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Code Style (Project-Specific)

Rules enforced by tooling or specific to this project. General TypeScript/JS best practices (const, early returns, destructuring, etc.) are assumed knowledge.

## File Naming Conventions

- **Components (any `.tsx` file):** PascalCase (`UserProfile.tsx`, `WithTooltip.tsx`, `FormField.tsx`)
- **Hooks:** useCamelCase (`useUserData.ts`, `useFileProcessor.ts`)
- **Other utilities / constants / configs:** kebab-case (`tooltip-content.ts`, `connector-config.ts`)
- **Directories:** kebab-case (`user-management/`, `add-connector/`)

### Don't Do This
- **Don't name `.tsx` component files in kebab-case.** `with-tooltip.tsx` is wrong -- it should be `WithTooltip.tsx`.


## Import Ordering

- ALL imports grouped together at the top (after `"use client"`/`"use server"` if present)
- NEVER place constants, variables, or code between import statements
- Module-level constants (like `logger`) go AFTER all imports

```tsx
// ❌ Bad: constant between imports
import { createClientLogger } from "@monorepo/packages-logger";
const logger = createClientLogger({ component: "MyComponent" });
import { useState } from "react";

// ✅ Good: all imports together, then constants
import { createClientLogger } from "@monorepo/packages-logger";
import { useState } from "react";
const logger = createClientLogger({ component: "MyComponent" });
```

## Logger Placement

- Declare `const logger = createClientLogger({ component: "ComponentName" })` at module top level, after all imports
- Never inside a function or component body
- Component name should match the file's primary export

## Biome Rules (Enforced)

These are `error` level in `biome.json` — code that violates them won't pass CI:

- `complexity/useArrowFunction` — Arrow functions only, no `function` declarations
- `a11y/useButtonType` — Every `<button>` needs explicit `type`
- `a11y/useKeyWithClickEvents` — `onClick` elements need keyboard handlers
- `a11y/useAltText` — All `<img>` need `alt`
- `style/useConst` — `const` for non-reassigned variables
- `style/useSelfClosingElements` — Self-close elements without children
- `style/useConsistentArrayType: shorthand` — `T[]` not `Array<T>`
- `style/useCollapsedIf` — Collapse nested `if` into `if (a && b)`
- `style/noEnum` — Never `enum`, use `as const` objects or union types
- `style/useTemplate` — Template literals, not string concatenation
- `suspicious/noDoubleEquals` — Always `===` and `!==`
- `suspicious/noExplicitAny` — Never `any`
- `suspicious/noVar` — Never `var`
- `correctness/noUnusedImports` — Remove unused imports
- `correctness/noUnusedVariables` — Remove unused variables
- `correctness/useExhaustiveDependencies` — Complete hook dependency arrays
- `correctness/useJsxKeyInIterable` — `key` in mapped JSX
- `nursery/useSortedClasses` — Tailwind classes sorted (use `cn()` helper)
- `performance/noAccumulatingSpread` — No spread in loops, use `push`/`concat`

When in doubt, use `getDiagnostics` to verify.

## HTML Nesting Rules

- **Don't wrap heading tags inside `<span>`.** `<span>` is phrasing
  (inline) content and must not contain flow (block) elements like
  `<h1>` through `<h6>`. Apply classes directly to the heading.
- When adding behaviour (tooltips, popovers) to a heading, wrap the
  heading with the behaviour component using `asChild`, and apply
  conditional classes directly with `cn()`.

```tsx
// Bad: span wrapping h3
<WithTooltip tooltip={tip}>
  <span className="cursor-help">
    <h3>Label</h3>
  </span>
</WithTooltip>

// Good: class applied directly to h3
<WithTooltip tooltip={tip}>
  <h3 className={cn("font-semibold text-sm", tip && "cursor-help")}>
    Label
  </h3>
</WithTooltip>
```
## React Components

- `const MyComponent = (): React.JSX.Element => { ... }` with `export default MyComponent` at bottom
- Arrow functions can't use inline `export default`, so export at end of file
