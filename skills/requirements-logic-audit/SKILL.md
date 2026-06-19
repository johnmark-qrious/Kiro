---
name: requirements-logic-audit
description: Audit requirements and acceptance criteria for logical gaps, missing states, uncovered branches, and implicit assumptions. Use during design phase when reviewing specs, or when @ticket-triage flags logical inconsistencies. Produces a gap report with proposed additional ACs.
inclusion: manual
lastVerified: 2026-05-21
---

# Requirements Logic Audit

## Purpose

Find what the requirements DON'T say. Specs describe the happy path well. This skill finds the unhappy paths, edge cases, and logical gaps that cause rework when discovered mid-implementation.

## When to Use

- During design phase, after requirements are drafted but before tasks are broken down
- When @ticket-triage flags logical inconsistencies in AC
- When reviewing a spec that "feels incomplete" but you can't pinpoint why
- Before @taskmaster breaks work into tasks (gaps found after task split = expensive)

## The Audit

### Step 1: Extract the State Machine

For every feature, identify:
1. **All states** the system/component can be in
2. **All transitions** between states (what triggers them)
3. **All actors** who can trigger transitions

Then check: is every state reachable? Is every state exitable? Are there dead-end states?

### Step 2: Branch Coverage Analysis

For every decision point in the requirements:

| Question | What to check |
|----------|---------------|
| What if the user does nothing? | Timeout, idle state, session expiry |
| What if it partially succeeds? | 3 of 5 items saved, network drops mid-batch |
| What if it's called twice? | Idempotency, duplicate submissions, double-click |
| What if the data doesn't exist? | Empty states, deleted references, stale cache |
| What if permissions change mid-flow? | Started with access, lost it before completing |
| What if concurrent users act? | Two users edit same record, race conditions |
| What about the inverse operation? | Create is defined, but what about delete? Enable but not disable? |

### Step 3: Boundary Conditions

For every numeric threshold, list, or limit mentioned:
- Zero items
- Exactly one item
- Exactly at the threshold
- One over the threshold
- Maximum possible (what's the upper bound? Is there one?)

### Step 4: Cross-Requirement Dependencies

Map which ACs depend on other ACs or external state:
- If AC-3 assumes AC-1 has already happened, what if it hasn't?
- If two ACs can trigger simultaneously, which wins?
- If an AC references data from another system, what if that system is down?

### Step 5: Implicit Assumptions

List everything the spec assumes but doesn't state:
- Authentication/authorization required?
- Specific user role needed?
- Feature flag gating?
- Data must pre-exist (seeded, migrated, created by another flow)?
- Network connectivity assumed?
- Specific browser/device capabilities?

## Output Format

```
## Logic Audit: [Feature/Ticket Name]

### Coverage Score: X/5 (states | branches | boundaries | dependencies | assumptions)

### Missing ACs (proposed additions)
| # | Gap Type | Scenario | Proposed AC |
|---|----------|----------|-------------|
| 1 | Missing state | User closes browser mid-save | Data is either fully saved or not saved (no partial state) |
| 2 | Boundary | List has 0 connectors | Show empty state with "Add connector" CTA |
| ...

### Contradictions Found
| # | AC-A | AC-B | Conflict |
|---|------|------|----------|
| 1 | "Show error toast" (AC-3) | "Redirect to login" (AC-7) | Both trigger on 401 - which one? |

### Implicit Assumptions (should be explicit)
- [ ] Assumes user is authenticated (not stated in AC)
- [ ] Assumes list data is pre-loaded (no loading state defined)

### Recommendation
[Proceed / Needs clarification on N items / Blocked until contradictions resolved]
```

## Rules

- Don't invent requirements. Flag gaps, don't fill them with assumptions.
- Propose ACs as suggestions, not mandates. The user decides scope.
- Focus on gaps that cause REWORK, not theoretical completeness.
- A feature with 5 well-chosen ACs is better than 20 that cover every edge case nobody will hit.
- Prioritize gaps by likelihood x impact. "What if the database is deleted" is not useful. "What if the network drops mid-save" is.

## Don't Do This

- Don't audit trivial tickets (config changes, copy updates, single-field additions)
- Don't propose ACs for error cases the framework already handles (404 routing, CORS, etc.)
- Don't flag "missing AC" for standard platform behavior (auth redirects, session timeout) unless the ticket explicitly overrides default behavior
- Don't turn a 3-AC ticket into a 30-AC ticket. Find the 2-3 gaps that matter most.
