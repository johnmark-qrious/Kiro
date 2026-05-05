---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: Migrate Database gRPC Protos

## Overview

Migrate the database app from `@qriousnz/ubiquity-grpc-sdk` to `@qriousnz/ubiquity-protos@2.1.0` by swapping the dependency in `package.json`, updating `next.config.js`, performing a mechanical find-and-replace of import paths across 9 files, and verifying the build. The `templates/` directory is explicitly out of scope.

## Tasks

- [x] 1. Update package.json dependencies
  - [x] 1.1 Remove `@qriousnz/ubiquity-grpc-sdk` from `dependencies` and add `@qriousnz/ubiquity-protos` at version `2.1.0` in `monorepo/apps/database/package.json`
    - _Requirements: 1.1, 2.1_

  - [x] 1.2 Add `@qriousnz/ubiquity-protos` to the `transpilePackages` array in `monorepo/apps/database/next.config.js`
    - Match the journey-builder app's configuration
    - _Requirements: 2.2_

- [x] 2. Migrate list service imports (`/list/v1`)
  - [x] 2.1 Update `src/lib/grpc-clients.ts` to import `ListService` and `TransactionalListService` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve value import style
    - _Requirements: 3.1_

  - [x] 2.2 Update `src/types/ubiquityColumnTypes.ts` to import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve value import style (used as runtime enum keys)
    - _Requirements: 3.2_

  - [x] 2.3 Update `src/types/dropdown.types.ts` to import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve type-only import style
    - _Requirements: 3.3_

  - [x] 2.4 Update `src/domains/add-connector/types/transformation.types.ts` to import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve type-only import style
    - _Requirements: 3.4_

  - [x] 2.5 Update `src/domains/add-connector/components/transformations/TransformationRegistry.ts` to import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve type-only import style
    - _Requirements: 3.5_

  - [x] 2.6 Update `src/domains/accounts/utils/account-table-data.ts` to import `ColumnInfo` and `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve mixed import style (`type ColumnInfo`, value `ColumnType`)
    - _Requirements: 3.6_

  - [x] 2.7 Update `src/domains/add-connector/components/transformations/definitions/FixedValueTransformation.tsx` to import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve value import style (used in runtime comparisons)
    - _Requirements: 3.7_

  - [x] 2.8 Update `src/domains/add-connector/components/transformations/definitions/SendDateTimeTransformation.tsx` to import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve value import style (used in runtime array)
    - _Requirements: 3.8_

- [x] 3. Migrate system service imports (`/system/v1`)
  - [x] 3.1 Update `src/lib/grpc-clients.ts` to import `AccountService` from `@qriousnz/ubiquity-protos/system/v1`
    - Preserve value import style
    - _Requirements: 4.1_

- [x] 4. Migrate test file imports
  - [x] 4.1 Update `__tests__/unit/src/domains/add-connector/components/transformations/definitions/FixedValueTransformation.test.ts` to import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`
    - Preserve value import style
    - _Requirements: 5.1_

- [x] 5. Checkpoint - Verify all import migrations are complete
  - Ensure all 9 files have been updated and no import references to `@qriousnz/ubiquity-grpc-sdk` remain in `src/` or `__tests__/`
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Write property-based tests for migration correctness
  - [ ]* 6.1 Write property test: No residual old SDK imports
    - **Property 1: No residual old SDK imports**
    - Use fast-check with `fc.constantFrom()` to sample all `.ts`/`.tsx` files in `src/` and `__tests__/`
    - Assert no file contains an import referencing `@qriousnz/ubiquity-grpc-sdk`
    - Minimum 100 iterations
    - **Validates: Requirement 1.2**

  - [ ]* 6.2 Write property test: All migrated files import from the new package
    - **Property 2: All migrated files import from the new package**
    - Use fast-check with `fc.constantFrom()` over the 9 migration target file paths
    - Assert each file contains an import from `@qriousnz/ubiquity-protos` with the correct subpath (`/list/v1` or `/system/v1`)
    - Minimum 100 iterations
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 5.1**

- [x] 7. Install dependencies and verify lockfile
  - Run `bun install` in the monorepo root
  - Verify `bun.lock` does not contain any reference to `@qriousnz/ubiquity-grpc-sdk`
  - _Requirements: 1.3_

- [x] 8. Clean build artifacts and run verification
  - [x] 8.1 Delete `.next/` directory and `tsconfig.tsbuildinfo` in `monorepo/apps/database/`
    - _Requirements: 6.1_

  - [x] 8.2 Run `bun run typecheck` in `monorepo/apps/database/` and confirm zero type errors
    - _Requirements: 6.3_

  - [x] 8.3 Run `bun run build` in `monorepo/apps/database/` and confirm successful completion
    - _Requirements: 6.2_

  - [x] 8.4 Run `bun test __tests__/unit` in `monorepo/apps/database/` and confirm all existing unit tests pass
    - _Requirements: 6.4_

- [x] 9. Final checkpoint - Confirm migration complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All file paths are relative to `monorepo/apps/database/`
- The `templates/` directory is explicitly out of scope for this migration
- `ColumnType` import styles (type vs value) must be preserved exactly as-is in each file
- Property tests use fast-check and validate universal correctness properties
- Checkpoints ensure incremental validation before proceeding
