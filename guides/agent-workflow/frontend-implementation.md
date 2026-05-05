---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Phase 2: Frontend Implementation

When writing frontend code:

## Step 0: Knowledge Lookup
Before writing code, scan `.kiro/knowledge/README.md` index for entries matching these tags:
`Ubiquity-WebApps`, `frontend`, `nextjs`, `react`, `jquery`, `aspx`, `dialog`, `xss`

Read any matching entries. They contain gotchas and non-obvious behavior that will affect your implementation.

## Figma Link Detection
If the ticket contains a Figma link (figma.com URL), do NOT silently ignore it. Alert the user:
> "Figma link detected in ticket. Figma MCP is currently disabled. Enable it if you want me to follow the design, or paste key specs (colors, spacing, breakpoints) here."

Wait for the user's response before proceeding with implementation.

## Step 1: Implementation
Use **@frontend** for code writing
- Follow functional programming principles
- Use proper TypeScript types  read `.kiro/guides/frontend/typescript-best-practices.md` before writing any TypeScript
- Apply React best practices
- Keep code simple and clean
- Avoid `useRef(false)` as a mount guard for `useEffect`  this obscures intent. Prefer `[]` with an explicit conditional (e.g. checking atom/prop state) to express why the effect is guarded

## Step 2: Critical Review
Always let **@quality-assurance** check the code.

**Handoff context**: Include a 1-2 sentence summary of what @frontend did and which files were created/modified. This avoids the reviewer re-discovering everything from scratch.

- Re-read any knowledge entries found in Step 0 — review the code specifically for those known gotchas
- Review for bugs and edge cases
- Check error handling
- Validate assumptions
- Question complexity

## Step 3: Feedback Loop (conditional)
Only re-invoke **@frontend** if @quality-assurance raised critical issues.
- If @quality-assurance found no critical issues  done, skip this step
- If @quality-assurance found issues  submit feedback to @frontend:
  - Address critical issues
  - Fix identified bugs
  - Simplify over-engineered solutions
  - Improve error handling
  - Ensure Biome compliance and formatting

## Example

```
User: "Implement the journey list page"

1. @frontend - Write the component
2. @quality-assurance - Review for issues
3. IF critical issues found  @frontend - Fix issues and ensure Biome compliance
   IF no critical issues  done
```

## MVC / Legacy jQuery (QT-Ubi-UbiquityBackend)

When working on `.aspx`, `.ascx`, `Util.js`, `Lists*.js`, or any JS in the `mvc/` folder:

**Read**: `.kiro/guides/frontend/mvc-legacy.md` before writing any code.

This is jQuery/DOM manipulation, not React. Different rules apply.

## Next Step: Testing

If the change includes new business logic, user flows, or error handling paths, suggest running the testing workflow next. Don't force it  just nudge:
> "This added new logic in X. Want to run the testing workflow to cover it?"
## Learned Patterns
<!-- cap: 10 | last-consolidated: never | pr-count-since: 0 -->

- Check existing test files for the test framework before writing tests  this monorepo uses bun:test, not vitest (1x)
- Always diff package.json against origin/main before committing  feature branches accumulate stale devDependencies (1x)
