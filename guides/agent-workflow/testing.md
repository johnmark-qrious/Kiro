---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Phase 3: Testing

When writing tests for existing code:

## Step 1: Write Tests
Use **@tester** to write high-value tests
- Focus on critical user paths
- Test negative scenarios (expected failures)
- Use property-based testing where appropriate
- Test resilience and error handling
- Avoid testing library internals or low-impact components

## Step 2: Review Tests
Let **@quality-assurance** review test coverage and quality.

**Handoff context**: Include a summary of what @tester wrote — which files, what scenarios are covered, and any trade-offs made. This avoids the reviewer re-reading everything blind.

- Check if tests catch real bugs
- Identify missing edge cases
- Challenge low-impact tests
- Verify test quality and clarity

## Step 3: Refine Tests (conditional)
Only re-invoke **@tester** if @quality-assurance identified gaps or issues.
- If @quality-assurance found no issues → tests are complete, skip this step
- If @quality-assurance found gaps → refine with @tester:
  - Address gaps identified by @quality-assurance
  - Remove or improve low-value tests
  - Add missing edge case coverage
  - Improve test clarity

## What @tester Should Test

✅ **High-Impact:**
- Business logic and validation
- API integration and error handling
- Complex state management
- Critical user workflows
- Edge cases that break things

❌ **Low-Impact (Skip):**
- Loading skeletons
- Empty state components
- Simple presentational components
- Components that just render props

## Example

```
User: "We need tests for the CreateJourneyDialog component"

1. @tester - Write high-value tests (critical paths, negative scenarios)
2. @quality-assurance - Review test coverage and quality
3. IF gaps found → @tester - Refine tests based on feedback
   IF no issues → done
```
