---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: SortableTable Component

## Overview

This implementation plan breaks down the creation of a generic, reusable SortableTable component with TypeScript generics, internal sort state management, and integration with the existing SortableHeader component. The component will be built in the monorepo UI package and integrated into the journey-builder application.

## Tasks

- [x] 1. Set up component structure and type definitions
  - Create `monorepo/packages/ui/src/custom/sortable-table.tsx`
  - Define `ColumnConfig<T>` interface with key, label, sortKey, and render properties
  - Define `SortableTableProps<T>` interface with data, columns, keyExtractor, actions, and className
  - Define internal `SortState` type for sort field and direction
  - Export component signature with generic constraint `T extends Record<string, unknown>`
  - _Requirements: 1.1, 1.2, 1.9, 10.6, 10.7_

- [x] 2. Implement internal sort state management
  - [x] 2.1 Create state hooks for sortField and sortDirection
    - Initialize sortField as null (no active sort)
    - Initialize sortDirection as "asc"
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Implement handleSort function with useCallback
    - Toggle direction if clicking same column
    - Reset to "asc" when clicking different column
    - Update sortField state appropriately
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 10.4_

- [-] 3. Implement pure sorting function
  - [x] 3.1 Create sortData function with type-specific comparison logic
    - Handle null/undefined values (sort to end)
    - Implement case-insensitive string comparison using localeCompare
    - Implement Date comparison using getTime()
    - Implement numeric comparison
    - Return new sorted array without mutating input
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3_
  
  - [x] 3.2 Add useMemo hook for sorted data
    - Memoize sortData result with dependencies on data, sortField, sortDirection
    - _Requirements: 6.2, 10.5_
  
  - [-] 3.3 Write property test for string sorting
    - **Property 6: String fields sort case-insensitively**
    - **Validates: Requirements 4.1**
  
  - [ ] 3.4 Write property test for numeric sorting
    - **Property 7: Numeric fields sort numerically**
    - **Validates: Requirements 4.2**
  
  - [ ] 3.5 Write property test for date sorting
    - **Property 8: Date fields sort chronologically**
    - **Validates: Requirements 4.3**
  
  - [ ]* 3.6 Write property test for data integrity
    - **Property 10: Sorting preserves data integrity**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [ ]* 3.7 Write property test for immutability
    - **Property 12: Input data immutability**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ] 4. Checkpoint - Ensure sorting logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement table header rendering
  - [x] 5.1 Create TableHeader with TableRow containing column headers
    - Map over columns array to create TableHead elements
    - Use column.key as React key prop
    - Render SortableHeader for columns with sortKey defined
    - Render plain span for columns without sortKey
    - Pass sortField, sortDirection, and handleSort to SortableHeader
    - _Requirements: 1.3, 1.8, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.2 Add conditional Actions column header
    - Define ACTIONS_COLUMN_KEY as Symbol for unique key
    - Render "Actions" header when actions prop provided
    - Use String(ACTIONS_COLUMN_KEY) as React key
    - _Requirements: 1.5, 1.6, 9.2_
  
  - [ ]* 5.3 Write unit tests for header rendering
    - Test sortable vs non-sortable column headers
    - Test actions column header presence/absence
    - _Requirements: 1.3, 1.8, 9.2_

- [x] 6. Implement table body rendering with data rows
  - [x] 6.1 Create TableBody with mapped TableRow elements
    - Map over sortedData array
    - Use keyExtractor function for React key prop
    - Map over columns to create TableCell elements
    - _Requirements: 10.13_
  
  - [x] 6.2 Implement cell content rendering logic
    - Use render function if provided in column config
    - Pass complete rowData to render function
    - Display raw field value if no render function
    - Handle null/undefined values gracefully
    - _Requirements: 1.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 6.3 Add conditional Actions column cells
    - Render actions cell when actions prop provided
    - Invoke actions function with complete rowData
    - Use String(ACTIONS_COLUMN_KEY) as React key
    - _Requirements: 1.5, 9.1, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 6.4 Write property test for render functions
    - **Property 3: Render functions transform cell content**
    - **Validates: Requirements 1.4, 8.5**
  
  - [ ]* 6.5 Write property test for actions invocation
    - **Property 11: Actions function invoked for all rows**
    - **Validates: Requirements 9.3, 9.4**
  
  - [ ]* 6.6 Write unit tests for cell rendering
    - Test render function invocation with correct row data
    - Test default rendering of raw values
    - Test actions function invocation
    - _Requirements: 8.1, 8.2, 9.3_

- [ ] 7. Checkpoint - Ensure rendering tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Apply Biome compliance and coding standards
  - [x] 8.1 Ensure all Biome linting rules are satisfied
    - Use arrow functions over function expressions
    - Use const for variables never reassigned
    - Use strict equality (===) instead of loose equality (==)
    - Use optional chaining (?.) for nested properties
    - Remove unused imports and variables
    - Include all dependencies in hook dependency arrays
    - Use self-closing tags for elements without children
    - _Requirements: 10.14, 10.15, 10.16, 10.17, 10.18, 10.19, 10.20, 10.21_
  
  - [x] 8.2 Run Biome formatter on sortable-table.tsx
    - Ensure code follows biome.json formatting rules
    - _Requirements: 10.22_
  
  - [ ]* 8.3 Verify Biome compliance with getDiagnostics
    - Check for any remaining linting or formatting issues
    - _Requirements: 10.21, 10.22_

- [x] 9. Update package exports
  - [x] 9.1 Update monorepo/packages/ui/src/custom/index.ts
    - Export SortableTable component
    - Export SortableTableProps and ColumnConfig types
    - _Requirements: 7.1_
  
  - [x] 9.2 Update monorepo/packages/ui/src/index.ts
    - Re-export SortableTable from custom directory
    - Re-export SortableTableProps and ColumnConfig types
    - _Requirements: 7.1_

- [x] 10. Integrate SortableTable into journey-builder
  - [x] 10.1 Create column configuration for Journey data
    - Define ColumnConfig<Journey>[] with title and date columns
    - Add sortKey for both columns
    - Add render function for date column using formatDateTime
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [x] 10.2 Implement delete button using actions prop
    - Create journeyActions function that returns delete Button
    - Pass journey.id to delete handler
    - Use stopPropagation to prevent row click events
    - _Requirements: 1.5, 9.1, 9.3, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 10.3 Replace existing journey table with SortableTable
    - Import SortableTable from @monorepo/packages-ui/custom
    - Pass journeys data array
    - Pass columns configuration
    - Pass keyExtractor function using journey.id
    - Pass journeyActions function to actions prop
    - Apply className for styling
    - _Requirements: 7.2, 7.3, 11.5_
  
  - [ ]* 10.4 Write integration tests for journey-builder
    - Test SortableTable with Journey data structure
    - Test delete button functionality
    - Test formatDateTime render function
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- The component uses TypeScript generics for type safety across different data structures
- All sorting operations create new arrays without mutating input data
- The keyExtractor prop ensures Biome compliance for list rendering with unique keys
