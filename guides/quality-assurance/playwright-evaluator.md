---
lastVerified:
lastUsedInTask:
---

# Playwright Evaluator (UI Verification)

## When to Use

After @frontend completes a UI task that has testable AC, run the evaluator to verify the implementation by interacting with the running app. This catches integration bugs that static code review misses.

**Use when:**
- Task has UI-facing AC items (renders X, shows Y on click, navigates to Z)
- The dev server can be started (`bun dev` or equivalent)
- Task involves user interactions (forms, modals, toggles, navigation)

**Skip when:**
- Backend-only changes
- Pure refactors with no visible behaviour change
- Config/env changes

## How It Works

1. Start the dev server (or confirm it's running)
2. Navigate to the relevant page via `puppeteer_navigate`
3. Walk through each AC item:
   - Take a screenshot of the initial state
   - Perform the interaction (click, fill, navigate)
   - Verify the expected outcome (element visible, text present, route changed)
   - Take a screenshot of the result
4. Report findings per AC item: PASS or FAIL with evidence

## Evaluation Protocol

For each AC item in the task:

```
AC: "Table renders one row per BillingLineItem in response"

Steps:
1. Navigate to /admin/billing
2. Wait for loading to complete (skeleton disappears)
3. Count table rows via puppeteer_evaluate
4. Compare against expected data count
5. Screenshot the result

Verdict: PASS — 5 rows rendered matching 5 items from mock/real data
```

## What to Check

### Rendering
- Elements exist in the DOM (use `puppeteer_evaluate` with `document.querySelector`)
- Text content matches expected values
- Correct number of items rendered (table rows, list items, cards)

### Interactions
- Buttons are clickable and produce expected result
- Forms accept input and submit
- Modals open and close
- Toggles change state
- Navigation works (URL changes, new content loads)

### States
- Loading state appears before data loads
- Empty state shows when no data
- Error state shows on failure (can simulate by checking error UI exists in code)

### Accessibility (quick check)
- Interactive elements are focusable
- Images have alt text
- Form inputs have labels

## Reporting Format

```
## Evaluator Results: Task N

| AC | Verdict | Evidence |
|----|---------|----------|
| Table renders one row per item | ✅ PASS | 5 rows found, matches response |
| Empty state shown when zero items | ❌ FAIL | No empty state component rendered, table shows headers only |
| Loading skeleton visible | ✅ PASS | Skeleton visible for 200ms before data loads |

### Failures Detail
**Empty state:** The component exists in code but the condition checks `items.length === 0` before the fetch completes, so it flashes briefly then disappears. The check should be `!isLoading && items.length === 0`.

### Screenshots
[attached via puppeteer_screenshot]
```

## Limitations

- Cannot verify real gRPC calls (dev server may use mocks or fail without backend)
- Cannot verify auth flows without valid session
- Cannot verify SSR-specific behaviour (evaluator sees client-rendered output)
- Timing-sensitive checks may be flaky (use reasonable waits)

## Integration with Workflow

The evaluator runs AFTER @frontend and BEFORE final QA sign-off:

```
@frontend (implement) → Playwright evaluator (verify AC) → @quality-assurance (code review)
```

If the evaluator finds failures, @frontend fixes them before QA reviews. This prevents QA from reviewing code that doesn't actually work.
