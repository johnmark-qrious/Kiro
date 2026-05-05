---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: Journey List CRUD Integration

## Overview

This implementation plan breaks down the journey-list-crud-integration feature into discrete, testable coding tasks. The feature integrates the JourneyBuilder gRPC API with the journey-builder Next.js application, replacing hardcoded dummy data with real journey data and enabling full CRUD operations.

The implementation follows a 6-phase approach: infrastructure setup, server actions, UI components, page integration, testing, and polish. Each task builds incrementally on previous work, with checkpoints to ensure stability before proceeding.

## Tasks

- [x] 1. Set up infrastructure and environment configuration
  - [x] 1.1 Add session interceptor to journeyBuilderTransport in grpc-clients.ts
    - Import sessionInterceptor from the auth package
    - Add interceptor to the journeyBuilderTransport configuration
    - Ensure transport uses env.JOURNEY_BUILDER_GRPC_URL
    - _Requirements: 4.4, 8.1, 8.2, 8.5_
  
  - [x] 1.2 Update environment configuration files
    - Add JOURNEY_BUILDER_GRPC_URL=http://localhost:50051 to .env
    - Add JOURNEY_BUILDER_GRPC_URL=http://localhost:50051 to .env.template
    - Update env.ts to include JOURNEY_BUILDER_GRPC_URL validation
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 1.3 Create server actions directory structure
    - Create monorepo/apps/journey-builder/src/domains/journeys/actions/ directory
    - Create shared types file for JourneyListItem interface
    - _Requirements: 7.4_

- [ ] 2. Implement server actions for journey operations
  - [x] 2.1 Implement listJourneysAction
    - Create list-journeys.ts with "use server" directive
    - Retrieve accountId using requireSessionInfoCached()
    - Call journeyClient.listJourneys with accountId
    - Transform Journey objects to JourneyListItem (id, displayName, updatedAt)
    - Handle Timestamp conversion to Date objects
    - Add error handling for gRPC errors
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.5, 7.6, 8.3_
  
  - [ ] 2.2 Write property test for listJourneysAction
    - **Property 3: Journey Data Round-Trip Consistency**
    - **Property 15: Journey Data Field Extraction**
    - **Property 17: Account ID Referential Integrity**
    - **Validates: Requirements 1.8, 5.1, 5.4**
  
  - [x] 2.3 Implement createJourneyAction
    - Create create-journey.ts with "use server" directive
    - Define Zod schema for display name validation (trim, min 1, max 100)
    - Validate input with Zod schema
    - Retrieve accountId using requireSessionInfoCached()
    - Call journeyClient.createJourney with accountId and displayName
    - Transform response to JourneyListItem
    - Handle validation errors and gRPC errors
    - _Requirements: 2.2, 2.3, 2.10, 2.11, 2.12, 2.13, 2.14, 7.1, 7.2, 7.3, 7.5, 7.6, 8.3_
  
  - [ ]* 2.4 Write property test for createJourneyAction
    - **Property 4: Create Journey API Integration**
    - **Property 9: Display Name Whitespace Trimming**
    - **Validates: Requirements 2.3, 2.12**
  
  - [x] 2.5 Implement deleteJourneyAction
    - Create delete-journey.ts with "use server" directive
    - Retrieve accountId using requireSessionInfoCached()
    - Call journeyClient.deleteJourney with journeyId and accountId
    - Handle gRPC errors
    - _Requirements: 3.2, 7.1, 7.2, 7.3, 7.5, 7.6, 8.3, 8.6_
  
  - [ ]* 2.6 Write unit tests for server actions
    - Test listJourneysAction with mocked gRPC client
    - Test createJourneyAction validation and API calls
    - Test deleteJourneyAction authorization
    - Test error handling for various gRPC status codes
    - _Requirements: All server action requirements_

- [ ] 3. Checkpoint - Verify server actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create UI components for journey management
  - [x] 4.1 Create CreateJourneyDialog component
    - Create CreateJourneyDialog.tsx in domains/journeys/components/
    - Implement Dialog with form for display name input
    - Add Zod validation with error display
    - Add loading state during submission
    - Implement keyboard accessibility (Enter to submit, Escape to cancel)
    - Add ARIA labels and live regions for screen readers
    - _Requirements: 2.1, 2.2, 2.10, 2.11, 2.12, 2.13, 2.14, 2.16, 11.4, 11.5_
  
  - [ ]* 4.2 Write unit tests for CreateJourneyDialog
    - Test form validation (empty, too long, whitespace-only)
    - Test submission with valid input
    - Test keyboard navigation
    - Test ARIA attributes
    - _Requirements: 2.10, 2.11, 2.12, 2.13, 11.4, 11.5_
  
  - [x] 4.3 Create DeleteConfirmationDialog component
    - Create DeleteConfirmationDialog.tsx in domains/journeys/components/
    - Implement Dialog with confirmation message including journey name
    - Add loading state during deletion
    - Implement keyboard accessibility (Enter to confirm, Escape to cancel)
    - Add ARIA labels for screen readers
    - _Requirements: 3.1, 3.7, 11.4, 11.5, 11.6_
  
  - [ ]* 4.4 Write unit tests for DeleteConfirmationDialog
    - Test confirmation flow
    - Test cancellation flow
    - Test keyboard navigation
    - Test ARIA attributes
    - _Requirements: 3.1, 3.7, 11.4, 11.5, 11.6_
  
  - [x] 4.5 Create JourneyTableSkeleton component
    - Create JourneyTableSkeleton.tsx in domains/journeys/components/
    - Match SortableTable structure with skeleton rows
    - Show 5 skeleton rows by default
    - Add ARIA live region for loading announcement
    - _Requirements: 1.5, 10.7, 10.8, 11.2_
  
  - [x] 4.6 Create EmptyJourneysState component
    - Create EmptyJourneysState.tsx in domains/journeys/components/
    - Display friendly message encouraging first journey creation
    - Add call-to-action button to open create dialog
    - Use centered layout with icon
    - _Requirements: 1.7_

- [ ] 5. Integrate journey operations into main page
  - [x] 5.1 Update page.tsx to fetch and display journeys
    - Import listJourneysAction and call on page load
    - Add state for journeys list (JourneyListItem[])
    - Add loading state and display JourneyTableSkeleton while loading
    - Display EmptyJourneysState when journey list is empty
    - Render journeys in SortableTable with displayName and formatted updatedAt
    - Add error handling with toast notifications
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 9.1, 9.2, 9.3, 9.4, 9.9_
  
  - [ ]* 5.2 Write property test for journey list rendering
    - **Property 1: Journey List Rendering Completeness**
    - **Property 16: Timestamp Formatting Consistency**
    - **Validates: Requirements 1.3, 1.4, 5.2**
  
  - [x] 5.3 Implement create journey functionality
    - Add state for create dialog open/closed
    - Add "New Journey" button that opens CreateJourneyDialog
    - Implement handleCreateJourney with optimistic update
    - Add temporary journey to list immediately (temp ID)
    - Call createJourneyAction
    - On success: replace temp journey with real journey, show success toast, close dialog
    - On failure: remove temp journey (rollback), show error toast, keep dialog open
    - Disable "New Journey" button while operation in progress
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.15, 9.5, 10.3, 10.4_
  
  - [ ] 5.4 Write property tests for create journey
    - **Property 5: Success Feedback for Journey Creation**
    - **Property 6: Created Journey Appears in List**
    - **Property 7: New Journey Timestamp Accuracy**
    - **Property 8: Error Handling for Journey Creation**
    - **Property 25: Optimistic UI Updates (create)**
    - **Property 26: Optimistic Update Rollback (create)**
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.8, 10.3, 10.4**
  
  - [x] 5.5 Implement delete journey functionality
    - Add state for delete confirmation dialog (isOpen, journeyId)
    - Add delete icon/button to each journey row
    - Implement handleDeleteJourney with optimistic update
    - Remove journey from list immediately
    - Call deleteJourneyAction
    - On success: show success toast, refresh list
    - On failure: restore journey to list (rollback), show error toast
    - Disable delete button while operation in progress
    - Prevent other operations on journey being deleted
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 9.5, 10.5, 10.6_
  
  - [ ] 5.6 Write property tests for delete journey
    - **Property 10: Delete Journey API Integration**
    - **Property 11: Success Feedback for Journey Deletion**
    - **Property 12: Deleted Journey Removed from List**
    - **Property 13: Error Handling for Journey Deletion**
    - **Property 14: Concurrent Operation Prevention**
    - **Property 25: Optimistic UI Updates (delete)**
    - **Property 26: Optimistic Update Rollback (delete)**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.6, 3.9, 10.5, 10.6**
  
  - [x] 5.7 Implement navigation to journey detail page
    - Render journey displayName as clickable link in SortableTable
    - Add onClick handler to navigate to /journey-builder/{journeyId}
    - Use journey id (not accountId) in URL
    - Add visual styling to indicate clickable link
    - Add ARIA label for accessibility (e.g., "View journey: {displayName}")
    - Keep Last Update column as plain text
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.7_
  
  - [ ]* 5.8 Write property tests for navigation
    - **Property 18: Journey Title as Clickable Link**
    - **Property 19: Navigation URL Construction**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 6. Checkpoint - Verify page integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement error handling and retry logic
  - [ ] 7.1 Create error handling utilities
    - Create error-utils.ts in domains/journeys/lib/
    - Implement gRPC status code to error code mapping
    - Use identifyErrorCode from @monorepo/packages-error-handling
    - Create helper to get user-friendly error messages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.10_
  
  - [ ]* 7.2 Write property test for error categorization
    - **Property 22: Error Categorization and Messaging**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.10**
  
  - [ ] 7.3 Implement retry logic with exponential backoff
    - Create withRetry utility function
    - Retry up to 2 times for transient errors (network, timeout)
    - Use exponential backoff (1s, 2s)
    - Don't retry for validation or authorization errors
    - _Requirements: 9.8_
  
  - [ ] 7.4 Write property test for retry logic
    - **Property 24: Transient Error Retry Logic**
    - **Validates: Requirements 9.8**
  
  - [ ] 7.5 Configure timeout for gRPC calls
    - Update journeyBuilderTransport to set defaultTimeoutMs: 30000
    - Handle timeout errors with appropriate user message
    - _Requirements: 9.6, 9.7_
  
  - [ ] 7.6 Integrate error handling into all operations
    - Update listJourneysAction to use error utilities
    - Update createJourneyAction to use error utilities
    - Update deleteJourneyAction to use error utilities
    - Update page.tsx to display categorized error messages
    - Ensure all toast notifications use user-friendly messages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9_

- [ ] 8. Implement accessibility features
  - [ ] 8.1 Add ARIA live regions for state changes
    - Add ARIA live region for loading states
    - Add ARIA live region for error messages
    - Ensure toast notifications are announced to screen readers
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ]* 8.2 Write property test for screen reader announcements
    - **Property 27: Screen Reader Announcements**
    - **Validates: Requirements 11.1, 11.2, 11.3**
  
  - [ ] 8.3 Add ARIA labels to journey links
    - Add descriptive ARIA labels to journey title links
    - Format: "View journey: {displayName}"
    - Ensure proper focus indicators for keyboard navigation
    - _Requirements: 11.7, 11.8_
  
  - [ ]* 8.4 Write property test for ARIA labels
    - **Property 28: Journey Link ARIA Labels**
    - **Validates: Requirements 11.7**
  
  - [ ]* 8.5 Perform manual accessibility testing
    - Test keyboard navigation through journey list
    - Verify tab order is logical
    - Verify focus indicators are visible
    - Test screen reader announcements
    - Test dialog keyboard shortcuts (Enter, Escape)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 9. Checkpoint - Verify error handling and accessibility
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Polish and optimize
  - [ ] 10.1 Refine error messages for clarity
    - Review all error messages for user-friendliness
    - Ensure messages are actionable
    - Add context where helpful (e.g., journey name in delete errors)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 10.2 Optimize loading states and transitions
    - Ensure loading skeleton appears immediately
    - Add smooth transitions for optimistic updates
    - Verify loading indicators are visible but not distracting
    - _Requirements: 1.5, 10.7, 10.8_
  
  - [ ] 10.2.1 Add debouncing to prevent rapid-fire API calls
    - Implement debounce utility for create and delete operations
    - Set debounce delay to 300ms for button clicks
    - Ensure debounced operations don't queue up
    - Prevent multiple simultaneous API calls for the same operation
    - _Requirements: 2.15, 3.8_
  
  - [ ] 10.2.2 Implement client-side pagination for journey list
    - Add pagination state (currentPage, pageSize)
    - Set default page size to 20 journeys per page
    - Add pagination controls (Previous, Next, page numbers)
    - Calculate total pages based on journey count
    - Update table to display only current page journeys
    - Preserve pagination state during create/delete operations
    - Reset to page 1 when list is refreshed
    - Display "Showing X-Y of Z journeys" indicator
    - _Requirements: 10.1, 10.2_
  
  - [ ] 10.3 Add authorization validation
    - Verify accountId matching in server actions
    - Add authorization checks before delete operations
    - Ensure proper error messages for authorization failures
    - _Requirements: 8.3, 8.4, 8.6_
  
  - [ ]* 10.4 Write property test for authorization
    - **Property 21: Authorization Validation**
    - **Validates: Requirements 8.3, 8.6**
  
  - [ ] 10.5 Verify data serialization
    - Ensure all server action responses are JSON-serializable
    - Convert Date objects appropriately
    - Test with various data shapes
    - _Requirements: 7.5_
  
  - [ ] 10.6 Write property test for serialization
    - **Property 20: Server Action Data Serialization**
    - **Validates: Requirements 7.5**

- [ ] 11. Final checkpoint and integration testing
  - [ ]* 11.1 Run full integration test suite
    - Test complete create flow (button → dialog → form → API → list refresh)
    - Test complete delete flow (icon → confirmation → API → list refresh)
    - Test error recovery flows
    - Test navigation to journey detail page
    - _Requirements: All requirements_
  
  - [ ]* 11.2 Run all property-based tests
    - Execute all property tests with 100+ iterations
    - Verify all properties pass consistently
    - Document any edge cases discovered
    - _Requirements: All property requirements_
  
  - [ ] 11.3 Final checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation assumes the JourneyBuilder gRPC API is running on localhost:50051
- All server actions use requireSessionInfoCached() for session management
- All UI components use existing design system components from @monorepo/packages-ui
- Error handling uses utilities from @monorepo/packages-error-handling
- Date formatting uses utilities from @monorepo/packages-utils
- Debouncing prevents rapid-fire API calls from user interactions
- Client-side pagination handles the 100 journey API limit (20 per page default)
- Server-side pagination can be added later when API supports it
