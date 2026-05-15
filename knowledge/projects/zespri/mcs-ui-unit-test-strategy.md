---
sync: draft
lastLocalEdit: 2026-05-13T16:17:00+12:00
---

# Zespri MCS - UI Unit Test Strategy (High-Value Only)

## Principle

Only test logic that's complex, critical, or has broken before. Don't test that a button renders.

---

## Tier 1: Business Logic Helpers (Pure Functions, Highest ROI)

| File | What to Test | Why High Value |
|------|-------------|----------------|
| `src/helpers/sample-requests.ts` | Status display logic, state-dependent UI rules | Wrong status = user makes wrong decision |
| `src/helpers/request/request.ts` | Token verification, permission_obj decoding, KPIN encoding | Auth bugs = security holes |
| `src/helpers/areas.ts` | Area validation rules, block association logic | Wrong validation = bad data |
| `src/helpers/features.ts` | Feature flag evaluation | Wrong check = unauthorized access |
| `src/helpers/roles.ts` | Role checking logic | Same |
| `src/helpers/generate-sample-id.ts` | S-number/B-number generation | Duplicate IDs = data corruption |
| `src/api/eapi.ts` -> `executeJsonQuery` | JSON column parsing from SQL Server | Silent data loss if parsing fails |

## Tier 2: Custom Hooks (Stateful Logic)

| Hook | What to Test | Why High Value |
|------|-------------|----------------|
| `use-has-feature-permission.ts` | Permission evaluation against permission_obj | Controls what users see/do |
| `use-authorization.ts` | Redirect logic for unauthorized users | Wrong = content flash |
| `use-is-role.ts` | Role matching logic | Admin features exposed to wrong users |
| `use-pagination.ts` | Page calculation, boundary conditions | Off-by-one = missing data |

## Tier 3: Extract Complex Component Logic + Test

Don't test rendering. Extract logic into testable functions:

| Component | Logic to Extract | Why |
|-----------|-----------------|-----|
| `Sample/SampleRequestList` | Status override logic (Cleared(o), Failed(d), provisional) | Code says "I am sorry this is hacky" |
| `Sample/SearchAndFilter` | Filter set serialization, filter combination | Complex state |
| `SeasonRollover` | Activity dependency ordering, date validation | Wrong order = data corruption |
| `SamplingArea/SamplingAreaForm` | Dispensation rule evaluation, block uniqueness | Business rules |
| `OrchardHazard/OrchardHazardForm` | Stop Sampling severity cascade | Triggers SR cancellations |

## What NOT to Test

- Component rendering / snapshots
- API route handlers (covered by integration tests)
- Simple CRUD forms with no logic
- Tooltip content, CSS, layout
- Mock data routes

---

## Test Structure

```
src/
├── helpers/
│   ├── __tests__/
│   │   ├── sample-requests.test.ts
│   │   ├── areas.test.ts
│   │   ├── features.test.ts
│   │   ├── roles.test.ts
│   │   └── generate-sample-id.test.ts
│   └── request/
│       └── __tests__/
│           └── request.test.ts
├── hooks/
│   └── __tests__/
│       ├── use-has-feature-permission.test.ts
│       ├── use-authorization.test.ts
│       └── use-pagination.test.ts
└── components/
    └── Sample/
        └── __tests__/
            └── status-display-logic.test.ts
```

## Example: Permission Hook Test

```typescript
describe('useHasFeaturePermission', () => {
  it('grants access with exact feature+permission+kpin', () => {
    const user = mockUser({ permissions: [
      { mcs_feature: 'samplerequest', mcs_permission: 'Write', kpin: 1234 }
    ]});
    expect(hasFeaturePermission(user, 'samplerequest', 'Write', 1234)).toBe(true);
  });

  it('grants access with wildcard kpin (-1)', () => {
    const user = mockUser({ permissions: [
      { mcs_feature: 'samplerequest', mcs_permission: 'Write', kpin: -1 }
    ]});
    expect(hasFeaturePermission(user, 'samplerequest', 'Write', 9999)).toBe(true);
  });

  it('denies when permission does not match', () => {
    const user = mockUser({ permissions: [
      { mcs_feature: 'samplerequest', mcs_permission: 'Read', kpin: 1234 }
    ]});
    expect(hasFeaturePermission(user, 'samplerequest', 'Write', 1234)).toBe(false);
  });

  it('zespri admin bypasses all checks', () => {
    const user = mockUser({ is_zespri: true, permissions: [] });
    expect(hasFeaturePermission(user, 'anything', 'Write', 9999)).toBe(true);
  });
});
```

## Effort Estimate

| Work | With AI |
|------|---------|
| Tier 1: Helper function tests (7 files) | 3-4 hours |
| Tier 2: Hook tests (4 hooks) | 2-3 hours |
| Tier 3: Extract + test complex logic (5 components) | 4-6 hours |
| **Total** | **~1.5 days** |
