---
lastVerified:
lastUsedInTask:
---

# Code Review Checklist

## File Structure & Import Ordering
- Are all import statements grouped together at the top of the file?
- Are there any constants, variables, or declarations placed BETWEEN import statements? (This is a 🚨 Critical Issue)
- Is the module-level logger (if present) declared after ALL imports?
- Is the file ordered correctly: directives → imports → constants → types/interfaces → functions/components?

## Error Handling
- What if the API call fails?
- What if the response is malformed?
- What if the timeout is reached?
- Are errors surfaced to the user?

## Data Validation
- What if required fields are missing?
- What if types are wrong (string instead of number)?
- What if arrays are empty?
- What if IDs don't exist?

## State Management
- What if this runs twice?
- What if state updates in the wrong order?
- What if the component unmounts during async operation?
- Are there race conditions?

## User Behavior
- What if they click multiple times?
- What if they navigate away?
- What if they refresh the page?
- What if they use the back button?

## Unhappy Path Feedback (Beyond AC)

Even if the AC only describes the happy path, check that rejected user actions produce visible feedback:

- If input is silently ignored (wrong file type, invalid format), does the user see WHY?
- If a constraint exists (size limit, character restriction), is it communicated on violation?
- If an action is disabled, can the user tell what would enable it?
- If something fails validation, does the error appear near the thing they interacted with?

**Rule:** Any code path that discards user input without feedback is a finding. The user should never wonder "did that work?" or "why didn't anything happen?"

## Scale & Performance
- What happens with 100 items? 1,000? 10,000?
- What if this runs on a slow device?
- What if the network is slow?
- Are there memory leaks?

## Dependencies & Assumptions
- What if the external service changes?
- What if the data format evolves?
- What if the environment variable is missing?
- What if the feature flag is off?

## Biome Compliance Awareness

When suggesting code changes or alternatives, ensure your suggestions don't violate the project's Biome rules:

- Don't suggest `<a href="#">` — Biome flags invalid anchors. If there's no real destination, use `<button type="button">` instead
- Don't suggest `function` declarations — the project enforces arrow functions (`complexity/useArrowFunction: error`)
- Don't suggest `enum` — use `as const` objects or union types (`style/noEnum: error`)
- Don't suggest `any` — use `unknown` or proper types (`suspicious/noExplicitAny: error`)
- Don't suggest `==` or `!=` — always use strict equality (`suspicious/noDoubleEquals: error`)
- Don't suggest `Array<T>` syntax — use `T[]` shorthand (`style/useConsistentArrayType: shorthand`)
- Every `<button>` must have `type="button"` or `type="submit"` (`a11y/useButtonType: error`)

Your suggestions should be things the implementation agent can adopt without creating new Biome violations.

## Next.js Specific Review

### Server/Client Boundaries
- Is `'use client'` placed as deep in the tree as possible, or is it unnecessarily high?
- Does a Server Component accidentally import a client-only module?
- Does a Client Component import `server-only` code (DB clients, secrets)?
- Are props passed from Server → Client serializable? (no functions, Dates, Maps)
- Is there a `'use client'` on a component that has no hooks or event handlers?

### Data Fetching
- Is data fetched sequentially when it could be parallel (`Promise.all`)?
- Are independent sections wrapped in `<Suspense>` for streaming?
- Is there client-side data fetching (`useEffect` + fetch) for data that should come from a Server Component?
- Does the fetch have proper `cache`/`revalidate` options, or is it hitting the API on every request?

### Server Actions
- Is the Server Action validating inputs (Zod or similar)?
- Is there an authorization check before the mutation?
- Does it call `revalidatePath`/`revalidateTag` after mutations?
- Could a user call this action directly without proper auth?

### Caching
- Is a page dynamic when it could be static (`generateStaticParams`)?
- Are cache tags used for granular invalidation?
- Is time-based revalidation used when on-demand would be more appropriate?

### Middleware
- Does middleware have a `config.matcher`, or does it run on all routes including static assets?
- Is there heavy computation or DB queries in middleware?
- Does middleware return `NextResponse.next()` on the happy path?

### Metadata & SEO
- Does a dynamic page implement `generateMetadata`?
- Are Open Graph images and descriptions set for shareable pages?

### Route Segments
- Is there a `loading.tsx` for routes with data fetching?
- Is there an `error.tsx` with a recovery option?
- Is there a `not-found.tsx` for dynamic routes?

## Examples of Good Skeptical Questions

- "What happens if this API call takes 30 seconds? Do we have a timeout?"
- "You're mapping over an array - what if it's empty? What if it has 10,000 items?"
- "This stores user data in localStorage - what if it's full? What if the user is in incognito mode?"
- "Why do we need this new abstraction? Can we just use the existing pattern from X?"
- "This assumes the user has permissions - where do we check that?"
- "What if two tabs are open and both try to update this?"
- "Do we really need real-time updates here, or would polling every 30s work?"
- "This adds 3 new dependencies - can we do this with what we already have?"
