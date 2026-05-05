---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: Standardize Error Handling

## Overview

This implementation plan standardizes error handling across all Ubiquity WebApps by creating a shared `@monorepo/packages-error-handling` package and migrating all apps to use it. The work is organized into small, independently testable commits that can be grouped into 2-3 pull requests.

**Azure DevOps Work Item:** 3452935

## Tasks

### Phase 1: Create Shared Error Handling Package

- [x] 1. Set up error handling package structure
  - Create `monorepo/packages/error-handling` directory
  - Create package.json with dependencies (nanoid, next-safe-action)
  - Create tsconfig.json extending monorepo base config
  - Add package to turbo.json build pipeline
  - Create src directory structure
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 13.1, 13.2, 13.5_

- [x] 2. Implement error codes module
  - [x] 2.1 Create src/errors/error-codes.ts
    - Define ErrorCodes constant with common error codes (validation, auth, generic)
    - Exclude database-specific errors (Prefect, Azure, SFTP) - these remain in database app
    - Export ErrorCode TypeScript type
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ]* 2.2 Write unit tests for error codes
    - Test that all expected error codes exist
    - Test ErrorCode type inference
    - _Requirements: 10.1_

- [x] 3. Implement error messages module
  - [x] 3.1 Create src/errors/error-messages.ts
    - Define ErrorMessages mapping for common error codes
    - Exclude database-specific error messages (Prefect, Azure, SFTP)
    - Import ErrorCode type and ErrorCodes constant
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 3.2 Write property test for error message coverage
    - **Property 1: Complete Error Message Coverage**
    - **Validates: Requirements 3.1**

- [x] 4. Implement CustomError class
  - [x] 4.1 Create src/errors/custom-error.ts
    - Implement CustomError class extending Error
    - Implement createError helper function
    - Implement isCustomError type guard
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 4.2 Write unit tests for CustomError
    - Test CustomError extends Error
    - Test constructor with code and optional message
    - Test createError helper
    - _Requirements: 10.3_
  
  - [ ]* 4.3 Write property test for isCustomError type guard
    - **Property 2: CustomError Type Guard Accuracy**
    - **Validates: Requirements 4.4**

- [x] 5. Implement error utilities module
  - [x] 5.1 Create src/errors/error-utils.ts
    - Implement identifyErrorCode function
    - Add pattern matching for Prefect, Azure, SFTP errors
    - Implement handleError function with nanoid reference generation
    - Add comprehensive error logging
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [ ]* 5.2 Write unit tests for identifyErrorCode
    - Test CustomError recognition
    - Test pattern matching for all error types
    - Test unknown error handling
    - Test null/undefined handling
    - _Requirements: 10.1_
  
  - [ ]* 5.3 Write property test for CustomError identification
    - **Property 3: Error Code Identification for CustomError**
    - **Validates: Requirements 5.1, 5.2**
  
  - [ ]* 5.4 Write property test for error pattern recognition
    - **Property 4: Error Pattern Recognition**
    - **Validates: Requirements 5.1, 5.3**
  
  - [ ]* 5.5 Write unit tests for handleError
    - Test error sanitization
    - Test error reference generation
    - Test logging with context
    - Test logging without context
    - _Requirements: 10.2_
  
  - [ ]* 5.6 Write property test for error sanitization
    - **Property 5: Error Sanitization with Reference**
    - **Validates: Requirements 5.4, 5.7**
  
  - [ ]* 5.7 Write property test for unique reference generation
    - **Property 6: Unique Error Reference Generation**
    - **Validates: Requirements 5.5**

- [x] 6. Implement safe action client
  - [x] 6.1 Create src/safe-action.ts
    - Implement createActionClient function
    - Configure handleServerError to use handleError
    - Export default actionClient instance
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 6.2 Write integration tests for safe action client
    - Test action client creation
    - Test error sanitization in server actions
    - Test original error preservation in logs
    - _Requirements: 10.4_
  
  - [ ]* 6.3 Write property test for safe action error sanitization
    - **Property 7: Safe Action Error Sanitization**
    - **Validates: Requirements 6.3**

- [x] 7. Create package exports and documentation
  - [x] 7.1 Create src/index.ts barrel exports
    - Export all error codes, types, and utilities
    - Export CustomError and helpers
    - Export safe action client
    - _Requirements: 1.4_
  
  - [x] 7.2 Create README.md with usage examples
    - Document how to create custom errors
    - Document how to use safe action client
    - Document how to add new error codes
    - Include common error handling patterns
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 8. Checkpoint - Verify shared package works
  - Run all tests in error-handling package
  - Verify package builds successfully
  - Verify exports are correct
  - Ask user if questions arise

### Phase 1.5: Clean Up Auth Package Duplicate Errors

- [x] 8.5. Remove duplicate error handling from auth package
  - [x] 8.5.1 Update auth package to depend on error-handling package
    - Add @monorepo/packages-error-handling to auth package.json
    - Run bun install
    - _Requirements: 1.5, 7.1_
  
  - [x] 8.5.2 Update auth package exports
    - Update src/errors/index.ts to re-export from @monorepo/packages-error-handling
    - Keep backward compatibility for existing imports
    - _Requirements: 7.3, 7.4_
  
  - [ ] 8.5.3 Delete duplicate error files from auth package (DEFERRED TO PHASE 2)
    - **NOTE:** Keep src/errors/error-codes.ts and src/errors/custom-error.ts for now
    - These files will be deleted in Phase 2 after database app migration
    - This prevents breaking changes to database app which imports from auth package
    - Keep src/errors/index.ts as re-export barrel for backward compatibility
    - _Requirements: 7.2_
  
  - [x] 8.5.4 Verify auth package still works
    - Run type check on auth package
    - Verify no breaking changes to auth package exports
    - _Requirements: 7.5, 12.5_

- [x] 8.6. Checkpoint - Auth package cleanup complete
  - Ensure auth package builds successfully
  - Verify backward compatibility maintained
  - Ask user if questions arise

### Phase 2: Migrate Database App Error Handling

- [x] 9. Update database app dependencies and TypeScript configuration
  - [ ] 9.1 Add @monorepo/packages-error-handling to database app package.json
    - Add dependency reference
    - Run bun install
    - _Requirements: 7.1_
  
  - [ ] 9.2 Update database app tsconfig.json path mappings
    - Add path mappings for error-handling package subpath exports:
      - `"@monorepo/packages-error-handling": ["../../packages/error-handling/src/index.ts"]`
      - `"@monorepo/packages-error-handling/errors": ["../../packages/error-handling/src/errors/index.ts"]`
      - `"@monorepo/packages-error-handling/safe-action": ["../../packages/error-handling/src/safe-action.ts"]`
    - _Requirements: 7.1_
  
  - [ ] 9.3 Update error-handling package.json exports
    - Add subpath exports to package.json:
      - `"./errors": "./src/errors/index.ts"`
      - `"./safe-action": "./src/safe-action.ts"`
    - Enables tree-shaking and clearer import paths
    - _Requirements: 1.4_
  
  - [ ] 9.4 Update database app imports
    - Update all imports in src/lib/errors/index.ts to re-export from shared package
    - Update imports in src/lib/safe-action.ts
    - Update imports in src/services/prefect-api.ts
    - Update imports in src/services/prefect-api-singleton.ts
    - Update imports in src/app/api/connectors/utils.ts
    - _Requirements: 7.3, 7.4_

- [ ] 10. Remove duplicate common error codes from database app
  - [ ] 10.1 Update database app error-codes.ts
    - Keep database-specific errors (Prefect, Azure, SFTP)
    - Remove common errors that now exist in shared package (validation, auth, generic)
    - Import and re-export common ErrorCodes from shared package
    - Merge database-specific and common error codes
    - _Requirements: 7.2, 7.3_
  
  - [ ] 10.2 Update database app error-messages.ts
    - Keep database-specific error messages (Prefect, Azure, SFTP)
    - Remove common error messages that now exist in shared package
    - Import and merge with ErrorMessages from shared package
    - _Requirements: 7.2, 7.3_
  
  - [ ] 10.3 Delete duplicate utility files from database app
    - Delete src/lib/errors/error-utils.ts (now in shared package)
    - Delete src/lib/errors/custom-error.ts (now in shared package)
    - Update src/lib/errors/index.ts to export merged error codes and messages
    - _Requirements: 7.2_
  
  - [ ] 10.4 Update safe-action.ts to use shared package
    - Import createActionClient from shared package
    - Remove local handleError import
    - _Requirements: 7.4_
  
  - [ ] 10.5 Delete duplicate error files from auth package
    - Delete monorepo/packages/auth/src/errors/error-codes.ts
    - Delete monorepo/packages/auth/src/errors/custom-error.ts
    - Keep only src/errors/index.ts as re-export barrel
    - Verify auth package still works after deletion
    - _Requirements: 7.2_

- [ ] 11. Verify database app migration
  - [ ] 11.1 Run existing database app tests
    - Verify all tests pass without modification
    - Verify error messages are unchanged
    - _Requirements: 7.5, 7.6, 12.1, 12.2, 12.5, 12.6_
  
  - [ ] 11.2 Test database app server actions
    - Verify connector actions work correctly
    - Verify error handling behavior is unchanged
    - _Requirements: 7.6, 12.1_

- [ ] 12. Checkpoint - Database app migration complete
  - Ensure all tests pass
  - Verify no regressions in error handling
  - Ask user if questions arise

### Phase 3: Implement Error Handling in Journey Builder

- [ ] 13. Add error handling to journey-builder app
  - [ ] 13.1 Add @monorepo/packages-error-handling dependency
    - Update journey-builder package.json
    - Run bun install
    - _Requirements: 8.1_
  
  - [ ] 13.2 Update journey-builder tsconfig.json path mappings
    - Add path mappings for error-handling package subpath exports:
      - `"@monorepo/packages-error-handling": ["../../packages/error-handling/src/index.ts"]`
      - `"@monorepo/packages-error-handling/errors": ["../../packages/error-handling/src/errors/index.ts"]`
      - `"@monorepo/packages-error-handling/safe-action": ["../../packages/error-handling/src/safe-action.ts"]`
    - _Requirements: 8.1_
  
  - [ ] 13.3 Remove local error handling files
    - Delete src/lib/errors/error-codes.ts
    - Delete src/lib/errors/custom-error.ts
    - _Requirements: 8.2_
  
  - [ ] 13.4 Create safe-action.ts in journey-builder
    - Create src/lib/safe-action.ts
    - Import and configure createActionClient from shared package
    - Export actionClient for use in server actions
    - _Requirements: 8.3, 8.4_
  
  - [ ] 13.5 Update journey-builder imports
    - Update any existing error code imports to use shared package
    - _Requirements: 8.5_

- [ ] 14. Checkpoint - Journey builder implementation complete
  - Verify journey-builder builds successfully
  - Verify error handling is properly configured
  - Ask user if questions arise

### Phase 4: Implement Error Handling in Template App

- [ ] 15. Add error handling to template app
  - [ ] 15.1 Add @monorepo/packages-error-handling dependency
    - Update template package.json
    - Run bun install
    - _Requirements: 9.1_
  
  - [ ] 15.2 Update template tsconfig.json path mappings
    - Add path mappings for error-handling package subpath exports:
      - `"@monorepo/packages-error-handling": ["../../packages/error-handling/src/index.ts"]`
      - `"@monorepo/packages-error-handling/errors": ["../../packages/error-handling/src/errors/index.ts"]`
      - `"@monorepo/packages-error-handling/safe-action": ["../../packages/error-handling/src/safe-action.ts"]`
    - _Requirements: 9.1_
  
  - [ ] 15.3 Remove local error handling files
    - Delete src/lib/errors/error-codes.ts
    - Delete src/lib/errors/custom-error.ts
    - _Requirements: 9.2_
  
  - [ ] 15.4 Create safe-action.ts in template app
    - Create src/lib/safe-action.ts
    - Import and configure createActionClient from shared package
    - Export actionClient for use in server actions
    - Add usage comments for future developers
    - _Requirements: 9.3, 9.4, 9.6_
  
  - [ ] 15.5 Update template app imports
    - Update any existing error code imports to use shared package
    - _Requirements: 9.5_

- [ ] 16. Final checkpoint - All apps migrated
  - Run turbo build to verify all apps build successfully
  - Run turbo test to verify all tests pass
  - Verify error handling is consistent across all apps
  - Ask user if questions arise

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task should be a separate commit for easy tracking in Azure DevOps
- After each checkpoint or blocker, add a summary comment to Azure DevOps work item 3452935
- The migration maintains backward compatibility - no changes to existing server action signatures
- All error messages remain the same to avoid user-facing changes
- Property tests should run minimum 100 iterations each
- Target code coverage: 90% for error handling utilities

## Pull Request Organization

**PR 1: Create Shared Error Handling Package and Clean Up Auth**
- Tasks 1-8.6 (Phase 1 + Phase 1.5)
- Creates the new shared package with common error utilities
- Removes duplicate errors from auth package
- Independent and can be merged without affecting existing apps

**PR 2: Migrate Database App Error Handling**
- Tasks 9-12 (Phase 2)
- Migrates database app to use shared package for common errors
- Keeps database-specific errors (Prefect, Azure, SFTP) in database app
- Includes verification that all existing tests pass

**PR 3: Implement in Journey Builder and Template**
- Tasks 13-16 (Phases 3-4)
- Adds error handling to journey-builder and template apps
- Completes the standardization across all apps
