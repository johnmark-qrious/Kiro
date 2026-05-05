---
status: draft
approvedBy:
approvedDate:
---

# Design Document: gRPC Utils Consolidation

## Overview

This design consolidates duplicated gRPC utility functions from the database and journey-builder apps into a shared package (`@monorepo/packages-grpc-utils`). The consolidation eliminates code duplication, ensures consistent behavior across apps, and simplifies maintenance.

The shared package provides pure, functional utilities for:
- Fetching list schemas and table fields
- Retrieving account information and building account trees
- Converting gRPC responses to UI-friendly formats

All functions follow functional programming principles: no mutations, no side effects (except I/O), and composable design. Functions accept gRPC clients as parameters rather than creating them internally, preserving app-specific session management and transport configuration.

## Architecture

### Package Structure

```
monorepo/packages/grpc-utils/
├── src/
│   ├── list-utils.ts          # List service utilities
│   ├── account-utils.ts       # Account service utilities
│   ├── types.ts               # Shared type definitions
│   └── index.ts               # Main exports
├── package.json
└── tsconfig.json
```

### Dependency Graph

```
@monorepo/packages-grpc-utils
├── @qriousnz/ubiquity-grpc-sdk (external)
├── @connectrpc/connect (external)
├── @monorepo/packages-utils (workspace)
└── @monorepo/packages-navbar (workspace)

database app
├── @monorepo/packages-grpc-utils (workspace)
└── [existing dependencies]

journey-builder app
├── @monorepo/packages-grpc-utils (workspace)
└── [existing dependencies]
```

### Design Principles

1. **Functional Purity**: Functions are pure transformations with no mutations
2. **Dependency Injection**: gRPC clients passed as parameters, not created internally
3. **Explicit Dependencies**: All dependencies declared in package.json (no hoisting reliance)
4. **Type Safety**: Strict TypeScript types, no `any` (enforced by Biome)
5. **Error Handling**: Graceful degradation with empty arrays/null returns
6. **Minimal Bundle Size**: Direct exports, no barrel imports

## Components and Interfaces

### List Utilities (`list-utils.ts`)

#### `getListSchema`

```typescript
export async function getListSchema(
  listClient: PromiseClient<typeof ListService>,
  rootAccountId: string
): Promise<GetListSchemaResponse>
```

**Purpose**: Fetch list schema for a given account

**Parameters**:
- `listClient`: Configured ListService client with session context
- `rootAccountId`: Account ID to fetch schema for

**Returns**: `GetListSchemaResponse` from gRPC SDK

**Behavior**:
- Calls `listClient.getListSchema` with `includeSystemColumns: false`
- Propagates errors to caller (no error handling at this level)

#### `getListTableFields`

```typescript
export async function getListTableFields(
  listClient: PromiseClient<typeof ListService>,
  rootAccountId: string
): Promise<DropdownOption[]>
```

**Purpose**: Fetch list columns and transform to dropdown options

**Parameters**:
- `listClient`: Configured ListService client with session context
- `rootAccountId`: Account ID to fetch fields for

**Returns**: Array of `DropdownOption` objects with `id`, `value`, and optional `type`

**Behavior**:
- Calls `getListSchema` internally
- Maps `ColumnInfo[]` to `DropdownOption[]`
- Uses `displayName` if available, falls back to `name`
- Returns empty array on error or missing columns
- Logs errors to console

### Account Utilities (`account-utils.ts`)

#### `getAccountNameAction`

```typescript
export async function getAccountNameAction(
  listClient: PromiseClient<typeof ListService>,
  accountId: string
): Promise<string | null>
```

**Purpose**: Fetch display name for an account

**Parameters**:
- `listClient`: Configured ListService client with session context
- `accountId`: Account ID to fetch name for

**Returns**: Account display name or `null` if not found

**Behavior**:
- Calls `getListSchema` internally
- Extracts `schema.displayName` from response
- Returns `null` if schema is invalid, array, or missing displayName
- Returns `null` on error
- Logs errors to console

#### `getAccountTree`

```typescript
export async function getAccountTree(
  accountClient: PromiseClient<typeof AccountService>,
  rootAccountId: string
): Promise<AccountInfo_Grpc[]>
```

**Purpose**: Fetch account hierarchy tree

**Parameters**:
- `accountClient`: Configured AccountService client with session context
- `rootAccountId`: Root account ID for tree

**Returns**: Array of gRPC `AccountInfo` objects

**Behavior**:
- Calls `accountClient.getAccountTree` with `fullInformation: true`
- Returns `accounts` array from response
- Returns empty array on error
- Logs errors to console

#### `getAccountTreeForNavbar`

```typescript
export async function getAccountTreeForNavbar(
  accountClient: PromiseClient<typeof AccountService>,
  rootAccountId: string,
  userId: string
): Promise<AccountInfo[]>
```

**Purpose**: Fetch and transform account tree for navbar component

**Parameters**:
- `accountClient`: Configured AccountService client with session context
- `rootAccountId`: Root account ID for tree
- `userId`: Current user ID for tree building

**Returns**: Array of navbar `AccountInfo` objects with switch URLs

**Behavior**:
- Calls `getAccountTree` internally
- Maps gRPC `AccountInfo` to navbar `AccountInfo` format
- Generates switch URLs using `encodeCompositeGuidPair(id, id)`
- Calls `buildAccountTree` from `@monorepo/packages-navbar`
- Returns result from `buildAccountTree`

### Type Definitions (`types.ts`)

```typescript
import type { ColumnType } from "@qriousnz/ubiquity-grpc-sdk/list/v1";

export interface DropdownOption {
  id: string;
  value: string;
  type?: ColumnType;
}
```

**Purpose**: Standardized type for UI dropdown components

**Compatibility**: Matches existing `DropdownOption` types in both apps

### Main Exports (`index.ts`)

```typescript
export { getListSchema, getListTableFields } from "./list-utils";
export {
  getAccountNameAction,
  getAccountTree,
  getAccountTreeForNavbar,
} from "./account-utils";
export type { DropdownOption } from "./types";
```

## Data Models

### Input Models

**ListService Client**:
- Type: `PromiseClient<typeof ListService>`
- Source: `@connectrpc/connect` + `@qriousnz/ubiquity-grpc-sdk`
- Contains: Session interceptor, transport configuration

**AccountService Client**:
- Type: `PromiseClient<typeof AccountService>`
- Source: `@connectrpc/connect` + `@qriousnz/ubiquity-grpc-sdk`
- Contains: Session interceptor, transport configuration

### Output Models

**DropdownOption**:
```typescript
{
  id: string;           // Column ID or unique identifier
  value: string;        // Display text (displayName or name)
  type?: ColumnType;    // Optional column type from gRPC SDK
}
```

**AccountInfo (Navbar)**:
```typescript
{
  id: string;           // Account ID
  displayName: string;  // Account display name
  parentId: string;     // Parent account ID
  switchUrl: string;    // Pre-computed switch URL
}
```

### Transformation Flows

**ColumnInfo → DropdownOption**:
```
ColumnInfo {
  id: "col-123"
  name: "email"
  displayName: "Email Address"
  columnType: ColumnType.TEXT
}
↓
DropdownOption {
  id: "col-123"
  value: "Email Address"  // displayName || name
  type: ColumnType.TEXT
}
```

**AccountInfo (gRPC) → AccountInfo (Navbar)**:
```
AccountInfo_Grpc {
  id: "acc-456"
  displayName: "Acme Corp"
  parentId: "acc-123"
}
↓
AccountInfo {
  id: "acc-456"
  displayName: "Acme Corp"
  parentId: "acc-123"
  switchUrl: "/accounts/home/switchto/[encoded]"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties. Many criteria relate to project structure, configuration files, or compile-time type checking, which are not suitable for runtime property-based testing. The properties below focus on functional behavior that can be verified through automated tests.

**Redundancy Analysis**:
- Properties 2.1 and 2.2 could be combined, but 2.1 tests the general behavior while 2.2 tests specific client call parameters
- Properties 3.1 and 3.2 are kept separate as they test different aspects (return type vs internal implementation)
- Properties 9.1 and 9.4 are redundant - 9.1 is more general and subsumes 9.4
- Properties 6.11 and 7.11 are identical in nature and can be combined into a single property about app integration

After reflection, the following properties provide unique validation value:

### Property 1: List Schema Retrieval

*For any* valid rootAccountId and configured listClient, calling `getListSchema(listClient, rootAccountId)` should return a response that matches the result of calling `listClient.getListSchema({ listId: rootAccountId, includeSystemColumns: false })` directly.

**Validates: Requirements 2.1, 2.2**

### Property 2: List Table Fields Mapping

*For any* valid list schema response with non-null columns array, calling `getListTableFields` should return an array where each DropdownOption has:
- `id` matching the corresponding ColumnInfo.id
- `value` matching ColumnInfo.displayName (or ColumnInfo.name if displayName is empty)
- `type` matching ColumnInfo.columnType

**Validates: Requirements 2.3, 2.4**

### Property 3: List Table Fields Error Handling

*For any* error thrown by the listClient, calling `getListTableFields` should return an empty array without propagating the error.

**Validates: Requirements 2.5**

### Property 4: Account Name Extraction

*For any* valid accountId and configured listClient, if `getListSchema` returns a valid schema with displayName, then `getAccountNameAction(listClient, accountId)` should return that displayName; otherwise it should return null.

**Validates: Requirements 3.1, 3.2**

### Property 5: Account Name Error Handling

*For any* error thrown by the listClient, calling `getAccountNameAction` should return null without propagating the error.

**Validates: Requirements 3.4**

### Property 6: Account Tree Retrieval

*For any* valid rootAccountId and configured accountClient, calling `getAccountTree(accountClient, rootAccountId)` should return a response that matches the accounts array from calling `accountClient.getAccountTree({ rootAccountId, fullInformation: true })` directly.

**Validates: Requirements 3.5, 3.6**

### Property 7: Account Tree Error Handling

*For any* error thrown by the accountClient, calling `getAccountTree` should return an empty array without propagating the error.

**Validates: Requirements 3.7**

### Property 8: Account Tree Navbar Transformation

*For any* valid account tree response, calling `getAccountTreeForNavbar` should return an array where each AccountInfo has:
- `id`, `displayName`, and `parentId` matching the gRPC AccountInfo
- `switchUrl` in the format `/accounts/home/switchto/[encodedId]` where encodedId is the result of `encodeCompositeGuidPair(id, id)`

**Validates: Requirements 3.8, 3.9, 3.10**

### Property 9: Client Dependency Injection

*For any* utility function in the shared package, the function should accept a gRPC client instance as a parameter and should not create or import any client, transport, or session interceptor internally.

**Validates: Requirements 5.1**

### Property 10: Behavioral Equivalence After Refactoring

*For any* valid inputs to the shared utility functions, the outputs should be identical to the outputs from the original app-specific implementations when given the same inputs and client configurations.

**Validates: Requirements 9.1, 9.2, 9.4, 6.11, 7.11**

## Error Handling

### Error Handling Strategy

The shared package follows a **graceful degradation** strategy:

1. **No Error Propagation**: Utility functions catch errors and return safe defaults
2. **Safe Defaults**: Empty arrays for list functions, `null` for single-value functions
3. **Error Logging**: All errors logged to console for debugging
4. **Caller Responsibility**: Apps can check for empty/null returns and handle accordingly

### Error Scenarios

**Network Failures**:
- gRPC client throws connection error
- Function catches error, logs it, returns safe default
- App receives empty array or null, can show appropriate UI

**Invalid Data**:
- Schema missing expected fields (e.g., no `displayName`)
- Function checks for null/undefined, returns safe default
- No error thrown, graceful handling

**Invalid Parameters**:
- Empty or malformed account IDs
- gRPC client validates and throws error
- Function catches error, logs it, returns safe default

### Error Logging Format

All error logs follow this pattern:
```typescript
console.error("Failed to fetch [resource]:", error);
```

Examples:
- `"Failed to fetch list table fields:"`
- `"Failed to fetch account name:"`
- `"Failed to fetch account data:"`

This matches the existing logging format in both apps, ensuring consistency.

### Error Handling Examples

**getListTableFields Error Flow**:
```typescript
try {
  const listSchema = await getListSchema(listClient, rootAccountId);
  // ... transformation logic
} catch (error) {
  console.error("Failed to fetch list table fields:", error);
  return [];  // Safe default
}
```

**getAccountNameAction Error Flow**:
```typescript
try {
  const listSchema = await getListSchema(listClient, accountId);
  if (!listSchema || Array.isArray(listSchema) || !listSchema.schema?.displayName) {
    return null;  // Invalid data, not an error
  }
  return listSchema.schema.displayName;
} catch (error) {
  console.error("Failed to fetch account name:", error);
  return null;  // Safe default
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests**:
- Specific examples of successful transformations
- Edge cases (null columns, missing displayName, empty arrays)
- Error conditions (client throws error)
- Integration with mock gRPC clients

**Property-Based Tests**:
- Universal properties across all inputs
- Comprehensive input coverage through randomization
- Behavioral equivalence between old and new implementations
- Client dependency injection verification

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: grpc-utils-consolidation, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import fc from "fast-check";

describe("Feature: grpc-utils-consolidation, Property 2: List Table Fields Mapping", () => {
  it("should map ColumnInfo to DropdownOption correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(columnInfoArbitrary),
        async (columns) => {
          // Test implementation
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**List Utilities**:
- `getListSchema` with valid account ID
- `getListTableFields` with valid columns
- `getListTableFields` with null/undefined columns (edge case)
- `getListTableFields` with client error (error handling)
- `getListTableFields` mapping displayName vs name

**Account Utilities**:
- `getAccountNameAction` with valid schema
- `getAccountNameAction` with missing displayName (edge case)
- `getAccountNameAction` with invalid schema (edge case)
- `getAccountNameAction` with client error (error handling)
- `getAccountTree` with valid account ID
- `getAccountTree` with client error (error handling)
- `getAccountTreeForNavbar` with valid accounts
- `getAccountTreeForNavbar` URL encoding verification

### Property Test Coverage

Each correctness property (1-10) should have a corresponding property-based test:

1. **Property 1**: Generate random account IDs, verify getListSchema matches direct client call
2. **Property 2**: Generate random ColumnInfo arrays, verify mapping to DropdownOption
3. **Property 3**: Simulate client errors, verify empty array return
4. **Property 4**: Generate random schemas, verify displayName extraction
5. **Property 5**: Simulate client errors, verify null return
6. **Property 6**: Generate random account IDs, verify getAccountTree matches direct client call
7. **Property 7**: Simulate client errors, verify empty array return
8. **Property 8**: Generate random account arrays, verify navbar transformation
9. **Property 9**: Code inspection test - verify no client creation in shared package
10. **Property 10**: Generate random inputs, compare old vs new implementation outputs

### Integration Testing

**App-Level Tests**:
- Database app continues to function after refactoring
- Journey-builder app continues to function after refactoring
- Both apps pass existing test suites
- TypeScript compilation succeeds (`bun turbo typecheck`)
- Build succeeds (`bun turbo build`)
- Dependency check passes (`bun run check:sherif`)

### Test Execution

```bash
# Run all tests
bun turbo test:unit

# Run specific package tests
cd monorepo/packages/grpc-utils
bun test

# Run property tests with verbose output
bun test --verbose

# Type checking
bun turbo typecheck

# Dependency validation
bun run check:sherif
```

### Mock Strategy

**gRPC Client Mocks**:
- Use `vi.fn()` (Vitest) to mock client methods
- Mock successful responses with valid data
- Mock error scenarios by throwing errors
- Verify client called with correct parameters

**Example Mock**:
```typescript
const mockListClient = {
  getListSchema: vi.fn().mockResolvedValue({
    schema: {
      displayName: "Test Account",
      columns: [
        { id: "col-1", name: "email", displayName: "Email", columnType: ColumnType.TEXT }
      ]
    }
  })
};
```

### Behavioral Equivalence Testing

To verify the refactoring preserves existing behavior:

1. **Snapshot Testing**: Capture outputs from original implementations
2. **Comparison Testing**: Run same inputs through new implementations
3. **Assertion**: Outputs must be identical (deep equality)

This ensures zero regression during consolidation.
