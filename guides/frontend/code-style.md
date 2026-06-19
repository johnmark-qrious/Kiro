---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Code Style (Project-Specific)

Rules enforced by tooling or specific to this project. General TypeScript/JS best practices (const, early returns, destructuring, etc.) are assumed knowledge.

## Immutability (Functional Programming)

All TypeScript code follows functional programming principles. Immutability is the default.

- **Never use `let`.** Every binding is `const`. If you think you need `let`, restructure: extract a helper function, use a ternary, use `??`, or use array methods.
- **Never mutate objects or arrays.** Use spread (`{ ...obj, key: newValue }`), `Array.map`, `Array.filter`, `Array.reduce` — not `push`, `splice`, or direct property assignment after creation.
- **No `for` loops.** Use `.map()`, `.filter()`, `.reduce()`, `.flatMap()`, `.forEach()` (when side effects are the point).
- **Extract functions instead of reassigning.** When a value depends on a condition with complex logic, extract a pure function that returns the result.

```typescript
// ❌ Bad: let + reassignment
let status: string;
if (user.isAdmin) {
  status = "admin";
} else {
  status = "member";
}

// ✅ Good: const + ternary
const status = user.isAdmin ? "admin" : "member";

// ❌ Bad: let for try/catch fallback
let data: Result;
try {
  data = await fetchData();
} catch {
  data = fallback;
}

// ✅ Good: extract a safe helper
const fetchSafe = async (): Promise<Result> => {
  try {
    return await fetchData();
  } catch {
    return fallback;
  }
};
const data = await fetchSafe();

// ❌ Bad: mutable accumulation
let total = 0;
for (const item of items) {
  total += item.price;
}

// ✅ Good: reduce
const total = items.reduce((sum, item) => sum + item.price, 0);
```

**The only exception:** Performance-critical hot paths where the team has measured and proven immutability causes issues. Document with a comment referencing the benchmark.

## Type Assertions

**Never use `as` to assert types.** If TypeScript can't infer the type, fix the structure: add a return type annotation, use a typed variable, or write a type guard.

```typescript
// ❌ Bad: silencing the compiler
return { accounts: [] as AccountInfo[] };

// ✅ Good: return type annotation handles it
const getSafe = async (): Promise<{ accounts: AccountInfo[] }> => {
  return { accounts: [] };
};

// ❌ Bad: casting unknown shape
const data = response as UserData;

// ✅ Good: type guard
const isUserData = (x: unknown): x is UserData =>
  typeof x === "object" && x !== null && "id" in x;
```

**Acceptable uses (with a comment explaining why):**
- `as const` (narrowing, not assertion)
- DOM element narrowing after a null check: `const el = document.getElementById("x") as HTMLInputElement`
- Confirmed third-party type defects where no other workaround exists

**Never acceptable:** `as any`, `as unknown as T`, or `as []` to avoid typing a variable properly.

## File Naming Conventions

- **Components (any `.tsx` file):** PascalCase (`UserProfile.tsx`, `WithTooltip.tsx`, `FormField.tsx`)
- **Hooks:** useCamelCase (`useUserData.ts`, `useFileProcessor.ts`)
- **Other utilities / constants / configs:** kebab-case (`tooltip-content.ts`, `connector-config.ts`)
- **Directories:** kebab-case (`user-management/`, `add-connector/`)

### Don't Do This
- **Don't name `.tsx` component files in kebab-case.** `with-tooltip.tsx` is wrong -- it should be `WithTooltip.tsx`.


## Function Declarations vs Arrow Functions

Use `function` for anything that deserves a name in a stack trace. Use arrow functions for everything else.

| Use `function` | Use arrow function (`const x = () => {}`) |
|---|---|
| React components | Callbacks and inline handlers (`onClick`, `.map()`, `.filter()`) |
| Top-level named exports | Variables holding a function (`const handleSubmit = async () => {}`) |
| Hooks (`function useMyHook()`) | Short utility lambdas |

Why `function`:
- Hoists, so files read top-down (public API at top, helpers below)
- Better stack traces and React DevTools names without `displayName`
- Signals "this is a named, reusable unit"

Why arrow functions:
- Lexical `this` (relevant in class contexts, rare in React)
- Better for closures, callbacks, and inline use
- Signals "this is a value, not a declaration"

**Note:** In the Ubiquity-WebApps monorepo, Biome enforces `complexity/useArrowFunction` everywhere. This rule overrides the above for that specific project — all functions are `const` arrow functions, including exports. Standalone projects follow the table above.

**Export consistency (WebApps monorepo):** Use the same pattern throughout a file. If the file uses `export const` arrow functions, don't mix in `export function` declarations. The prevailing pattern in server actions is:

```typescript
export const getBillingReport = async (params: Params): Promise<Result> => {
  // ...
};
```

Not:
```typescript
export async function getBillingReport(params: Params): Promise<Result> {
  // ...
}
```

Check the existing files in the same directory before writing new code — match what's already there.


## File Structure & Declaration Ordering

Since Biome enforces arrow functions (`complexity/useArrowFunction`) in the WebApps monorepo, **nothing hoists**. This means declaration order matters — things must be declared before they're used.

**Required file ordering (top to bottom):**

1. `"use client"` / `"use server"` directive (if applicable)
2. All imports (grouped, no code between them)
3. Module-level constants (loggers, configs)
4. **TypeScript interfaces and types** (all of them, before any functions)
5. Helper/utility functions (private, not exported)
6. Exported functions / the main component

```typescript
// ✅ Correct ordering
"use server";

import { serverLogger } from "@monorepo/packages-logger";
import { accountClient } from "@/lib/grpc-clients";

// --- Types ---
interface AccountTreeAccount {
  id: string;
  displayName: string;
}

interface FetchResult {
  accounts: AccountTreeAccount[];
}

export interface BillingReportResult {
  accounts: TreeAccountNode[];
  status: number;
}

// --- Helpers (used by the exported function below) ---
const fetchAccountTreeSafe = async (rootAccountId: string): Promise<FetchResult> => {
  try {
    return await accountClient.getAccountTree({ rootAccountId });
  } catch {
    return { accounts: [] };
  }
};

// --- Exported (main) ---
export const getBillingReport = async (params: Params): Promise<BillingReportResult> => {
  const tree = await fetchAccountTreeSafe(params.accountId);
  // ...
};
```

```typescript
// ❌ Wrong: interfaces scattered, helper after its usage
export const getBillingReport = async (params: Params) => {
  const tree = await fetchAccountTreeSafe(params.accountId); // ← used before declared
  // ...
};

interface AccountTreeAccount { // ← interface after functions
  id: string;
}

const fetchAccountTreeSafe = async (rootAccountId: string) => { // ← declared after usage
  // ...
};
```

**Why this matters:** Const arrow functions don't hoist. If function A calls function B, B must appear above A in the file. Reading the file top-to-bottom should give you: types → helpers → main logic. No jumping around.

### Don't Do This

- Don't declare interfaces between or after functions — always at the top
- Don't define a helper const below the function that calls it — it works at runtime (TDZ doesn't apply to async) but violates readability and Stuart will reject it
- Don't mix interface declarations with function declarations — group by kind

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

## Wizard & Multi-Step UI Conventions

### SingleSelect onChange

Always use the **simple pattern** (receive the primitive value directly). Never destructure `.value` from the parameter - `SingleSelect` uses `fn.length` to decide what it passes you.

```tsx
// Good: receives the value directly
const handleChange = (value: MyType | null) => {
  if (value !== null) onUpdate(value);
};

// Bad: expects option object, gets raw value, returns undefined
const handleChange = (selected: SingleValue<Option>) => {
  if (selected !== null) onUpdate(selected.value); // .value on a primitive = undefined
};
```

For the `value` prop, pass the **primitive** and let `SingleSelect` resolve it internally:
```tsx
// Good
<SingleSelect value={ordinal} options={OPTIONS} onChange={handleChange} />

// Bad - stale reference issues
<SingleSelect value={OPTIONS.find(o => o.value === ordinal)} ... />
```

### Never silently block user actions

If a field is required, let the user clear it and show a validation error. Don't prevent the action with an early return.

```tsx
// Bad: user clicks X, nothing happens, no feedback
if (selectedOptions.length === 0) return;

// Good: allow the action, validate, show error
onDaysChange(selectedOptions.map(...));
validateField(FIELD, days, rules, context);
// FieldError renders "At least one day must be selected"
```

### Wizard state lifecycle checklist (before PR)

Test these transitions manually:

1. **Cancel and restart** - does state reset? (Jotai atoms persist across mounts)
2. **Switch between modes/tabs** - do dependent fields reset to defaults?
3. **Clear required fields** - does validation error appear and block Next?
4. **Back and forward** - does state survive navigation between steps?

If the wizard uses Jotai atoms, dispatch `RESET` on cancel and on mount in create mode.

## Conditional Logic

### Error Handling Style

Use `try/catch` for async error handling. Don't mix `async/await` with `.catch()` chains.

```typescript
// ✅ Correct: try/catch with await
const fetchSafe = async (): Promise<Result> => {
  try {
    return await fetchData();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    logger.warn("fetch failed:", message);
    return fallback;
  }
};

// ❌ Wrong: mixing await with .catch()
const result = await fetchData().catch((e) => {
  logger.warn("fetch failed:", e);
  return fallback;
});
```

**Why:** `try/catch` makes the error boundary explicit and keeps the happy path readable. `.catch()` mixed with `await` is harder to reason about (does `result` have the resolved type or the fallback type? TypeScript can't always narrow it).

### Conditional Branching

Use `if/else` when a boolean has exactly two mutually exclusive branches. Two separate `if` statements imply both could run — misleading when they can't.

```ts
// ✅ correct
if (isOpen) {
  setMonth(value.start);
} else {
  setPendingStart(null);
}

// ❌ wrong — looks like both could fire
if (isOpen) setMonth(value.start);
if (!isOpen) setPendingStart(null);
```

Ternaries are for picking a **value**, not executing side effects.

```ts
// ✅ correct — assigning a value
const label = isOpen ? "Close" : "Open";

// ❌ wrong — side effects via ternary
isOpen ? setMonth(value.start) : setPendingStart(null);
```

### Don't Do This

- Don't use `fn.length` heuristic-dependent patterns without understanding what `SingleSelect` will pass you
- Don't assume Jotai atoms reset between component mounts - they don't
- Don't let users advance past a step with invalid/empty required fields and no error message
- Don't test only the happy path - test cancel, re-entry, and field clearing

## Code SEO (Agent Navigability)

When creating or modifying files in a directory, improve navigability for agents:

- **Directory README**: If the directory lacks a README.md, add one (2-3 sentences: what this folder contains, when you'd look here, key exports).
- **Naming**: Prefer descriptive filenames over `index.ts`. If `index.ts` is a barrel, name the actual logic file descriptively (e.g., `billing-table.tsx` not just re-exported from `index.ts`).
- **Synonyms**: In the JSDoc/comment header of key modules, mention alternate terms a searcher might use (e.g., `// Handles customer/client/user account lookup`).
- **Cross-references**: When a module has a non-obvious dependency, add a comment: `// Related: see ../shared/billing-types.ts for the source schema`
