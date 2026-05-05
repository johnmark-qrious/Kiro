---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

This feature creates a reusable SortableTable component in the monorepo UI package that provides generic sorting functionality for tabular data. The component will use the existing SortableHeader component and handle sort state management and sorting logic internally. The journey builder page will be the first consumer of this component, using it to display sortable journey records.

## Glossary

- **SortableTable**: A generic, reusable React component that renders tabular data with sortable columns
- **Column_Configuration**: An array of column definitions specifying field names, display labels, sort keys, and render functions
- **Sort_State**: Internal React state within SortableTable managing the current sort field and direction
- **Sort_Handler**: Internal function within SortableTable that processes sort requests and updates sort state
- **Data_Sorter**: Internal logic within SortableTable that reorders data rows based on sort criteria
- **SortableHeader**: Existing UI component that renders column headers with sort indicators
- **Sort_Key**: The data field name used for sorting a specific column
- **Render_Function**: Optional function in column configuration that transforms data values for display with full control over cell content
- **Actions_Prop**: Optional prop that accepts a render function for row-level actions
- **Actions_Column**: A dedicated table column that renders row-specific actions using the Actions_Prop render function
- **Row_Data**: The complete data object for a specific table row, passed to render functions

## Requirements

### Requirement 1: Component API and Props Interface

**User Story:** As a developer, I want a clear component API, so that I can easily integrate SortableTable into different pages

#### Acceptance Criteria

1. THE SortableTable SHALL accept a generic data prop containing an array of objects to display
2. THE SortableTable SHALL accept a columns prop defining the Column_Configuration array
3. WHEN a Column_Configuration entry includes a sortKey property, THE SortableTable SHALL enable sorting for that column
4. WHEN a Column_Configuration entry includes a render property, THE SortableTable SHALL use the Render_Function to transform cell values with full control over cell content
5. THE SortableTable SHALL accept an optional actions prop that accepts a render function for row-level actions
6. WHEN the actions prop is provided, THE SortableTable SHALL render an Actions_Column as the last column in the table
7. THE SortableTable SHALL accept an optional className prop for styling customization
8. FOR ALL column definitions, the component SHALL support both sortable and non-sortable columns in the same table
9. THE SortableTable SHALL use TypeScript generics to ensure type safety for data and column configuration

### Requirement 2: Internal Sort State Management

**User Story:** As a developer, I want SortableTable to manage its own state, so that I don't need to implement state management in every consuming component

#### Acceptance Criteria

1. THE SortableTable SHALL maintain internal Sort_State tracking the current sort field and direction
2. THE SortableTable SHALL initialize with no active sort (null sort field) on first render
3. THE Sort_State SHALL persist across re-renders until the user changes it
4. THE SortableTable SHALL not expose sort state to parent components unless explicitly requested via optional callback props

### Requirement 3: Sort Toggle Behavior

**User Story:** As a user, I want to click column headers to sort the table, so that I can view data in my preferred order

#### Acceptance Criteria

1. WHEN a user clicks a sortable header for the first time, THE Sort_Handler SHALL set that column as the sort field with "asc" direction
2. WHEN a user clicks the currently sorted header, THE Sort_Handler SHALL toggle the sort direction between "asc" and "desc"
3. WHEN a user clicks a different sortable header, THE Sort_Handler SHALL change the sort field to the new column and reset direction to "asc"
4. THE Sort_Handler SHALL update the internal Sort_State to reflect the new sort configuration

### Requirement 4: Generic Data Sorting

**User Story:** As a developer, I want SortableTable to sort different data types correctly, so that the component works with various data structures

#### Acceptance Criteria

1. WHEN sorting by a string field, THE Data_Sorter SHALL perform case-insensitive alphabetical comparison
2. WHEN sorting by a numeric field, THE Data_Sorter SHALL perform numeric comparison
3. WHEN sorting by a Date field, THE Data_Sorter SHALL compare using numeric timestamp values
4. THE Data_Sorter SHALL use the Sort_Key from Column_Configuration to access the correct field in each data object
5. FOR ALL data pairs (d1, d2) where d1[sortKey] < d2[sortKey] in ascending sort, d1 SHALL appear before d2 in the rendered table

### Requirement 5: SortableHeader Integration

**User Story:** As a user, I want to see which column is sorted and in which direction, so that I understand the current table order

#### Acceptance Criteria

1. THE SortableTable SHALL render SortableHeader components for columns with sortKey defined
2. THE SortableTable SHALL pass the current sort field to each SortableHeader component
3. THE SortableTable SHALL pass the current sort direction to each SortableHeader component
4. THE SortableTable SHALL pass the internal Sort_Handler function to each SortableHeader component as the onSort callback
5. THE SortableTable SHALL render standard header cells for columns without sortKey defined

### Requirement 6: Sorting Stability and Correctness

**User Story:** As a user, I want consistent sorting results, so that the table order is predictable

#### Acceptance Criteria

1. WHEN two data objects have equal values for the sorted column, THE Data_Sorter SHALL maintain their relative order from the original data
2. THE Data_Sorter SHALL produce deterministic results for the same input data and sort configuration
3. THE Data_Sorter SHALL preserve all data records without duplication or omission
4. FOR ALL sorting operations, the number of rows before sorting SHALL equal the number of rows after sorting

### Requirement 7: Component Reusability

**User Story:** As a developer, I want to use SortableTable across different apps in the monorepo, so that I have consistent sorting behavior everywhere

#### Acceptance Criteria

1. THE SortableTable SHALL be located in monorepo/packages/ui/src/custom/ for cross-app accessibility
2. THE SortableTable SHALL not depend on any app-specific code or types
3. THE SortableTable SHALL work with any data structure that can be represented as an array of objects
4. THE SortableTable SHALL support TypeScript generics for type-safe data and column configuration

### Requirement 8: Cell Customization with Render Functions

**User Story:** As a developer, I want to customize cell content with render functions, so that I can wrap values in Links, apply custom styling, or format data

#### Acceptance Criteria

1. WHEN a Column_Configuration entry includes a render property, THE SortableTable SHALL invoke the Render_Function with the Row_Data
2. THE Render_Function SHALL receive the complete row data object as its parameter
3. THE Render_Function SHALL return JSX or React elements that will be rendered in the table cell
4. THE Render_Function SHALL be properly typed using TypeScript generics to match the data type
5. WHEN no render property is provided, THE SortableTable SHALL render the raw field value from the data object
6. THE SortableTable SHALL support render functions that return any valid React node including Links, buttons, formatted text, or custom components

### Requirement 9: Row Actions Pattern

**User Story:** As a developer, I want to add row-level actions like delete buttons, so that users can perform operations on individual rows

#### Acceptance Criteria

1. WHEN the actions prop is provided, THE SortableTable SHALL render an Actions_Column as the last column
2. THE Actions_Column SHALL have a header labeled "Actions"
3. FOR ALL rows in the table, THE SortableTable SHALL invoke the actions render function with the Row_Data for that row
4. THE actions render function SHALL receive the complete row data object as its parameter
5. THE actions render function SHALL return JSX or React elements to be rendered in the Actions_Column cell
6. THE SortableTable SHALL not implement any action logic such as delete operations or API calls
7. THE actions render function SHALL be properly typed using TypeScript generics to match the data type
8. WHEN the actions prop is not provided, THE SortableTable SHALL not render an Actions_Column

### Requirement 10: Coding Standards and Type Safety

**User Story:** As a developer, I want the component to follow best practices, so that it is maintainable, type-safe, and follows functional programming principles

#### Acceptance Criteria

1. THE SortableTable SHALL use pure functions without side effects for all data transformations
2. THE SortableTable SHALL not mutate input data or props
3. THE Data_Sorter SHALL create a new sorted array without modifying the original data array
4. THE SortableTable SHALL use proper React hooks including useState for state management
5. THE SortableTable SHALL use useMemo to memoize sorted data when sort state or input data changes
6. THE SortableTable SHALL be implemented as a generic component using TypeScript generics (e.g., SortableTable<T>)
7. THE SortableTable SHALL not use the any type anywhere in its implementation
8. WHEN dynamic types are truly necessary, THE SortableTable SHALL use unknown instead of any
9. THE Render_Function type SHALL be properly typed to receive the generic data type T
10. THE actions render function type SHALL be properly typed to receive the generic data type T
11. THE Column_Configuration type SHALL use generics to ensure type safety between column definitions and data structure
12. THE SortableTable SHALL follow component composition patterns for reusability
13. WHEN rendering lists with .map(), THE SortableTable SHALL use unique identifiers (row.id or column.key) as keys, not array indices
14. THE SortableTable SHALL use arrow functions over function expressions
15. THE SortableTable SHALL use const for variables that are never reassigned
16. THE SortableTable SHALL use strict equality (===) instead of loose equality (==)
17. THE SortableTable SHALL use optional chaining (?.) where appropriate for accessing nested properties
18. THE SortableTable SHALL not contain unused imports or unused variables
19. WHEN using React hooks, THE SortableTable SHALL include all required dependencies in dependency arrays
20. THE SortableTable SHALL use self-closing tags for elements without children
21. THE SortableTable SHALL pass Biome linting without errors according to biome.json rules
22. THE SortableTable SHALL be formatted according to biome.json formatting rules

### Requirement 11: Journey Builder Delete Button Migration

**User Story:** As a developer, I want to migrate the existing delete button in journey-builder to use the actions prop pattern, so that the implementation is consistent with the new component design

#### Acceptance Criteria

1. THE journey-builder page SHALL use the actions prop to render delete buttons for journey rows
2. THE delete button render function SHALL receive the journey Row_Data as its parameter
3. THE journey-builder page SHALL handle delete logic and API calls in the parent component, not in SortableTable
4. THE delete button SHALL be rendered in the Actions_Column alongside any other row-level actions
5. THE journey-builder page SHALL maintain existing delete functionality after migration
