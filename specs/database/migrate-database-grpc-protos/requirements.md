---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

The database app (`monorepo/apps/database`) currently imports gRPC service clients and protobuf types from the deprecated `@qriousnz/ubiquity-grpc-sdk` package. The journey-builder app has already been migrated to `@qriousnz/ubiquity-protos@2.1.0`. This migration aligns the database app with the same package, enabling monorepo-wide consistency and eventual removal of the old SDK.

The migration affects 9 files (8 source + 1 test) across two import paths:
- `@qriousnz/ubiquity-grpc-sdk/list/v1` → `@qriousnz/ubiquity-protos/list/v1` (exports: `ListService`, `TransactionalListService`, `ColumnType`, `ColumnInfo`)
- `@qriousnz/ubiquity-grpc-sdk/system/v1` → `@qriousnz/ubiquity-protos/system/v1` (exports: `AccountService`)

Note: `ColumnType` is used as both a type import (e.g. in type annotations and interface definitions) and a value import (e.g. in runtime comparisons and switch statements) across different files. Both import styles must be preserved as-is during migration.

**Out of scope:** The `templates/` directory migration is not covered by this spec and will be handled in a separate follow-up.

## Glossary

- **Database_App**: The Next.js application located at `monorepo/apps/database/`, responsible for list and account management via gRPC.
- **Old_SDK**: The `@qriousnz/ubiquity-grpc-sdk` npm package, which is being deprecated.
- **New_Protos_Package**: The `@qriousnz/ubiquity-protos@2.1.0` npm package, which replaces the Old_SDK.
- **gRPC_Client_Module**: The file `src/lib/grpc-clients.ts` that creates and exports gRPC service clients.
- **Build_Pipeline**: The `bun run build` and `bun run typecheck` commands used to verify the Database_App compiles correctly.

## Requirements

### Requirement 1: Remove Old SDK Dependency

**User Story:** As a developer, I want the Old_SDK removed from the Database_App's dependencies, so that the monorepo no longer depends on the deprecated package.

#### Acceptance Criteria

1. WHEN the migration is complete, THE Database_App SHALL have `@qriousnz/ubiquity-grpc-sdk` removed from the `dependencies` section of `package.json`.
2. WHEN the migration is complete, THE Database_App SHALL have zero import statements referencing `@qriousnz/ubiquity-grpc-sdk` across all source and test files.
3. WHEN `bun install` is run after the migration, THE `bun.lock` file SHALL NOT contain any reference to `@qriousnz/ubiquity-grpc-sdk`.

### Requirement 2: Add New Protos Package Dependency

**User Story:** As a developer, I want the New_Protos_Package added to the Database_App's dependencies, so that gRPC types and service descriptors are available from the current package.

#### Acceptance Criteria

1. WHEN the migration is complete, THE Database_App SHALL list `@qriousnz/ubiquity-protos` at version `2.1.0` in the `dependencies` section of `package.json`.
2. WHEN the migration is complete, THE Database_App SHALL include `@qriousnz/ubiquity-protos` in the `transpilePackages` array of `next.config.js`, matching the journey-builder app's configuration.

### Requirement 3: Migrate List Service Imports

**User Story:** As a developer, I want all imports from `@qriousnz/ubiquity-grpc-sdk/list/v1` updated to `@qriousnz/ubiquity-protos/list/v1`, so that the Database_App uses the current proto definitions for list operations.

#### Acceptance Criteria

1. WHEN the gRPC_Client_Module is loaded, THE Database_App SHALL import `ListService` and `TransactionalListService` from `@qriousnz/ubiquity-protos/list/v1`.
2. WHEN `src/types/ubiquityColumnTypes.ts` is loaded, THE Database_App SHALL import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`.
3. WHEN `src/types/dropdown.types.ts` is loaded, THE Database_App SHALL import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`.
4. WHEN `src/domains/add-connector/types/transformation.types.ts` is loaded, THE Database_App SHALL import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`.
5. WHEN `src/domains/add-connector/components/transformations/TransformationRegistry.ts` is loaded, THE Database_App SHALL import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`.
6. WHEN `src/domains/accounts/utils/account-table-data.ts` is loaded, THE Database_App SHALL import `ColumnInfo` and `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`.
7. WHEN `src/domains/add-connector/components/transformations/definitions/FixedValueTransformation.tsx` is loaded, THE Database_App SHALL import `ColumnType` (value import) from `@qriousnz/ubiquity-protos/list/v1`.
8. WHEN `src/domains/add-connector/components/transformations/definitions/SendDateTimeTransformation.tsx` is loaded, THE Database_App SHALL import `ColumnType` (value import) from `@qriousnz/ubiquity-protos/list/v1`.

### Requirement 4: Migrate System Service Imports

**User Story:** As a developer, I want all imports from `@qriousnz/ubiquity-grpc-sdk/system/v1` updated to `@qriousnz/ubiquity-protos/system/v1`, so that the Database_App uses the current proto definitions for account operations.

#### Acceptance Criteria

1. WHEN the gRPC_Client_Module is loaded, THE Database_App SHALL import `AccountService` from `@qriousnz/ubiquity-protos/system/v1`.

### Requirement 5: Migrate Test File Imports

**User Story:** As a developer, I want test files updated to import from the New_Protos_Package, so that tests remain consistent with the production source code.

#### Acceptance Criteria

1. WHEN the `FixedValueTransformation.test.ts` test file is loaded, THE Database_App SHALL import `ColumnType` from `@qriousnz/ubiquity-protos/list/v1`.

### Requirement 6: Build and Type-Check Verification

**User Story:** As a developer, I want the Database_App to build and type-check successfully after migration, so that I can confirm no type incompatibilities were introduced.

#### Acceptance Criteria

1. BEFORE running build or type-check verification, THE `.next/` directory and `tsconfig.tsbuildinfo` file SHALL be deleted to ensure a clean build with no stale cached artifacts.
2. WHEN `bun run build` is executed in the Database_App directory, THE Build_Pipeline SHALL complete without errors.
3. WHEN `bun run typecheck` is executed in the Database_App directory, THE Build_Pipeline SHALL complete without type errors.
4. WHEN `bun test __tests__/unit` is executed in the Database_App directory, THE Build_Pipeline SHALL pass all existing unit tests without modification to test assertions.

### Requirement 7: Runtime gRPC Compatibility

**User Story:** As a developer, I want the gRPC service clients to function correctly at runtime after migration, so that list, transactional list, and account operations continue to work.

#### Acceptance Criteria

1. THE gRPC_Client_Module SHALL export an `accountClient` that connects to the AccountService using the New_Protos_Package service descriptor.
2. THE gRPC_Client_Module SHALL export a `listClient` that connects to the ListService using the New_Protos_Package service descriptor.
3. THE gRPC_Client_Module SHALL export a `transactionalListClient` that connects to the TransactionalListService using the New_Protos_Package service descriptor.
4. WHEN a gRPC call is made through any exported client, THE gRPC_Client_Module SHALL produce identical request and response behavior as the Old_SDK clients.
