---
lastVerified:
lastUsedInTask:
---

# Test Review Guidelines

Focus on **high-impact, high-signal tests** that catch real bugs. Avoid recommending low-impact tests.

## ❌ Low-Impact Tests to AVOID

**Simple Presentational Components:**
- Loading skeletons (JourneyTableSkeleton, LoadingSpinner)
- Empty state components (EmptyJourneysState, NoDataPlaceholder)
- Static UI components with no logic or state
- Components that just render props with basic styling

**Why avoid these?**
- They don't contain business logic that can break
- They're visual components better validated by visual testing
- Changes to these are immediately visible in the UI
- Testing them provides minimal bug-catching value

**Examples of what NOT to test:**
```typescript
// ❌ Don't test this - it's just rendering props
export const EmptyState = ({ message, onAction }) => (
  <div>
    <p>{message}</p>
    <button onClick={onAction}>Action</button>
  </div>
);

// ❌ Don't test this - it's just a loading skeleton
export const Skeleton = ({ rows = 5 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-row" />
    ))}
  </div>
);
```

## ✅ High-Impact Tests to RECOMMEND

**Business Logic & State Management:**
- Form validation with edge cases
- API integration with error handling
- Complex state transitions
- User interaction flows with side effects

**Critical User Paths:**
- Authentication flows
- Data submission and persistence
- Error recovery scenarios
- Navigation and routing logic

**Edge Cases That Break Things:**
- Concurrent operations
- Network failures and timeouts
- Invalid or malformed data
- Race conditions and timing issues

**Examples of what TO test:**
```typescript
// ✅ Test this - complex validation logic
export const validateJourneyName = (name: string) => {
  // Business rules that can break
};

// ✅ Test this - state management with side effects
export const useJourneyOperations = () => {
  // Optimistic updates, error handling, rollback logic
};

// ✅ Test this - critical user flow
export const CreateJourneyDialog = ({ onSubmit }) => {
  // Form submission, validation, error states
};
```

## When Reviewing Tests

**Ask yourself:**
1. Does this test catch bugs that would break user workflows?
2. Does this test validate business logic or just rendering?
3. Would this test catch regressions in critical paths?
4. Is this testing implementation details or user-facing behavior?

**If the answer to #1 and #3 is NO, recommend removing the test.**

**Challenge test suggestions with:**
- "This component is purely presentational - testing it provides minimal value"
- "This is a loading skeleton - visual changes are immediately obvious without tests"
- "This empty state has no logic - we'd just be testing that React renders props"
- "Let's focus testing effort on the business logic and critical user paths instead"
