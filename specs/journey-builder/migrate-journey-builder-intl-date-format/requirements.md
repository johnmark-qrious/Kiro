---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

This specification defines the requirements for migrating the date-utils package from a custom date formatting implementation to the standard Intl.DateTimeFormat API. The current implementation uses manual string manipulation in `monorepo/packages/utils/src/date-utils.ts`. This migration will modernize the codebase, reduce maintenance burden, and leverage browser-native internationalization capabilities while maintaining exact output format compatibility and backward compatibility with existing consumers.

## Glossary

- **Journey_Builder**: The application located at `monorepo/apps/journey-builder` that displays journey information
- **Date_Formatter**: The component responsible for converting Date objects into formatted string representations
- **Custom_Date_Utils**: The existing custom date formatting package at `monorepo/packages/utils/src/date-utils.ts`
- **Intl_API**: The browser-native Internationalization API (Intl.DateTimeFormat)
- **Format_String**: The target output format "DD/MM/YYYY HH:MM" (day/month/year hour:minute in 24-hour format)
- **Page_Component**: The React component at `monorepo/apps/journey-builder/src/app/page.tsx`

## Requirements

### Requirement 1: Replace Custom Date Formatter with Intl API

**User Story:** As a developer, I want to use the standard Intl.DateTimeFormat API instead of custom date utilities, so that the codebase is more maintainable and leverages browser-native capabilities.

#### Acceptance Criteria

1. THE Date_Formatter SHALL use Intl.DateTimeFormat with locale 'en-GB' for formatting dates
2. THE Date_Formatter SHALL configure Intl.DateTimeFormat with day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
3. THE Date_Formatter SHALL produce output in the Format_String pattern "DD/MM/YYYY HH:MM"
4. THE Date_Formatter SHALL remove the default comma separator between date and time components
5. FOR ALL valid Date objects, formatting with the new Date_Formatter SHALL produce identical output to the Custom_Date_Utils implementation (round-trip equivalence)

### Requirement 2: Handle Invalid Date Inputs

**User Story:** As a developer, I want the date formatter to handle invalid inputs gracefully, so that the application doesn't crash when encountering null or invalid dates.

#### Acceptance Criteria

1. WHEN a null date value is provided, THE Date_Formatter SHALL return a fallback string "N/A"
2. WHEN an undefined date value is provided, THE Date_Formatter SHALL return a fallback string "N/A"
3. WHEN an invalid Date object is provided, THE Date_Formatter SHALL return a fallback string "Invalid Date"
4. THE Date_Formatter SHALL validate date inputs before attempting to format them

### Requirement 3: Specify Timezone Explicitly

**User Story:** As a developer, I want date formatting to use an explicit timezone, so that output is consistent across different environments and deployment contexts.

#### Acceptance Criteria

1. THE Date_Formatter SHALL specify a timezone in the Intl.DateTimeFormat configuration
2. THE Date_Formatter SHALL use 'UTC' as the default timezone to ensure consistent behavior
3. THE Date_Formatter SHALL document the timezone choice in code comments

### Requirement 4: Maintain Backward Compatibility

**User Story:** As a developer, I want the date-utils package to maintain its existing API, so that no code changes are needed in consuming applications.

#### Acceptance Criteria

1. THE Date_Formatter SHALL maintain the same function signature as the existing implementation
2. THE Date_Formatter SHALL remain at the same file path `monorepo/packages/utils/src/date-utils.ts`
3. THE Date_Formatter SHALL maintain the same export name `formatDateTime`
4. THE Page_Component SHALL NOT require any import path changes

### Requirement 5: Verify No Breaking Changes

**User Story:** As a developer, I want to ensure the migration doesn't break existing functionality, so that the application continues to work correctly.

#### Acceptance Criteria

1. THE system SHALL verify that all existing imports of Custom_Date_Utils continue to work
2. THE system SHALL run type checking to ensure no type errors are introduced
3. THE system SHALL verify that the journey-builder application displays dates correctly after the migration

### Requirement 6: Maintain Output Format Consistency

**User Story:** As a user, I want dates to display in the same format after the migration, so that the UI remains consistent and familiar.

#### Acceptance Criteria

1. THE Date_Formatter SHALL format dates with 2-digit day values (01-31)
2. THE Date_Formatter SHALL format dates with 2-digit month values (01-12)
3. THE Date_Formatter SHALL format dates with 4-digit year values
4. THE Date_Formatter SHALL format times with 2-digit hour values in 24-hour format (00-23)
5. THE Date_Formatter SHALL format times with 2-digit minute values (00-59)
6. THE Date_Formatter SHALL use forward slashes (/) as date separators
7. THE Date_Formatter SHALL use colons (:) as time separators
8. THE Date_Formatter SHALL use a single space between date and time components
