---
status: draft
approvedBy:
approvedDate:
---

# Design Document: SortableTable Component

## Overview

The SortableTable component is a generic, reusable React component that provides sortable tabular data display functionality. It encapsulates sort state management, sorting logic, and integration with the existing SortableHeader component, allowing developers to quickly add sortable tables to any application in the monorepo without reimplementing sorting logic.

The component uses TypeScript generics to ensure type safety across different data structures, follows functional programming principles with pure functions and immutability, and leverages React hooks with proper memoization for optimal performance.

Key design principles:
- Generic type parameter `<T>` for data type safety
- Internal state management (no parent state required)
- Pure functions for all data transformations
- Proper memoization to prevent unnecessary re-renders
- Flexible column configuration with optional render functions
- Optional actions column for row-level operations
- Zero mutations of input data

## Architecture

### Component Hierarchy

```
SortableTable<T>
├── Table (shadcn)
│   ├── TableHeader
│   │   └── TableRow
│   │       ├── TableHead (for each column)
│   │       │   ├── SortableHeader (if sortKey defined)
│   │       │   └── span (if no sortKey)
│   │       └── TableHead (Actions column, if actions prop provided)
│   └── TableBody
│       └── TableRow (for each data item)
│           ├── TableCell (for each column)
│           │   ├── render(rowData) (if render function provided)
│           │   └── rowData[field] (default display)
│           └── TableCell (Actions cell, if actions prop provided)
│               └── actions(rowData)
```

### Data Flow

1. Parent component passes `data` array and `columns` configuration to SortableTable
2. SortableTable maintains internal `sortField` and `sortDirection` state
3. User clicks sortable header → triggers `handleSort` → updates internal state
4. State change triggers useMemo recalculation of sorted data
5. Sorted data is rendered with optional render functions applied per cell
6. Optional actions column renders using actions prop function

### State Management

Internal state only (no parent state required):
- `sortField: string | null` - Currently sorted column key (null = no sort)
- `sortDirection: "asc" | "desc"` - Current sort direction

State updates occur only through the internal `handleSort` function, which is passed to SortableHeader components.

## Components and Interfaces

### Type Definitions

```typescript
// Column configuration with generic type parameter
export interface ColumnConfig<T> {
  key: string;                           // Unique identifier for the column
  label: string;                         // Display label in header
  sortKey?: keyof T;                     // Field name for sorting (optional)
  render?: (rowData: T) => React.ReactNode;  // Custom render function (optional)
}

// Props interface for SortableTable component
export interface SortableTableProps<T> {
  data: T[];                             // Array of data objects to display
  columns: ColumnConfig<T>[];            // Column configuration array
  keyExtractor: (rowData: T) => string;  // Function to extract unique key from row data
  actions?: (rowData: T) => React.ReactNode;  // Optional actions render function
  className?: string;                    // Optional CSS class for styling
}

// Internal sort state type
type SortState = {
  field: string | null;
  direction: "asc" | "desc";
};
```

### Component Signature

```typescript
export const SortableTable = <T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  actions,
  className,
}: SortableTableProps<T>) => {
  // Implementation
};
```

The generic constraint `T extends Record<string, unknown>` ensures that:
- T is an object type (not primitive)
- Properties can be accessed with bracket notation
- Type safety is maintained throughout the component

### Props Interface Details

**data: T[]**
- Array of objects to display in the table
- Each object represents one row
- Type T is inferred from the data passed by the parent
- Must not be mutated by the component

**columns: ColumnConfig<T>[]**
- Defines table structure and behavior
- Each entry specifies a column's key, label, sort behavior, and optional rendering
- `sortKey` presence determines if column is sortable
- `render` function receives full row data for maximum flexibility

**keyExtractor: (rowData: T) => string**
- Required function to extract unique identifier from each row
- Used as React key prop for list rendering (Biome compliance)
- Must return a unique string for each row
- Typically extracts an `id` field from the row data

**actions?: (rowData: T) => React.ReactNode**
- Optional function to render row-level actions
- Receives complete row data object
- Rendered in dedicated "Actions" column (last column)
- Parent component handles all action logic (delete, edit, etc.)

**className?: string**
- Optional CSS class for table styling customization
- Applied to the root Table component

## Data Models

### Journey Data Structure (Example Consumer)

```typescript
interface Journey {
  id: string;
  title: string;
  date: Date;
  // Additional fields as needed
}
```

### Column Configuration Example

```typescript
const journeyColumns: ColumnConfig<Journey>[] = [
  {
    key: "title",
    label: "Name",
    sortKey: "title",
    render: (journey) => (
      <Link href={`/journeys/${journey.id}`}>
        {journey.title}
      </Link>
    ),
  },
  {
    key: "date",
    label: "Last Update",
    sortKey: "date",
    render: (journey) => formatDateTime(journey.date),
  },
];
```

### Actions Function Example

```typescript
const journeyActions = (journey: Journey) => (
  <Button
    variant="outline"
    size="icon"
    onClick={(e) => {
      e.stopPropagation();
      handleDelete(journey.id);
    }}
  >
    <TrashIcon />
  </Button>
);
```

## Internal State Management Approach

### State Initialization

```typescript
const [sortField, setSortField] = useState<string | null>(null);
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
```

Initial state:
- `sortField` is `null` (no active sort)
- `sortDirection` is `"asc"` (default direction for first sort)

### Sort Handler Logic

```typescript
const handleSort = useCallback((field: string): void => {
  setSortField((prevField) => {
    if (prevField === field) {
      // Toggle direction if clicking the same column
      setSortDirection((prevDirection) => prevDirection === "asc" ? "desc" : "asc");
      return prevField;
    }
    // New column: set field and reset to ascending
    setSortDirection("asc");
    return field;
  });
}, []);
```

Behavior:
- First click on a column: sort ascending
- Second click on same column: sort descending
- Click on different column: sort ascending on new column
- Wrapped in `useCallback` to prevent unnecessary re-renders of child components

### State Persistence

State persists across re-renders until user changes it. No external state management or callbacks are required unless the parent component needs to observe sort state (future enhancement).


## Sorting Algorithm Implementation

### Core Sorting Function

The sorting algorithm is implemented as a pure function that creates a new sorted array without mutating the original data.

```typescript
const sortData = <T extends Record<string, unknown>>(
  data: T[],
  sortKey: keyof T | null,
  direction: "asc" | "desc"
): T[] => {
  if (!sortKey) {
    return data; // No sort applied
  }

  // Create shallow copy to avoid mutation
  const sorted = [...data];

  sorted.sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    // Handle null/undefined values - push to end
    // Note: Using == null intentionally to check both null and undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Type-specific comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      // Case-insensitive string comparison
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return direction === "asc" ? comparison : -comparison;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      // Date comparison using timestamps
      const comparison = aValue.getTime() - bValue.getTime();
      return direction === "asc" ? comparison : -comparison;
    }

    // Numeric and default comparison
    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0; // Equal values maintain original order (stable sort)
  });

  return sorted;
};
```

### Sorting Characteristics

**Type Handling:**
- Strings: Case-insensitive alphabetical using `localeCompare`
- Dates: Numeric comparison of timestamps
- Numbers: Standard numeric comparison
- Null/undefined: Always sorted to the end regardless of direction

**Stability:**
- JavaScript's Array.sort() is stable (as of ES2019)
- Equal values maintain their relative order from the original array
- Deterministic results for identical inputs

**Performance:**
- Time complexity: O(n log n) average case
- Space complexity: O(n) for the copied array
- Memoized to prevent re-sorting on unrelated re-renders

### Memoization Strategy

```typescript
const sortedData = useMemo(() => {
  return sortData(data, sortField, sortDirection);
}, [data, sortField, sortDirection]);
```

The sorted data is memoized with dependencies on:
- `data`: Re-sort when input data changes
- `sortField`: Re-sort when sort column changes
- `sortDirection`: Re-sort when direction toggles

This prevents unnecessary sorting operations when other props or parent state changes.

## Integration with SortableHeader Component

### SortableHeader Interface

The existing SortableHeader component expects:

```typescript
interface SortableHeaderProps {
  column: {
    key: string;
    label: string;
    sortable: boolean;
  };
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}
```

### Mapping ColumnConfig to SortableHeader

```typescript
// For each column in the header row:
{columns.map((column) => (
  <TableHead key={column.key}>
    <SortableHeader
      column={{
        key: String(column.sortKey ?? column.key),
        label: column.label,
        sortable: column.sortKey !== undefined,
      }}
      sortField={sortField}
      sortDirection={sortDirection}
      onSort={handleSort}
    />
  </TableHead>
))}
```

### Integration Details

**Sortable Column:**
- When `sortKey` is defined in ColumnConfig, `sortable` is set to `true`
- SortableHeader renders as a clickable button with sort icon
- Clicking triggers `handleSort` with the column's sortKey

**Non-Sortable Column:**
- When `sortKey` is undefined, `sortable` is set to `false`
- SortableHeader renders as plain text span
- No click handler attached

**State Synchronization:**
- Current `sortField` and `sortDirection` are passed to all headers
- SortableHeader highlights the active sort column
- Sort icon indicates current direction

## Render Function Patterns

### Default Rendering (No Render Function)

When no `render` function is provided, the component displays the raw field value:

```typescript
const renderCellContent = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null; // For complex objects, render function should be provided
};

<TableCell key={column.key}>
  {renderCellContent(rowData[column.sortKey ?? column.key])}
</TableCell>
```

### Custom Render Function

When a `render` function is provided, it receives the complete row data:

```typescript
<TableCell key={column.key}>
  {column.render ? column.render(rowData) : renderCellContent(rowData[column.sortKey ?? column.key])}
</TableCell>
```

### Render Function Use Cases

**1. Formatting Values**
```typescript
{
  key: "date",
  label: "Last Update",
  sortKey: "date",
  render: (row) => formatDateTime(row.date),
}
```

**2. Wrapping in Links**
```typescript
{
  key: "title",
  label: "Name",
  sortKey: "title",
  render: (row) => (
    <Link href={`/journeys/${row.id}`}>
      {row.title}
    </Link>
  ),
}
```

**3. Conditional Styling**
```typescript
{
  key: "status",
  label: "Status",
  sortKey: "status",
  render: (row) => (
    <span className={row.status === "active" ? "text-green-600" : "text-gray-400"}>
      {row.status}
    </span>
  ),
}
```

**4. Complex Cell Content**
```typescript
{
  key: "user",
  label: "User",
  sortKey: "userName",
  render: (row) => (
    <div className="flex items-center gap-2">
      <Avatar src={row.userAvatar} />
      <span>{row.userName}</span>
    </div>
  ),
}
```

### Type Safety

The render function is typed to receive the generic type T:

```typescript
render?: (rowData: T) => React.ReactNode
```

This ensures:
- TypeScript autocomplete for row properties
- Compile-time errors for invalid property access
- Type checking for the returned React node

## Actions Prop Pattern

### Actions Column Rendering

When the `actions` prop is provided, an additional column is rendered as the last column:

```typescript
// Use a Symbol to guarantee unique key that won't collide with column keys
const ACTIONS_COLUMN_KEY = Symbol("actions");

// In header row:
{actions && (
  <TableHead key={String(ACTIONS_COLUMN_KEY)}>
    <span className="font-bold text-neutral-800">Actions</span>
  </TableHead>
)}

// In each data row:
{actions && (
  <TableCell key={String(ACTIONS_COLUMN_KEY)}>
    {actions(rowData)}
  </TableCell>
)}
```

### Actions Function Signature

```typescript
actions?: (rowData: T) => React.ReactNode
```

The function:
- Receives the complete row data object
- Returns any valid React node (buttons, dropdowns, etc.)
- Is called for each row in the table

### Example Actions Implementation

```typescript
const journeyActions = (journey: Journey) => (
  <Button
    variant="outline"
    size="icon"
    className="opacity-0 group-hover:opacity-100 transition-opacity"
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteJourney(journey.id);
    }}
  >
    <TrashIcon />
  </Button>
);

// Usage:
<SortableTable
  data={journeys}
  columns={journeyColumns}
  actions={journeyActions}
/>
```

### Multiple Actions

For multiple actions per row, return a fragment or container:

```typescript
const multipleActions = (row: DataType) => (
  <div className="flex gap-2">
    <Button onClick={() => handleEdit(row.id)}>
      <PencilIcon />
    </Button>
    <Button onClick={() => handleDelete(row.id)}>
      <TrashIcon />
    </Button>
    <Button onClick={() => handleDuplicate(row.id)}>
      <CopyIcon />
    </Button>
  </div>
);
```

### Separation of Concerns

The SortableTable component:
- Renders the actions column structure
- Calls the actions function with row data
- Does NOT implement any action logic

The parent component:
- Defines the actions function
- Implements all action handlers (delete, edit, etc.)
- Manages API calls and state updates

This separation ensures the SortableTable remains generic and reusable.

## File Structure and Location

### Component Location

```
monorepo/packages/ui/src/custom/
├── sortable-table.tsx          # Main component implementation
├── sortable-header.tsx          # Existing header component (already present)
└── index.ts                     # Export barrel file (update)
```

### Export Configuration

Update `monorepo/packages/ui/src/custom/index.ts`:

```typescript
export { SortableTable } from "./sortable-table";
export type { SortableTableProps, ColumnConfig } from "./sortable-table";
export { SortableHeader } from "./sortable-header";
```

Update `monorepo/packages/ui/src/index.ts`:

```typescript
export { SortableTable, SortableHeader } from "./custom";
export type { SortableTableProps, ColumnConfig } from "./custom";
```

### Import Paths

From journey-builder or other apps:

```typescript
import { SortableTable } from "@monorepo/packages-ui/custom";
import type { ColumnConfig } from "@monorepo/packages-ui/custom";
```

Or from the main package export:

```typescript
import { SortableTable } from "@monorepo/packages-ui";
import type { ColumnConfig } from "@monorepo/packages-ui";
```

## Usage Examples

### Basic Usage (Journey Builder)

```typescript
import { SortableTable } from "@monorepo/packages-ui/custom";
import type { ColumnConfig } from "@monorepo/packages-ui/custom";
import { formatDateTime } from "@monorepo/packages-utils/date-utils";

interface Journey {
  id: string;
  title: string;
  date: Date;
}

const journeys: Journey[] = [
  { id: "1", title: "Welcome Email Campaign", date: new Date("2024-01-15T10:30:00") },
  { id: "2", title: "Onboarding Journey", date: new Date("2024-02-20T14:45:00") },
  // ... more journeys
];

const columns: ColumnConfig<Journey>[] = [
  {
    key: "title",
    label: "Name",
    sortKey: "title",
  },
  {
    key: "date",
    label: "Last Update",
    sortKey: "date",
    render: (journey) => formatDateTime(journey.date),
  },
];

export default function JourneyBuilderPage() {
  return (
    <div className="px-20 pt-10">
      <h1 className="font-semibold text-2xl">Journeys</h1>
      <SortableTable
        data={journeys}
        columns={columns}
        keyExtractor={(journey) => journey.id}
        className="mt-5 border-t border-b"
      />
    </div>
  );
}
```

### With Actions Column

```typescript
import { Button } from "@monorepo/packages-ui/shadcn";
import { TrashIcon } from "@phosphor-icons/react";

const handleDeleteJourney = (id: string) => {
  // API call to delete journey
  console.log("Deleting journey:", id);
};

const journeyActions = (journey: Journey) => (
  <Button
    variant="outline"
    size="icon"
    className="opacity-0 group-hover:opacity-100 transition-opacity"
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteJourney(journey.id);
    }}
  >
    <TrashIcon />
  </Button>
);

export default function JourneyBuilderPage() {
  return (
    <SortableTable
      data={journeys}
      columns={columns}
      keyExtractor={(journey) => journey.id}
      actions={journeyActions}
      className="mt-5 border-t border-b"
    />
  );
}
```

### With Custom Render Functions

```typescript
import Link from "next/link";

const columns: ColumnConfig<Journey>[] = [
  {
    key: "title",
    label: "Name",
    sortKey: "title",
    render: (journey) => (
      <Link
        href={`/journeys/${journey.id}`}
        className="text-ubiquity-green hover:underline"
      >
        {journey.title}
      </Link>
    ),
  },
  {
    key: "date",
    label: "Last Update",
    sortKey: "date",
    render: (journey) => (
      <span className="text-neutral-600">
        {formatDateTime(journey.date)}
      </span>
    ),
  },
];
```

### Non-Sortable Columns

```typescript
const columns: ColumnConfig<Journey>[] = [
  {
    key: "title",
    label: "Name",
    sortKey: "title", // Sortable
  },
  {
    key: "description",
    label: "Description",
    // No sortKey = non-sortable column
  },
  {
    key: "date",
    label: "Last Update",
    sortKey: "date", // Sortable
  },
];
```

### Complex Data Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  lastLogin: Date;
  isActive: boolean;
}

const userColumns: ColumnConfig<User>[] = [
  {
    key: "name",
    label: "Name",
    sortKey: "name",
  },
  {
    key: "email",
    label: "Email",
    sortKey: "email",
  },
  {
    key: "role",
    label: "Role",
    sortKey: "role",
    render: (user) => (
      <span className={user.role === "admin" ? "font-bold text-blue-600" : ""}>
        {user.role}
      </span>
    ),
  },
  {
    key: "lastLogin",
    label: "Last Login",
    sortKey: "lastLogin",
    render: (user) => formatDateTime(user.lastLogin),
  },
  {
    key: "status",
    label: "Status",
    sortKey: "isActive",
    render: (user) => (
      <span className={user.isActive ? "text-green-600" : "text-red-600"}>
        {user.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
];

const userActions = (user: User) => (
  <div className="flex gap-2">
    <Button size="sm" onClick={() => handleEditUser(user.id)}>
      Edit
    </Button>
    <Button
      size="sm"
      variant="destructive"
      onClick={() => handleDeleteUser(user.id)}
    >
      Delete
    </Button>
  </div>
);

<SortableTable
  data={users}
  columns={userColumns}
  keyExtractor={(user) => user.id}
  actions={userActions}
/>
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Component Renders with Valid Props

*For any* valid data array of type T[] and valid columns configuration array of type ColumnConfig<T>[], the SortableTable component should render without errors and display a table structure.

**Validates: Requirements 1.1, 1.2**

### Property 2: SortKey Determines Column Sortability

*For any* column configuration, if the column has a sortKey defined, then clicking the column header should trigger sorting; if the column has no sortKey, then the header should render as plain text without click handlers.

**Validates: Requirements 1.3, 1.8**

### Property 3: Render Functions Transform Cell Content

*For any* column with a render function defined, the table cell should display the output of the render function called with the row data; for any column without a render function, the table cell should display the raw field value from the data object.

**Validates: Requirements 1.4, 8.5**

### Property 4: Actions Column Renders Conditionally

*For any* SortableTable instance, if the actions prop is provided, then an "Actions" column should appear as the last column with the actions function invoked for each row; if the actions prop is not provided, then no actions column should appear.

**Validates: Requirements 1.5, 1.6, 9.8**

### Property 5: Sort State Management and Toggle Behavior

*For any* sortable column, clicking it when no sort is active should sort ascending by that column; clicking the currently sorted column should toggle between "asc" and "desc"; clicking a different sortable column should sort ascending by the new column; and the sort state should persist across re-renders until changed by user interaction.

**Validates: Requirements 2.1, 2.3, 3.2, 3.3**

### Property 6: String Fields Sort Case-Insensitively

*For any* data array where the sort field contains string values, sorting in ascending order should produce alphabetical ordering using case-insensitive comparison (e.g., "apple", "Banana", "cherry"), and sorting in descending order should produce reverse alphabetical ordering.

**Validates: Requirements 4.1**

### Property 7: Numeric Fields Sort Numerically

*For any* data array where the sort field contains numeric values, sorting in ascending order should produce increasing numeric ordering (e.g., 1, 2, 10, 20, not "1", "10", "2", "20"), and sorting in descending order should produce decreasing numeric ordering.

**Validates: Requirements 4.2**

### Property 8: Date Fields Sort Chronologically

*For any* data array where the sort field contains Date objects, sorting in ascending order should produce chronological ordering (earliest to latest), and sorting in descending order should produce reverse chronological ordering (latest to earliest).

**Validates: Requirements 4.3**

### Property 9: Sorting Uses Correct Field

*For any* column configuration with a sortKey defined, sorting by that column should reorder rows based on the values in the field specified by sortKey, not by any other field.

**Validates: Requirements 4.4**

### Property 10: Sorting Preserves Data Integrity

*For any* data array and sort configuration, the sorted result should contain exactly the same elements as the input (no duplicates, no omissions), maintain stable ordering for equal values (elements with equal sort values maintain their relative order from the original array), and produce deterministic results (sorting the same data with the same configuration multiple times produces identical results).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 11: Actions Function Invoked for All Rows

*For any* data array and actions render function, the actions function should be invoked exactly once for each row in the table, receiving the complete row data object as its parameter.

**Validates: Requirements 9.3, 9.4**

### Property 12: Input Data Immutability

*For any* data array passed to SortableTable, the original array and its elements should remain unchanged after sorting operations—the component should create new arrays for sorted data without mutating the input.

**Validates: Requirements 10.1, 10.2, 10.3**

### Example Test Cases

The following are specific examples that should be verified through unit tests:

**Example 1: Initial State**
When the SortableTable first renders, it should have no active sort (sortField is null) and display data in the original order provided.

**Validates: Requirements 2.2**

**Example 2: First Click Behavior**
When a user clicks a sortable column header for the first time, the table should sort by that column in ascending order.

**Validates: Requirements 3.1**

**Example 3: Actions Column Header**
When the actions prop is provided, the actions column header should display the text "Actions".

**Validates: Requirements 9.2**


## Error Handling

### Input Validation

The SortableTable component relies on TypeScript's type system for compile-time validation. At runtime, the component handles edge cases gracefully:

**Empty Data Array:**
```typescript
if (data.length === 0) {
  // Render empty table structure with headers
  // No error thrown
}
```

**Null/Undefined Values in Sort Fields:**
- Null and undefined values are sorted to the end of the list regardless of sort direction
- Comparison logic explicitly handles null checks before type-specific comparisons
- No errors thrown for missing or null field values

**Invalid sortKey:**
- If sortKey references a non-existent field, JavaScript returns undefined
- Undefined values are handled by null-checking logic
- Table renders with data in original order for that field

**Missing Required Props:**
- TypeScript enforces required props (data, columns) at compile time
- Runtime errors only occur if TypeScript is bypassed

### Render Function Errors

**Render Function Throws Error:**
- React's error boundary mechanism handles render errors
- Parent component should implement error boundary if needed
- SortableTable does not implement internal error boundary

**Render Function Returns Invalid Type:**
- TypeScript enforces return type of React.ReactNode
- Runtime: React handles invalid return values gracefully

### Actions Function Errors

**Actions Function Throws Error:**
- Same as render function errors
- Handled by React's error boundary mechanism
- Parent component responsible for error handling in action handlers

### Type Coercion Edge Cases

**Mixed Types in Sort Field:**
```typescript
// Example: field contains both strings and numbers
const data = [
  { id: 1, value: "text" },
  { id: 2, value: 42 },
];
```

Behavior:
- JavaScript's comparison operators handle mixed types
- String/number comparison uses JavaScript's default coercion
- Results may be unexpected but no errors thrown
- Best practice: ensure consistent types in sort fields

**Date-like Strings:**
```typescript
// Field contains date strings, not Date objects
const data = [
  { id: 1, date: "2024-01-15" },
  { id: 2, date: "2024-02-20" },
];
```

Behavior:
- Sorted as strings (lexicographic order)
- For ISO date strings, lexicographic order matches chronological order
- For other date formats, results may be incorrect
- Best practice: use Date objects for date sorting

### Performance Considerations

**Large Data Sets:**
- Array.sort() has O(n log n) complexity
- useMemo prevents re-sorting on unrelated re-renders
- For very large datasets (>10,000 rows), consider:
  - Server-side sorting
  - Virtual scrolling
  - Pagination

**Complex Render Functions:**
- Expensive render functions execute for every visible row
- Consider memoizing render function results if needed
- Parent component responsibility to optimize

**Memory Usage:**
- Sorted array is a shallow copy (references same objects)
- Memory overhead is minimal (one additional array of references)
- Original data array is not duplicated

## Testing Strategy

### Dual Testing Approach

The SortableTable component requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty data, null values, single item)
- Integration with SortableHeader component
- Actions column rendering
- Initial state verification

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Type-specific sorting correctness
- Data integrity preservation
- Immutability guarantees

### Property-Based Testing Configuration

**Library Selection:**
- **JavaScript/TypeScript**: Use `fast-check` library
- Installation: `npm install --save-dev fast-check`
- Well-maintained, TypeScript-native, excellent documentation

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with reference to design property
- Tag format: `Feature: journey-table-sorting, Property {number}: {property_text}`

**Example Property Test Structure:**
```typescript
import fc from "fast-check";

describe("SortableTable Property Tests", () => {
  it("Property 6: String fields sort case-insensitively", () => {
    // Feature: journey-table-sorting, Property 6: String fields sort case-insensitively
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string(), name: fc.string() })),
        (data) => {
          // Test implementation
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**Component Rendering:**
- Renders with valid props
- Renders empty table with no data
- Applies className prop correctly
- Renders correct number of columns

**Sort State Management:**
- Initial state has no active sort (Example 1)
- First click sorts ascending (Example 2)
- Second click on same column toggles to descending
- Click on different column resets to ascending
- Sort state persists across re-renders

**Column Configuration:**
- Sortable columns render SortableHeader
- Non-sortable columns render plain text
- Mixed sortable/non-sortable columns work together

**Render Functions:**
- Render function called with correct row data
- Render function output displayed in cell
- Default rendering shows raw field value
- Multiple columns with different render functions

**Actions Column:**
- Actions column appears when actions prop provided
- Actions column header labeled "Actions" (Example 3)
- Actions function called for each row
- No actions column when actions prop omitted

**Edge Cases:**
- Empty data array renders empty table
- Single item array renders correctly
- Null values in sort field handled gracefully
- Undefined values in sort field handled gracefully

### Property-Based Test Coverage

**Property 1: Component Renders with Valid Props**
- Generator: random arrays of objects with random column configs
- Assertion: component renders without throwing errors

**Property 2: SortKey Determines Column Sortability**
- Generator: random column configs with/without sortKey
- Assertion: sortKey presence correlates with sortable behavior

**Property 3: Render Functions Transform Cell Content**
- Generator: random data with random render functions
- Assertion: render function output appears in cells

**Property 4: Actions Column Renders Conditionally**
- Generator: random data with/without actions function
- Assertion: actions column presence matches actions prop presence

**Property 5: Sort State Management and Toggle Behavior**
- Generator: random sortable columns and click sequences
- Assertion: sort state follows toggle rules

**Property 6: String Fields Sort Case-Insensitively**
- Generator: arrays of objects with random string fields
- Assertion: sorted order matches case-insensitive alphabetical order

**Property 7: Numeric Fields Sort Numerically**
- Generator: arrays of objects with random numeric fields
- Assertion: sorted order matches numeric ordering

**Property 8: Date Fields Sort Chronologically**
- Generator: arrays of objects with random Date fields
- Assertion: sorted order matches chronological ordering

**Property 9: Sorting Uses Correct Field**
- Generator: objects with multiple fields, random sortKey selection
- Assertion: sort order based on specified sortKey field

**Property 10: Sorting Preserves Data Integrity**
- Generator: random data arrays
- Assertions:
  - Sorted array length equals original length
  - All original elements present in sorted array
  - No duplicate elements
  - Stable sort (equal values maintain order)
  - Deterministic (same input produces same output)

**Property 11: Actions Function Invoked for All Rows**
- Generator: random data arrays with mock actions function
- Assertion: actions function called exactly once per row

**Property 12: Input Data Immutability**
- Generator: random data arrays
- Assertion: original array unchanged after sorting

### Test File Structure

```
monorepo/packages/ui/__tests__/
├── unit/
│   └── sortable-table.test.tsx          # Unit tests
└── property/
    └── sortable-table.property.test.tsx  # Property-based tests
```

### Integration Testing

**Journey Builder Integration:**
- Test SortableTable with actual Journey data structure
- Verify delete button functionality in actions column
- Test with formatDateTime render function
- Verify Link components in render functions

**Connector Table Migration:**
- Verify existing ConnectorTable can be refactored to use SortableTable
- Test with ConnectorListItem data structure
- Verify all existing sorting behavior preserved

### Testing Best Practices

**Avoid Over-Testing:**
- Don't write unit tests for every possible input combination
- Property-based tests handle comprehensive input coverage
- Unit tests focus on specific examples and edge cases

**Test Behavior, Not Implementation:**
- Test rendered output, not internal state directly
- Test user interactions (clicks), not function calls
- Verify sort order by examining rendered table rows

**Mocking:**
- Mock render functions to verify they're called correctly
- Mock actions functions to verify invocation
- Use React Testing Library for DOM queries

**Accessibility:**
- Verify sortable headers have appropriate ARIA attributes
- Test keyboard navigation (if implemented)
- Verify screen reader compatibility

### Continuous Integration

**Pre-commit Hooks:**
- Run Biome linter
- Run Biome formatter
- Run type checking

**CI Pipeline:**
- Run all unit tests
- Run all property-based tests
- Run integration tests
- Check test coverage (aim for >90% for this component)
- Verify no TypeScript errors
- Verify Biome compliance

