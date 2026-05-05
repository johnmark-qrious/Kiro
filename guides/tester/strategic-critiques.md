---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Strategic Critiques: What NOT to Test

## 1. Avoid Testing Third-Party Libraries
Do not write tests to verify that a primitive (e.g., a Dialog or Popover) opens. Assume vendor-tested components function as intended.

## 2. Minimize Brittle Mocks
Over-mocking leads to "Green-Room" testing where tests pass but the real integration fails. Use MSW or actual Server Action wrappers where possible.

## 3. Adopt Property-Based Testing
Use tools like `fast-check` to validate logic against thousands of edge-case inputs (emojis, null bytes, RTL text) to find non-obvious crashes.

## What to Skip

- **Presentational Components:** Loading skeletons, empty states, static UI components with no logic
- **Library Internals:** Don't test that a third-party dialog opens or closes
- **Obvious Behavior:** Don't test that a button renders or that text displays
- **Implementation Details:** Focus on user-facing behavior, not internal state

## What to Prioritize

- **User Journeys:** Critical paths that users depend on
- **Error Handling:** How the system responds to failures
- **Data Validation:** Ensuring data integrity and security
- **Network Resilience:** Graceful degradation during service disruptions
