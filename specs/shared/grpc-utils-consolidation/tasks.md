---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: gRPC Utils Consolidation

## Overview

This implementation consolidates duplicated gRPC utility functions from the database and journey-builder apps into a shared package. The refactoring follows functional programming patterns with no mutations, explicit dependencies, and strict TypeScript typing. Implementation is split into two phases: creating the shared package, then migrating apps to use it.

## Tasks

### Phase 1: Create Shared gRPC Package

- [x] 1. Set up shared gRPC utilities package structure
  - Create monorepo/packages/grpc-utils directory
  - Create package.json with @monorepo/packages-grpc-utils name
  - Add dependencies: @qriousnz/ubiquity-grpc-sdk, @connectrpc/connect, @monorepo/packages-utils, @monorepo/packages-navbar
  - Create tsconfig.json extending base configuration
  - Add build, lint, format, and typecheck scripts
  - Create src directory with index.ts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 8.1, 8.2, 8.3, 8.4_

- [x] 2. Implement list service utilities
  - [x] 2.1 Create src/list-utils.ts with getListSchema function
    - Accept listClient and rootAccountId parameters
    - Call listClient.getListSchema with includeSystemColumns: false
    - Return GetListSchemaResponse
    - Use strict TypeScript types (no any)
    - _Requirements: 2.1, 2.2, 5.1, 5.2_
  
  - [x] 2.2 Implement getListTableFields function in src/list-utils.ts
    - Accept listClient and rootAccountId parameters
    - Call getListSchema internally
    - Map ColumnInfo[] to DropdownOption[] format
    - Use displayName if available, fallback to name
    - Handle null/undefined columns with empty array
    - Catch errors, log to console, return empty array
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 2.3 Write property test for list table fields mapping
    - **Property 2: List Table Fields Mapping**
    - **Validates: Requirements 2.3, 2.4**
    - Generate random ColumnInfo arrays
    - Verify each DropdownOption has correct id, value, type
    - Verify displayName takes precedence over name
  
  - [ ]* 2.4 Write property test for list table fields error handling
    - **Property 3: List Table Fields Error Handling**
    - **Validates: Requirements 2.5**
    - Simulate client errors
    - Verify empty array return without error propagation

- [x] 3. Implement account service utilities
  - [x] 3.1 Create src/account-utils.ts with getAccountNameAction function
    - Accept listClient and accountId parameters
    - Call getListSchema internally
    - Extract schema.displayName from response
    - Return null if schema invalid or displayName missing
    - Catch errors, log to console, return null
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 3.2 Implement getAccountTree function in src/account-utils.ts
    - Accept accountClient and rootAccountId parameters
    - Call accountClient.getAccountTree with fullInformation: true
    - Return accounts array from response
    - Catch errors, log to console, return empty array
    - _Requirements: 3.5, 3.6, 3.7, 5.3_
  
  - [x] 3.3 Implement getAccountTreeForNavbar function in src/account-utils.ts
    - Accept accountClient, rootAccountId, and userId parameters
    - Call getAccountTree internally
    - Map gRPC AccountInfo to navbar AccountInfo format
    - Generate switchUrl using encodeCompositeGuidPair(id, id)
    - Call buildAccountTree from @monorepo/packages-navbar
    - Return transformed account tree
    - _Requirements: 3.8, 3.9, 3.10, 3.11_
  
  - [ ]* 3.4 Write property test for account name extraction
    - **Property 4: Account Name Extraction**
    - **Validates: Requirements 3.1, 3.2**
    - Generate random schemas with/without displayName
    - Verify correct displayName extraction or null return
  
  - [ ]* 3.5 Write property test for account tree transformation
    - **Property 8: Account Tree Navbar Transformation**
    - **Validates: Requirements 3.8, 3.9, 3.10**
    - Generate random account arrays
    - Verify correct mapping to navbar format
    - Verify switchUrl format and encoding

- [x] 4. Define shared type definitions
  - Create src/types.ts with DropdownOption interface
  - Include id: string, value: string, type?: ColumnType
  - Import ColumnType from @qriousnz/ubiquity-grpc-sdk
  - Ensure backward compatibility with existing app types
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Configure package exports
  - Export getListSchema and getListTableFields from src/index.ts
  - Export getAccountNameAction, getAccountTree, getAccountTreeForNavbar from src/index.ts
  - Export DropdownOption type from src/index.ts
  - Document that apps must pass configured clients to functions
  - _Requirements: 1.4, 2.7, 3.11, 5.6_

- [x] 6. Write unit tests for high-impact shared package functions
  - Test getListTableFields with valid columns (HIGH IMPACT - used in dropdowns)
  - Test getListTableFields with client error (HIGH IMPACT - error handling)
  - Test getAccountNameAction with valid schema (HIGH IMPACT - used in UI)
  - Test getAccountNameAction with missing displayName (HIGH IMPACT - edge case)
  - Test getAccountTreeForNavbar with valid accounts (HIGH IMPACT - navigation)
  - Mock gRPC clients using vi.fn()
  - All tests MUST pass before proceeding

- [x] 7. Checkpoint - Verify shared package builds and type-checks
  - Run bun turbo typecheck to verify no type errors
  - Run bun turbo build to verify package builds successfully
  - Run bun turbo test:unit to verify all tests pass
  - ALL TESTS MUST PASS - do not proceed if any test fails

### Phase 2: Migrate Apps to Shared Package

- [-] 8. Update database app to use shared package
  - [x] 8.1 Add shared package dependency to database app
    - Add @monorepo/packages-grpc-utils to monorepo/apps/database/package.json dependencies
    - Run bun install to update lockfile
    - _Requirements: 6.1, 8.5_
  
  - [ ] 8.2 Update database app imports to use shared package
    - Replace imports in files using getListSchema
    - Replace imports in files using getListTableFields
    - Replace imports in files using getAccountNameAction
    - Replace imports in files using getAccountTree
    - Replace imports in files using getAccountTreeForNavbar
    - Update all import statements to reference @monorepo/packages-grpc-utils
    - Pass configured listClient and accountClient to shared functions
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.10, 6.11_
  
  - [ ] 8.3 Delete duplicated files from database app
    - Delete monorepo/apps/database/src/domains/accounts/utils/account-table-data.ts
    - Delete monorepo/apps/database/src/domains/accounts/actions/get-account-name.ts
    - Delete monorepo/apps/database/src/domains/accounts/utils/server-account-data.ts
    - _Requirements: 6.7, 6.8, 6.9_
  
  - [ ]* 8.4 Write property test for database app behavioral equivalence
    - **Property 10: Behavioral Equivalence After Refactoring**
    - **Validates: Requirements 9.1, 9.2, 9.4**
    - Generate random inputs
    - Compare outputs from shared package vs original implementations
    - Verify identical behavior

- [ ] 9. Update journey-builder app to use shared package
  - [ ] 9.1 Add shared package dependency to journey-builder app
    - Add @monorepo/packages-grpc-utils to monorepo/apps/journey-builder/package.json dependencies
    - Run bun install to update lockfile
    - _Requirements: 7.1, 8.6_
  
  - [ ] 9.2 Update journey-builder app imports to use shared package
    - Replace imports in files using getListSchema
    - Replace imports in files using getListTableFields
    - Replace imports in files using getAccountNameAction
    - Replace imports in files using getAccountTree
    - Replace imports in files using getAccountTreeForNavbar
    - Update all import statements to reference @monorepo/packages-grpc-utils
    - Pass configured listClient and accountClient to shared functions
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.10, 7.11_
  
  - [ ] 9.3 Delete duplicated files from journey-builder app
    - Delete monorepo/apps/journey-builder/src/domains/accounts/utils/account-table-data.ts
    - Delete monorepo/apps/journey-builder/src/domains/accounts/actions/get-account-name.ts
    - Delete monorepo/apps/journey-builder/src/domains/accounts/utils/server-account-data.ts
    - _Requirements: 7.7, 7.8, 7.9_
  
  - [ ]* 9.4 Write property test for journey-builder app behavioral equivalence
    - **Property 10: Behavioral Equivalence After Refactoring**
    - **Validates: Requirements 9.1, 9.2, 9.4**
    - Generate random inputs
    - Compare outputs from shared package vs original implementations
    - Verify identical behavior

- [ ] 10. Update template app to use shared package
  - Add @monorepo/packages-grpc-utils to template app package.json
  - Update template app imports to reference shared package
  - Delete duplicated utility files from template app
  - Document shared package usage in template app README
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 11. Verify dependency management
  - Run bun install to ensure all dependencies resolve correctly
  - Run bun run check:sherif to verify no missing dependencies
  - Verify no reliance on workspace hoisting
  - _Requirements: 8.7, 8.8_

- [ ] 12. Final checkpoint - Verify all apps build and function correctly
  - Run bun turbo typecheck to verify no type errors across all apps
  - Run bun turbo build to verify all apps build successfully
  - Run bun turbo test:unit to verify all tests pass
  - ALL TESTS MUST PASS - fix any failing tests before completing
  - Verify database app functionality preserved
  - Verify journey-builder app functionality preserved
  - _Requirements: 9.5, 9.6, 9.7, 9.8_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- Each task references specific requirements for traceability
- Phase 1 creates the shared package infrastructure
- Phase 2 migrates apps to use the shared package and removes duplicated code
- All functions follow functional programming patterns (no mutations, no let)
- Strict TypeScript typing enforced (no any types due to Biome)
- Explicit dependencies declared in all package.json files
- Property tests validate universal correctness properties
- **Unit tests focus on high-impact functions only** (dropdowns, navigation, error handling)
- **ALL TESTS MUST PASS** - do not proceed to next phase if tests fail
