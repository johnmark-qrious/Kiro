---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

This document defines the requirements for standardizing error handling across all applications in the Ubiquity WebApps monorepo (database, journey-builder, and template apps). The database app currently has comprehensive error handling infrastructure including centralized error codes, error sanitization utilities, and a safe-action wrapper. This feature will extract these utilities into a shared package and implement the standardized approach across all apps.

## Glossary

- **Error_Handling_Package**: The new shared package `@monorepo/packages-error-handling` containing reusable error handling utilities
- **Safe_Action_Client**: A wrapper around next-safe-action that automatically sanitizes errors in server actions
- **Error_Code**: A standardized string constant representing a specific error type
- **Error_Reference**: A unique identifier (nanoid) generated for each error occurrence to aid in debugging
- **Custom_Error**: An error class that includes an error code for structured error handling
- **Error_Sanitization**: The process of converting technical errors into user-friendly messages
- **Database_App**: The existing application at `monorepo/apps/database` with complete error handling
- **Journey_Builder_App**: The application at `monorepo/apps/journey-builder` with partial error handling
- **Template_App**: The application at `monorepo/apps/template` with partial error handling

## Requirements

### Requirement 1: Create Shared Error Handling Package

**User Story:** As a developer, I want a shared error handling package, so that all apps can use consistent error handling utilities without code duplication.

#### Acceptance Criteria

1. THE System SHALL create a new package at `monorepo/packages/error-handling`
2. THE Error_Handling_Package SHALL include a package.json with proper dependencies (nanoid, next-safe-action)
3. THE Error_Handling_Package SHALL include a TypeScript configuration that extends the monorepo base config
4. THE Error_Handling_Package SHALL export all error handling utilities through a barrel index file
5. THE Error_Handling_Package SHALL be added to the turbo.json build pipeline

### Requirement 2: Migrate Error Codes to Shared Package

**User Story:** As a developer, I want centralized error codes, so that all apps use the same error code definitions.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL define all error codes from the Database_App in error-codes.ts
2. THE Error_Handling_Package SHALL export an ErrorCodes constant object with all error code strings
3. THE Error_Handling_Package SHALL export an ErrorCode TypeScript type derived from ErrorCodes
4. WHEN an error code is added to the shared package, THEN it SHALL be available to all apps
5. THE Error_Handling_Package SHALL include error codes for Prefect API, Azure, SFTP, validation, session/auth, and generic errors

### Requirement 3: Migrate Error Messages to Shared Package

**User Story:** As a developer, I want centralized error messages, so that all apps display consistent user-friendly error messages.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL define user-friendly messages for all error codes in error-messages.ts
2. THE Error_Handling_Package SHALL export an ErrorMessages constant mapping ErrorCode to string messages
3. WHEN an error code is used, THEN the System SHALL return the corresponding user-friendly message
4. THE error messages SHALL be clear, actionable, and free of technical jargon
5. THE error messages SHALL guide users on how to resolve the issue when possible

### Requirement 4: Migrate Custom Error Class to Shared Package

**User Story:** As a developer, I want a standardized custom error class, so that I can throw errors with structured error codes.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL provide a CustomError class that extends Error
2. THE CustomError class SHALL accept an ErrorCode and optional message in its constructor
3. THE Error_Handling_Package SHALL export a createError helper function for creating CustomError instances
4. THE Error_Handling_Package SHALL export an isCustomError type guard function
5. WHEN a CustomError is created, THEN it SHALL include the error code as a property

### Requirement 5: Migrate Error Utilities to Shared Package

**User Story:** As a developer, I want error sanitization utilities, so that technical errors are converted to user-friendly messages with unique references.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL provide an identifyErrorCode function that maps errors to error codes
2. THE identifyErrorCode function SHALL recognize CustomError instances and return their error code
3. THE identifyErrorCode function SHALL parse error messages to identify known error patterns (Prefect, Azure, SFTP, etc.)
4. THE Error_Handling_Package SHALL provide a handleError function that sanitizes errors
5. WHEN handleError is called, THEN it SHALL generate a unique Error_Reference using nanoid
6. WHEN handleError is called, THEN it SHALL log comprehensive error details server-side for debugging
7. WHEN handleError is called, THEN it SHALL return a user-friendly message with the Error_Reference appended
8. THE handleError function SHALL accept an optional context parameter for logging purposes

### Requirement 6: Migrate Safe Action Client to Shared Package

**User Story:** As a developer, I want a safe action client wrapper, so that all server actions automatically sanitize errors.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL provide a createActionClient function that wraps next-safe-action
2. THE createActionClient function SHALL configure handleServerError to use the handleError utility
3. WHEN a server action throws an error, THEN the Safe_Action_Client SHALL automatically sanitize it
4. WHEN a server action throws an error, THEN the Safe_Action_Client SHALL return a user-friendly message to the client
5. THE Safe_Action_Client SHALL preserve the original error details in server-side logs

### Requirement 7: Update Database App to Use Shared Package

**User Story:** As a developer, I want the database app to use the shared error handling package, so that we eliminate code duplication.

#### Acceptance Criteria

1. WHEN the shared package is available, THEN the Database_App SHALL add it as a dependency
2. THE Database_App SHALL remove its local error handling files (error-codes.ts, error-messages.ts, error-utils.ts, custom-error.ts)
3. THE Database_App SHALL update all imports to reference the Error_Handling_Package
4. THE Database_App SHALL update safe-action.ts to import createActionClient from the shared package
5. WHEN the migration is complete, THEN all existing tests SHALL pass without modification
6. THE Database_App SHALL maintain backward compatibility with existing server actions

### Requirement 8: Implement Error Handling in Journey Builder App

**User Story:** As a developer, I want the journey-builder app to have complete error handling, so that errors are handled consistently across all apps.

#### Acceptance Criteria

1. THE Journey_Builder_App SHALL add the Error_Handling_Package as a dependency
2. THE Journey_Builder_App SHALL remove its local error handling files
3. THE Journey_Builder_App SHALL create a safe-action.ts file that uses createActionClient from the shared package
4. WHEN server actions are added to Journey_Builder_App, THEN they SHALL use the Safe_Action_Client
5. THE Journey_Builder_App SHALL import error codes and utilities from the Error_Handling_Package

### Requirement 9: Implement Error Handling in Template App

**User Story:** As a developer, I want the template app to have complete error handling, so that new apps can be scaffolded with proper error handling.

#### Acceptance Criteria

1. THE Template_App SHALL add the Error_Handling_Package as a dependency
2. THE Template_App SHALL remove its local error handling files
3. THE Template_App SHALL create a safe-action.ts file that uses createActionClient from the shared package
4. WHEN server actions are added to Template_App, THEN they SHALL use the Safe_Action_Client
5. THE Template_App SHALL import error codes and utilities from the Error_Handling_Package
6. THE Template_App SHALL serve as a reference implementation for future apps

### Requirement 10: Comprehensive Testing

**User Story:** As a developer, I want comprehensive tests for error handling, so that I can be confident the error handling works correctly.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL include unit tests for identifyErrorCode covering all error patterns
2. THE Error_Handling_Package SHALL include unit tests for handleError covering all error types
3. THE Error_Handling_Package SHALL include unit tests for CustomError class
4. THE Error_Handling_Package SHALL include integration tests for the Safe_Action_Client
5. WHEN tests are run, THEN they SHALL verify error sanitization produces user-friendly messages
6. WHEN tests are run, THEN they SHALL verify unique Error_Reference generation
7. WHEN tests are run, THEN they SHALL verify error logging includes all necessary debugging information
8. THE tests SHALL achieve at least 90% code coverage for error handling utilities

### Requirement 11: Documentation and Migration Guide

**User Story:** As a developer, I want clear documentation, so that I understand how to use the error handling package.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL include a README.md with usage examples
2. THE README SHALL document how to create custom errors with error codes
3. THE README SHALL document how to use the Safe_Action_Client in server actions
4. THE README SHALL document how to add new error codes and messages
5. THE README SHALL include examples of error handling patterns for common scenarios (API calls, validation, etc.)

### Requirement 12: Backward Compatibility and Migration Safety

**User Story:** As a developer, I want safe migration, so that existing functionality is not broken during the transition.

#### Acceptance Criteria

1. WHEN migrating the Database_App, THEN all existing server actions SHALL continue to work without modification
2. WHEN migrating the Database_App, THEN all existing tests SHALL pass without changes
3. THE migration SHALL be performed in small, independently testable commits
4. WHEN a migration step is complete, THEN the app SHALL be in a working state
5. THE migration SHALL maintain the same error handling behavior as before
6. WHEN errors occur, THEN they SHALL produce the same user-friendly messages as before

### Requirement 13: Monorepo Integration

**User Story:** As a developer, I want proper monorepo integration, so that the error handling package works seamlessly with the build system.

#### Acceptance Criteria

1. THE Error_Handling_Package SHALL be properly configured in the turbo.json pipeline
2. WHEN any app builds, THEN the Error_Handling_Package SHALL be built first as a dependency
3. THE Error_Handling_Package SHALL use TypeScript path aliases for clean imports
4. WHEN the Error_Handling_Package is updated, THEN dependent apps SHALL rebuild automatically
5. THE Error_Handling_Package SHALL follow the same code quality standards as other packages (Biome, TypeScript strict mode)
