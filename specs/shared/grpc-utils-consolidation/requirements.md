---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

This feature consolidates duplicated gRPC utility functions that exist across multiple Next.js applications (database and journey-builder) into a shared package. Currently, identical implementations of account and list service wrappers are maintained separately in each app, leading to maintenance overhead, potential inconsistencies, and violation of DRY principles. By extracting these utilities into a shared package, we ensure consistent behavior, reduce code duplication, and simplify future maintenance.

## Glossary

- **gRPC_Client**: A client instance created using @connectrpc/connect that communicates with backend gRPC services
- **List_Service**: The gRPC service that provides list schema and column information from @qriousnz/ubiquity-grpc-sdk
- **Account_Service**: The gRPC service that provides account hierarchy and metadata from @qriousnz/ubiquity-grpc-sdk
- **Shared_Package**: A monorepo package under monorepo/packages/ that can be imported by multiple apps
- **Transport**: The gRPC transport layer that handles connection pooling and interceptors
- **Session_Interceptor**: Middleware that injects session headers into gRPC requests
- **Dropdown_Option**: A standardized data structure for UI dropdown components containing id, value, and optional type
- **Account_Tree**: A hierarchical structure of account information used for navigation and account switching

## Requirements

### Requirement 1: Create Shared gRPC Utilities Package

**User Story:** As a developer, I want a dedicated shared package for gRPC utilities, so that I can reuse common gRPC wrapper functions across multiple applications without duplication.

#### Acceptance Criteria

1. THE System SHALL create a new package at monorepo/packages/grpc-utils with proper package.json configuration
2. THE Package SHALL declare @qriousnz/ubiquity-grpc-sdk as a dependency
3. THE Package SHALL declare @connectrpc/connect as a dependency
4. THE Package SHALL export utilities through a main index.ts file
5. THE Package SHALL follow the same structure as existing shared packages (error-handling, utils, navbar)
6. THE Package SHALL be named @monorepo/packages-grpc-utils in package.json
7. THE Package SHALL include TypeScript configuration for type checking
8. THE Package SHALL include build, lint, format, and typecheck scripts

### Requirement 2: Extract List Service Utilities

**User Story:** As a developer, I want list service utilities consolidated in one place, so that both database and journey-builder apps use the same implementation for fetching list schemas and table fields.

#### Acceptance Criteria

1. THE Shared_Package SHALL provide a getListSchema function that accepts rootAccountId and returns list schema response
2. THE getListSchema function SHALL call listClient.getListSchema with includeSystemColumns set to false
3. THE Shared_Package SHALL provide a getListTableFields function that accepts rootAccountId and returns DropdownOption array
4. THE getListTableFields function SHALL map ColumnInfo objects to DropdownOption format with id, value, and type properties
5. WHEN getListTableFields encounters an error, THE function SHALL log the error and return an empty array
6. WHEN listSchema.schema.columns is null or undefined, THE getListTableFields function SHALL return an empty array
7. THE Shared_Package SHALL export these functions from a list-utils module

### Requirement 3: Extract Account Service Utilities

**User Story:** As a developer, I want account service utilities consolidated in one place, so that both apps use the same implementation for fetching account information and building account trees.

#### Acceptance Criteria

1. THE Shared_Package SHALL provide a getAccountNameAction function that accepts accountId and returns account display name or null
2. THE getAccountNameAction function SHALL use getListSchema internally to fetch account information
3. WHEN listSchema is invalid or missing schema.displayName, THE getAccountNameAction function SHALL return null
4. WHEN getAccountNameAction encounters an error, THE function SHALL log the error and return null
5. THE Shared_Package SHALL provide a getAccountTree function that accepts rootAccountId and returns account array
6. THE getAccountTree function SHALL call accountClient.getAccountTree with fullInformation set to true
7. WHEN getAccountTree encounters an error, THE function SHALL log the error and return an empty array
8. THE Shared_Package SHALL provide a getAccountTreeForNavbar function that accepts rootAccountId and userId
9. THE getAccountTreeForNavbar function SHALL convert gRPC AccountInfo to navbar AccountInfo format with pre-computed switch URLs
10. THE getAccountTreeForNavbar function SHALL use encodeCompositeGuidPair for generating switch URLs
11. THE Shared_Package SHALL export these functions from an account-utils module

### Requirement 4: Standardize Type Definitions

**User Story:** As a developer, I want consistent type definitions for shared data structures, so that all apps use the same types when working with gRPC utilities.

#### Acceptance Criteria

1. THE Shared_Package SHALL define or re-export a DropdownOption type with id, value, and optional type properties
2. THE DropdownOption type SHALL include ColumnType from @qriousnz/ubiquity-grpc-sdk for the type property
3. THE Shared_Package SHALL export all necessary types from a types module
4. WHERE apps already use compatible DropdownOption types, THE Shared_Package SHALL maintain backward compatibility

### Requirement 5: Handle gRPC Client Dependencies

**User Story:** As a developer, I want the shared package to work with app-specific gRPC clients, so that session management and transport configuration remain in each app's control.

#### Acceptance Criteria

1. THE Shared_Package functions SHALL accept gRPC client instances as parameters rather than creating clients internally
2. THE getListSchema function SHALL accept a listClient parameter of type ListService client
3. THE getAccountTree function SHALL accept an accountClient parameter of type AccountService client
4. THE Shared_Package SHALL NOT create transport or client instances
5. THE Shared_Package SHALL NOT depend on app-specific session interceptors or environment configuration
6. THE Shared_Package SHALL document that apps must pass their configured clients to utility functions

### Requirement 6: Refactor Database App to Use Shared Package

**User Story:** As a developer, I want the database app to use the shared gRPC utilities, so that we eliminate duplicated code and ensure consistency.

#### Acceptance Criteria

1. THE Database_App SHALL add @monorepo/packages-grpc-utils as a workspace dependency
2. THE Database_App SHALL import getListSchema from @monorepo/packages-grpc-utils
3. THE Database_App SHALL import getListTableFields from @monorepo/packages-grpc-utils
4. THE Database_App SHALL import getAccountNameAction from @monorepo/packages-grpc-utils
5. THE Database_App SHALL import getAccountTree from @monorepo/packages-grpc-utils
6. THE Database_App SHALL import getAccountTreeForNavbar from @monorepo/packages-grpc-utils
7. THE Database_App SHALL delete monorepo/apps/database/src/domains/accounts/utils/account-table-data.ts
8. THE Database_App SHALL delete monorepo/apps/database/src/domains/accounts/actions/get-account-name.ts
9. THE Database_App SHALL delete monorepo/apps/database/src/domains/accounts/utils/server-account-data.ts
10. THE Database_App SHALL update all import statements to reference the shared package
11. THE Database_App SHALL pass its configured listClient and accountClient to shared utility functions

### Requirement 7: Refactor Journey Builder App to Use Shared Package

**User Story:** As a developer, I want the journey-builder app to use the shared gRPC utilities, so that we eliminate duplicated code and ensure consistency.

#### Acceptance Criteria

1. THE Journey_Builder_App SHALL add @monorepo/packages-grpc-utils as a workspace dependency
2. THE Journey_Builder_App SHALL import getListSchema from @monorepo/packages-grpc-utils
3. THE Journey_Builder_App SHALL import getListTableFields from @monorepo/packages-grpc-utils
4. THE Journey_Builder_App SHALL import getAccountNameAction from @monorepo/packages-grpc-utils
5. THE Journey_Builder_App SHALL import getAccountTree from @monorepo/packages-grpc-utils
6. THE Journey_Builder_App SHALL import getAccountTreeForNavbar from @monorepo/packages-grpc-utils
7. THE Journey_Builder_App SHALL delete monorepo/apps/journey-builder/src/domains/accounts/utils/account-table-data.ts
8. THE Journey_Builder_App SHALL delete monorepo/apps/journey-builder/src/domains/accounts/actions/get-account-name.ts
9. THE Journey_Builder_App SHALL delete monorepo/apps/journey-builder/src/domains/accounts/utils/server-account-data.ts
10. THE Journey_Builder_App SHALL update all import statements to reference the shared package
11. THE Journey_Builder_App SHALL pass its configured listClient and accountClient to shared utility functions

### Requirement 8: Maintain Explicit Dependencies

**User Story:** As a developer, I want all packages to explicitly declare their dependencies, so that builds are reproducible and don't rely on workspace hoisting.

#### Acceptance Criteria

1. THE Shared_Package SHALL explicitly declare @qriousnz/ubiquity-grpc-sdk in its package.json dependencies
2. THE Shared_Package SHALL explicitly declare @connectrpc/connect in its package.json dependencies
3. THE Shared_Package SHALL explicitly declare @monorepo/packages-utils in its package.json dependencies for composite-guid-utils
4. THE Shared_Package SHALL explicitly declare @monorepo/packages-navbar in its package.json dependencies for buildAccountTree
5. THE Database_App SHALL explicitly declare @monorepo/packages-grpc-utils in its package.json dependencies
6. THE Journey_Builder_App SHALL explicitly declare @monorepo/packages-grpc-utils in its package.json dependencies
7. WHEN bun install runs, THE System SHALL resolve all dependencies without relying on hoisting
8. WHEN bun run check:sherif runs, THE System SHALL report no missing dependencies

### Requirement 9: Preserve Existing Functionality

**User Story:** As a developer, I want the refactoring to maintain all existing behavior, so that no functionality is broken during consolidation.

#### Acceptance Criteria

1. THE Shared_Package functions SHALL produce identical outputs to the original implementations for the same inputs
2. THE Shared_Package functions SHALL handle errors in the same way as original implementations
3. THE Shared_Package functions SHALL log errors with the same messages as original implementations
4. WHEN apps call shared utilities, THE behavior SHALL be identical to calling the original duplicated functions
5. THE Database_App SHALL continue to function correctly after refactoring
6. THE Journey_Builder_App SHALL continue to function correctly after refactoring
7. WHEN bun turbo typecheck runs, THE System SHALL report no type errors
8. WHEN bun turbo build runs, THE System SHALL build all apps successfully

### Requirement 10: Update Template App

**User Story:** As a developer, I want the app template to use the shared gRPC utilities, so that new apps start with the consolidated approach.

#### Acceptance Criteria

1. THE Template_App SHALL add @monorepo/packages-grpc-utils as a workspace dependency
2. THE Template_App SHALL import gRPC utilities from @monorepo/packages-grpc-utils instead of local implementations
3. THE Template_App SHALL delete duplicated utility files that now exist in the shared package
4. THE Template_App SHALL serve as a reference for future app development using shared gRPC utilities
