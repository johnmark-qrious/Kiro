---
name: design-to-shadcn
description: Translate a live web prototype (URL or pasted source) into pixel-perfect shadcn/Radix components using theme tokens. Use when user provides a URL to replicate, asks to "match this design", or when translating any visual reference into shadcn components. Triggers on design translation tasks in Ubiquity WebApps.
inclusion: manual
lastVerified: 2026-05-16
---

# Design to Shadcn

Translate a live prototype into pixel-perfect shadcn/Radix components. Every value comes from extraction, not guessing.

## Iron Law

```
NO CODE BEFORE RECON. NO ARBITRARY VALUES. NO RAW HTML FOR INTERACTIVE ELEMENTS.
```

## Prerequisites

- Existing TypeScript interfaces or proto definitions for data-bearing components
- For greenfield features without types: define view model interfaces first, or use inferred placeholders (mark with `// TODO: replace with real type`)
- Access to the prototype (URL or pasted source)

## Step 1: RECON

**Goal:** Extract everything needed to replicate the design. No guessing.

### Primary path (v0/Vercel prototypes emit Tailwind):
1. Fetch the prototype page source (`web_fetch` or Playwright navigate)
2. Extract Tailwind classes from the HTML source directly
3. Screenshot at target viewport width for visual reference

### Fallback path (non-Tailwind source):
1. Navigate via Playwright
2. Run `getComputedStyle()` on key elements (colors, fonts, spacing, dimensions)
3. Screenshot at target viewport width

### Paste fallback:
If Playwright can't access the URL (auth, CORS, etc.), ask user to paste the page source. Extract classes from pasted HTML.

### RECON output:
- Screenshot (reference image)
- List of all Tailwind classes or computed values per element
- List of interactive elements identified (buttons, selects, inputs, tables, tabs, modals)

**Do NOT proceed to Step 2 without completing RECON.**

## Step 2: MAP

**Goal:** Map every extracted value to theme tokens and shadcn components.

### Token mapping:
1. Read `packages/ui/src/styles/theme-tokens.css` and `theme-variables.css`
2. Map each extracted color → semantic token (e.g., `zinc-500` → `text-muted-foreground`)
3. Map each font size → theme size (e.g., `text-sm` = 13px, `text-base` = 14px)
4. Map spacing/padding → Tailwind spacing scale

### Component classification:
For each interactive element, classify:

| Classification | Meaning | Action |
|---|---|---|
| **DIRECT** | 1:1 shadcn component exists | Use it (Select, Button, Table, Input, etc.) |
| **COMPOSE** | Combine shadcn primitives | Document which primitives + how |
| **ESCALATE** | Can't map to shadcn | Flag to user immediately |

**Abort rule:** If >50% of elements classify as ESCALATE, stop and tell the user this design isn't suitable for automated translation. The agent may override with stated reasoning (document why).

### MAP output:
Translation spec — structured list:
```
Element: [description]
Component: [shadcn component or COMPOSE recipe]
Classes: [exact Tailwind classes from theme tokens]
```

## Step 3: SCAFFOLD

**Goal:** Create a preview route the agent can access via Playwright. No auth barriers.

1. Create route group: `app/(dev)/preview/page.tsx`
2. Layout for `(dev)`: skip all auth/session checks
3. Create mock data matching existing TypeScript interfaces
4. Verify dev server is running on accessible port

### Mock data rules:
- Read the TypeScript interface/type BEFORE creating mock data
- Every field must match the type shape exactly
- Use realistic values (not "Lorem ipsum" for everything)

### Security:
- `(dev)` route group is blocked by middleware in production
- Add to `.gitignore` or use `pageExtensions` to exclude from builds
- DELIVER step removes it — never committed to the repo

## Step 4: BUILD

**Goal:** Write components from the translation spec. Zero guessing.

### Hard rules:
- **shadcn/Radix components ONLY** for interactive elements (no native `<select>`, `<button>`, `<input>`)
- **Theme tokens ONLY** for colors, typography, spacing (no `text-[18px]`, no `text-[rgb(...)]`)
- **Exception:** Layout geometry (grid template columns, specific container widths, gaps) MAY use arbitrary values WITH a comment: `{/* layout: matches prototype grid */}`

### Component patterns:
- Read shadcn component source before overriding styles (understand defaults like `data-[size=default]:h-9`)
- Work WITH component defaults when possible, override only when necessary
- Use `cn()` for conditional classes

### Interactivity:
- Typed callback props for all interactive elements (`onSelect`, `onChange`, etc.)
- Placeholder handlers that log or no-op — real logic wired in DELIVER step
- This skill produces VISUAL components, not stateful logic

## Step 5: VERIFY

**Goal:** Confirm the output matches the prototype. Structural + visual.

### Gate 1: Build passes
```
bun run typecheck
```
Must pass. If not, fix before proceeding.

### Gate 2: Lint passes
```
bun run check:biome
```
Must pass. If not, fix before proceeding.

### Gate 3: No unauthorized arbitrary values
```
grep -r "text-\[" | grep -v "layout:"
grep -r "bg-\[" | grep -v "layout:"
grep -r "p-\[" | grep -v "layout:"
```
Any matches outside allowed exceptions = fix them.

### Gate 4: Visual sign-off (NON-NEGOTIABLE)
1. Navigate Playwright to `localhost:{port}/dev/preview`
2. Screenshot the local render
3. Present BOTH screenshots to user (prototype + local)
4. User approves or lists differences to fix

**Do NOT proceed to DELIVER without user visual sign-off.**

### Iteration:
- Fix issues found in gates 1-3 immediately
- For gate 4 feedback: apply fixes, re-screenshot, re-present
- If 3 iterations fail to resolve: load `/skills/systematic-debugging/SKILL.md` and investigate root cause
- If still stuck after debugging: ESCALATE to user with specific blockers

## Step 6: DELIVER

**Goal:** Move verified components to their real location.

1. Move components from `(dev)/preview/` to their real route/location
2. Wire up real data fetching (replace mock data with server actions/props)
3. Wire up real event handlers (replace placeholder callbacks)
4. Delete the `(dev)/preview/` route entirely
5. Delete mock data files
6. Verify the real page renders (may need real backend running)

### Delivery checklist:
- [ ] Components moved to correct location
- [ ] Preview route deleted
- [ ] Mock data deleted
- [ ] Real data wired
- [ ] No `(dev)` artifacts remain in the codebase
- [ ] Build still passes

## Scope

This skill produces **static, visually-correct components** that match a prototype. It does NOT:
- Implement business logic or state management
- Handle data fetching or server actions (that's DELIVER wiring)
- Reproduce animations or transitions (flag these as separate tasks)
- Handle responsive breakpoints beyond the target viewport (flag for follow-up)

## Don't Do This

- Don't write ANY code before completing RECON
- Don't use native HTML elements for interactive controls
- Don't use arbitrary Tailwind values for colors/typography/spacing
- Don't create mock data without reading the TypeScript interface first
- Don't skip the visual sign-off gate
- Don't guess at values — every number comes from extraction
- Don't override shadcn component styles without reading the component source first
- Don't commit the preview route — it's scaffolding, not product code
