---
status: draft
approvedBy:
approvedDate:
---

# Design Document: Migrate Journey Builder to Intl.DateTimeFormat

## Overview

This design specifies the migration from a custom date formatting utility (`formatDateTime` in `date-utils.ts`) to the browser-native `Intl.DateTimeFormat` API. The migration affects a single location in the journey-builder application and will eliminate an unnecessary dependency while maintaining exact output format compatibility.

The current implementation uses manual string manipulation to format dates as "DD/MM/YYYY HH:MM". The new implementation will leverage `Intl.DateTimeFormat` with the `en-GB` locale, which naturally produces the desired day/month/year ordering, combined with string manipulation to remove the default comma separator that Intl adds between date and time components.

## Architecture

### Current State

```
journey-builder/src/app/page.tsx
  └─> imports formatDateTime from @monorepo/packages-utils/date-utils
      └─> packages/utils/src/date-utils.ts (custom implementation)
```

### Target State

```
journey-builder/src/app/page.tsx
  └─> imports formatDateTime from @monorepo/packages-utils/date-utils
      └─> packages/utils/src/date-utils.ts (Intl-based implementation)
```

The formatter will remain as a shared utility in the packages/utils directory, updated to use Intl.DateTimeFormat instead of manual string manipulation.

## Components and Interfaces

### Date Formatter Module

**Location:** `monorepo/packages/utils/src/date-utils.ts`

**Function Signature:**
```typescript
export function formatDateTime(date: Date | null | undefined): string
```

**Implementation Strategy:**

1. **Input Validation:** Check for null, undefined, and invalid Date objects before formatting
2. **Intl Configuration:** Use `Intl.DateTimeFormat` with specific options:
   - Locale: `'en-GB'` (produces DD/MM/YYYY ordering)
   - Timezone: `'UTC'` (explicit timezone for consistency)
   - Options: `{ day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }`
3. **Comma Removal:** The Intl API produces output like "15/01/2024, 10:30" - we need to remove the comma and ensure single space
4. **Error Handling:** Return appropriate fallback strings for invalid inputs

**Pseudocode:**
```typescript
function formatDateTime(date: Date | null | undefined): string {
  // Handle null/undefined
  if (date == null) return "N/A"
  
  // Handle invalid Date objects
  if (isNaN(date.getTime())) return "Invalid Date"
  
  // Format using Intl
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  })
  
  // Format and remove comma separator
  const formatted = formatter.format(date)
  return formatted.replace(',', '')
}
```

### Page Component Update

**Location:** `monorepo/apps/journey-builder/src/app/page.tsx`

**Changes Required:**
1. No changes needed - the import path and function signature remain identical
2. The existing import `import { formatDateTime } from "@monorepo/packages-utils/date-utils";` continues to work

## Data Models

### Input Types

```typescript
type DateInput = Date | null | undefined
```

### Output Format

```typescript
type FormattedDate = string // Pattern: "DD/MM/YYYY HH:MM"
```

**Format Specification:**
- Day: 2 digits (01-31)
- Month: 2 digits (01-12)
- Year: 4 digits
- Hour: 2 digits, 24-hour format (00-23)
- Minute: 2 digits (00-59)
- Date separator: `/`
- Time separator: `:`
- Date-time separator: single space (` `)

**Examples:**
- `new Date('2024-01-15T10:30:00Z')` → `"15/01/2024 10:30"`
- `new Date('2024-12-31T23:59:00Z')` → `"31/12/2024 23:59"`
- `null` → `"N/A"`
- `undefined` → `"N/A"`
- `new Date('invalid')` → `"Invalid Date"`

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing the acceptance criteria, I identified the following testable properties:

1. **Format pattern validation (1.3)** - For all valid dates, output matches "DD/MM/YYYY HH:MM" pattern
2. **Implementation equivalence (1.5)** - For all valid dates, new formatter produces same output as old formatter
3. **UTC consistency (3.2)** - For all valid dates, output is consistent regardless of system timezone

**Redundancy Analysis:**
- Properties 1 and 2 are NOT redundant - Property 1 validates the format structure, while Property 2 validates behavioral equivalence with the existing implementation
- Property 3 is distinct as it validates timezone-independent behavior

All three properties provide unique validation value and should be retained.

### Property 1: Output Format Pattern Validation

For any valid Date object, the formatted output SHALL match the pattern `DD/MM/YYYY HH:MM` where DD is 2-digit day (01-31), MM is 2-digit month (01-12), YYYY is 4-digit year, HH is 2-digit hour in 24-hour format (00-23), and MM is 2-digit minute (00-59), with forward slashes as date separators, colons as time separators, and a single space between date and time.

**Validates: Requirements 1.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8**

### Property 2: Implementation Equivalence

For any valid Date object, formatting with the new Intl-based formatter SHALL produce identical output to the legacy custom formatter implementation.

**Validates: Requirements 1.5**

### Property 3: UTC Timezone Consistency

For any valid Date object, the formatted output SHALL be identical regardless of the system's local timezone configuration, because the formatter explicitly uses UTC timezone.

**Validates: Requirements 3.2**

## Error Handling

### Invalid Input Handling

The formatter implements defensive programming with explicit handling for three categories of invalid input:

1. **Null Input:** Returns `"N/A"`
   - Rationale: Null represents intentionally missing data
   - User-friendly representation of "not applicable"

2. **Undefined Input:** Returns `"N/A"`
   - Rationale: Undefined represents uninitialized or missing data
   - Consistent with null handling for user experience

3. **Invalid Date Objects:** Returns `"Invalid Date"`
   - Rationale: Invalid Date objects (e.g., `new Date('invalid')`) represent malformed data
   - Distinct from null/undefined to aid debugging
   - Detection: Use `isNaN(date.getTime())` to check validity

### Error Handling Strategy

- **No Exceptions:** The formatter never throws exceptions, always returns a string
- **Type Safety:** TypeScript union type `Date | null | undefined` makes invalid inputs explicit
- **Fail-Safe:** Invalid inputs produce human-readable fallback strings rather than crashes

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit Tests:** Verify specific examples, edge cases, and error conditions
- **Property Tests:** Verify universal properties across randomized inputs

Both approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs and document expected behavior through examples, while property tests verify general correctness across a wide input space.

### Property-Based Testing

**Framework:** Use `fast-check` library for property-based testing in TypeScript/Bun environment

**Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each test must reference its design document property via comment tag
- Tag format: `// Feature: migrate-journey-builder-intl-date-format, Property {number}: {property_text}`

**Property Test Specifications:**

1. **Property 1: Format Pattern Validation**
   - Generator: Random valid Date objects across full date range
   - Assertion: Output matches regex `/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/`
   - Additional checks: Day (01-31), Month (01-12), Hour (00-23), Minute (00-59)

2. **Property 2: Implementation Equivalence**
   - Generator: Random valid Date objects
   - Assertion: `newFormatter(date) === oldFormatter(date)`
   - Note: Keep old implementation temporarily for comparison testing

3. **Property 3: UTC Consistency**
   - Generator: Random valid Date objects
   - Setup: Mock different system timezones (if possible) or verify UTC is used
   - Assertion: Output is identical regardless of timezone context

### Unit Testing

**Framework:** Bun's built-in test runner (`bun:test`)

**Test File Location:** `monorepo/packages/utils/__tests__/date-utils.test.ts`

**Unit Test Cases:**

1. **Valid Date Examples:**
   - `new Date('2024-01-15T10:30:00Z')` → `"15/01/2024 10:30"`
   - `new Date('2024-12-31T23:59:00Z')` → `"31/12/2024 23:59"`
   - `new Date('2024-02-29T00:00:00Z')` → `"29/02/2024 00:00"` (leap year)

2. **Edge Cases:**
   - `null` → `"N/A"`
   - `undefined` → `"N/A"`
   - `new Date('invalid')` → `"Invalid Date"`
   - `new Date(NaN)` → `"Invalid Date"`

3. **Boundary Values:**
   - First day of month: `new Date('2024-01-01T00:00:00Z')` → `"01/01/2024 00:00"`
   - Last day of month: `new Date('2024-01-31T23:59:00Z')` → `"31/01/2024 23:59"`
   - Midnight: `new Date('2024-06-15T00:00:00Z')` → `"15/06/2024 00:00"`
   - End of day: `new Date('2024-06-15T23:59:00Z')` → `"15/06/2024 23:59"`

### Integration Verification

After implementation:
1. Run journey-builder application locally
2. Verify table displays dates in correct format
3. Visual inspection: dates should appear identical to before migration

### Migration Verification Steps

1. **Post-migration Check:** Verify no broken imports after updating `date-utils.ts`
   - Run: `bun run typecheck` in journey-builder
   - Expected: No type errors

2. **Test Execution:** All tests pass
   - Run: `bun test` in packages/utils
   - Expected: All property tests pass (100+ iterations each), all unit tests pass

## Implementation Plan

### Phase 1: Update Formatter

1. Update `monorepo/packages/utils/src/date-utils.ts` to use Intl.DateTimeFormat
2. Add support for null/undefined inputs with appropriate fallbacks
3. Add JSDoc documentation with examples

### Phase 2: Create Tests

1. Create `monorepo/packages/utils/__tests__/date-utils.test.ts`
2. Install `fast-check` if not already available: `bun add -d fast-check`
3. Implement property-based tests (3 properties)
4. Implement unit tests (edge cases and examples)
5. Run tests to verify implementation: `bun test`

### Phase 3: Verify Integration

1. Run type check: `bun run typecheck` in journey-builder
2. Run full test suite: `bun test` in packages/utils
3. Manual verification: Start dev server and inspect journey table

### Phase 4: Documentation

1. Add code comments explaining Intl configuration choices
2. Document UTC timezone decision
3. Update any relevant documentation (if exists)

## Design Decisions and Rationale

### Decision 1: Keep as Shared Package

**Choice:** Update existing utility in `packages/utils/src/date-utils.ts`

**Rationale:**
- Maintains existing import paths (no breaking changes)
- Keeps the utility available for future use in other apps
- Simpler migration - only update implementation, not import paths
- Follows principle: if it's already shared, keep it shared unless there's a reason not to

### Decision 2: Intl.DateTimeFormat vs Manual String Manipulation

**Choice:** Use Intl.DateTimeFormat with post-processing

**Rationale:**
- Intl is a web standard, well-tested and maintained
- Handles locale-specific formatting automatically
- More maintainable than manual date arithmetic
- Small post-processing (comma removal) is acceptable trade-off
- Future-proof: easier to add localization if needed

### Decision 3: UTC Timezone

**Choice:** Explicitly specify `timeZone: 'UTC'` in Intl options

**Rationale:**
- Ensures consistent output across different deployment environments
- Prevents bugs from timezone mismatches between client/server
- Makes behavior predictable and testable
- Matches common practice for stored dates (typically UTC)
- Documented explicitly to prevent future confusion

### Decision 4: Error Handling Strategy

**Choice:** Return fallback strings instead of throwing exceptions

**Rationale:**
- UI should degrade gracefully, not crash
- Table rendering continues even with invalid dates
- Distinct messages ("N/A" vs "Invalid Date") aid debugging
- Consistent with React best practices (avoid throwing in render)

### Decision 5: Keep Old Implementation for Testing

**Choice:** Temporarily keep old formatter for equivalence testing

**Rationale:**
- Property 2 requires comparing old vs new implementation
- Provides confidence that migration doesn't change behavior
- Can be removed after tests pass and migration is verified
- Low cost: just one small file temporarily retained

## Migration Risks and Mitigation

### Risk 1: Intl Browser Compatibility

**Risk:** Intl.DateTimeFormat might not be available in all environments

**Likelihood:** Very Low (Intl is supported in all modern browsers and Node.js)

**Mitigation:** 
- Next.js polyfills Intl automatically if needed
- Can add explicit check if concerned: `if (!Intl.DateTimeFormat) throw new Error(...)`

### Risk 2: Comma Removal Edge Cases

**Risk:** String replacement of comma might fail in unexpected locales

**Likelihood:** Low (en-GB consistently uses comma separator)

**Mitigation:**
- Explicitly specify 'en-GB' locale (not system locale)
- Property tests will catch any format deviations
- Unit tests verify exact output format

### Risk 3: Timezone Confusion

**Risk:** Developers might not realize dates are formatted in UTC

**Likelihood:** Medium (common source of date bugs)

**Mitigation:**
- Explicit `timeZone: 'UTC'` in configuration
- JSDoc comments document timezone behavior
- Property test verifies UTC consistency
- Code comments explain the decision

### Risk 4: Breaking Other Code

**Risk:** Other code might import the date-utils in the future

**Likelihood:** Low (currently only one import)

**Mitigation:**
- Maintain backward compatibility with same function signature
- Add comprehensive tests to ensure behavior is preserved
- TypeScript will catch any type mismatches immediately

## Future Considerations

### Potential Enhancements

1. **Localization:** If journey-builder needs to support multiple locales in the future, the Intl-based approach makes this straightforward - just pass locale as a parameter

2. **Timezone Selection:** If users need to see dates in their local timezone, the formatter can accept an optional timezone parameter

3. **Relative Dates:** Could add "2 hours ago" style formatting using `Intl.RelativeTimeFormat`

4. **Date Parsing:** If the app needs to parse user-entered dates, consider adding a complementary `parseDateTime` function

### Non-Goals

This migration explicitly does NOT:
- Change the output format (must remain "DD/MM/YYYY HH:MM")
- Change the import path or function signature (backward compatible)
- Affect other apps (database app has its own timeUtils.ts)
- Add localization support (can be added later if needed)
- Change how dates are stored or transmitted (only display formatting)
