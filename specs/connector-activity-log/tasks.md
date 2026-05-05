---
status: draft
approvedBy:
approvedDate:
---

# Implementation Tasks

## PR 1: Proto Package Upgrade and gRPC Client Setup

**Goal**: Upgrade proto package and add RemotingBridge client infrastructure (no UI changes, safe to merge)

- [x] 1.1 Upgrade @qriousnz/ubiquity-protos to 3.3.0
  - [x] 1.1.1 Update monorepo/apps/database/package.json
  - [x] 1.1.2 Update monorepo/apps/journey-builder/package.json
  - [x] 1.1.3 Update monorepo/packages/auth/package.json
  - [x] 1.1.4 Update monorepo/packages/navbar/package.json
  - [x] 1.1.5 Run `bun install` to update lockfile
  - [x] 1.1.6 Verify existing gRPC clients still work (build passes)

- [x] 1.2 Add ServiceManagement gRPC client
  - [x] 1.2.1 Import ServiceManagementService from @qriousnz/ubiquity-protos/system/v1
  - [x] 1.2.2 Create serviceManagementClient using existing transport pattern
  - [x] 1.2.3 Export serviceManagementClient from monorepo/apps/database/src/lib/grpc-clients.ts

- [x] 1.3 Verify proto upgrade
  - [x] 1.3.1 Run build to check for type errors
  - [x] 1.3.2 Test existing gRPC functionality (account, list, transactionalList clients)
  - [x] 1.3.3 Verify no breaking changes in existing imports

## PR 2: Data Fetching and Integration

**Goal**: Wire up real data fetching with proper error handling (feature becomes functional)

- [x] 2.1 Create data fetching hook
  - [x] 2.1.1 Create useActivityLog hook in ActivityLogModal.tsx
  - [x] 2.1.2 Configure React Query with enabled: open, staleTime: 0, gcTime: 0, retry: 2
  - [x] 2.1.3 Implement exponential backoff retry delay
  - [x] 2.1.4 Set query key as ["activityLog", connectorId]

- [x] 2.2 Implement GetServiceHistory call
  - [x] 2.2.1 Create fetchServiceHistory function that calls remotingBridgeClient.getServiceHistory
  - [x] 2.2.2 Pass connectorId as itemId parameter
  - [x] 2.2.3 Request entries in descending date order
  - [x] 2.2.4 Handle gRPC errors and map to user-friendly messages

- [x] 2.3 Map backend data to frontend types
  - [x] 2.3.1 Create mapServiceHistoryToActivityLog function
  - [x] 2.3.2 Map ServiceHistoryCategory enum to ActivityType
  - [x] 2.3.3 Filter out DELETED category records client-side
  - [x] 2.3.4 Extract user display name with fallback chain (displayName → email → "Unknown User")
  - [x] 2.3.5 Map date to ISO 8601 string format

- [x] 2.4 Update ActivityLogModal to use real data
  - [x] 2.4.1 Replace MOCK_ACTIVITY_LOG with data from useActivityLog hook
  - [x] 2.4.2 Add connectorName prop to ActivityLogModalProps interface
  - [x] 2.4.3 Update modal header to display "Activity Log - {connectorName}"
  - [x] 2.4.4 Pass isLoading and error states to UI

- [x] 2.5 Update ConnectorContextMenu
  - [x] 2.5.1 Pass connectorName prop to ActivityLogModal
  - [x] 2.5.2 Ensure connector data is available when rendering modal

## PR 3: Error Handling and UI States

**Goal**: Add loading, error, and empty states for better UX (polish and reliability)

- [x] 3.1 Implement loading state
  - [x] 3.1.1 Show loading spinner or skeleton UI when isLoading === true
  - [x] 3.1.2 Ensure close button remains functional during loading
  - [x] 3.1.3 Display "Loading activity log..." message

- [x] 3.2 Implement error state
  - [x] 3.2.1 Show error message when error !== null
  - [x] 3.2.2 Display user-friendly message: "Unable to load activity log. Please try again."
  - [x] 3.2.3 Add "Try Again" button that calls refetch()
  - [x] 3.2.4 Ensure close button remains functional during error state
  - [x] 3.2.5 Verify modal reopens and retries fetch after error

- [x] 3.3 Implement empty state
  - [x] 3.3.1 Show empty state when data.length === 0
  - [x] 3.3.2 Display message: "No activity recorded yet."
  - [x] 3.3.3 Ensure empty state is visually distinct from error state

- [x] 3.4 Handle malformed data gracefully
  - [x] 3.4.1 Verify formatDate returns "Unknown date" for invalid timestamps
  - [x] 3.4.2 Verify user display name fallback works (displayName → email → "Unknown User")
  - [x] 3.4.3 Verify unknown activity types show QuestionIcon with fallback message
  - [x] 3.4.4 Add defensive checks to prevent crashes on null/undefined data

## PR 4: Testing and Validation

**Goal**: Add tests to ensure reliability and correctness

- [x] 4.1 Component tests
  - [ ] 4.1.1 Test ActivityLogModal renders loading state correctly
  - [ ] 4.1.2 Test ActivityLogModal renders error state with retry button
  - [ ] 4.1.3 Test ActivityLogModal renders empty state correctly
  - [ ] 4.1.4 Test ActivityLogModal renders activity entries correctly
  - [ ] 4.1.5 Test user display name fallback chain
  - [ ] 4.1.6 Test date formatting with valid and invalid dates
  - [ ] 4.1.7 Test activity type icon mapping
  - [ ] 4.1.8 Test modal close functionality in all states

- [ ] 4.2 Integration tests
  - [ ] 4.2.1 Test GetServiceHistory gRPC call with valid connectorId
  - [ ] 4.2.2 Test GetServiceHistory error handling
  - [ ] 4.2.3 Test ServiceHistoryCategory to ActivityType mapping
  - [ ] 4.2.4 Test DELETED category filtering
  - [ ] 4.2.5 Test retry logic on reopen

- [ ] 4.3 Manual testing
  - [ ] 4.3.1 Test with connector that has no activity history (empty state)
  - [ ] 4.3.2 Test with connector that has 100+ activity entries (scrolling)
  - [ ] 4.3.3 Test with network error (error state and retry)
  - [ ] 4.3.4 Test with deleted user in activity log (fallback display)
  - [ ] 4.3.5 Test modal on different screen sizes (responsive)
  - [ ] 4.3.6 Test close modal via outside click, ESC key, and close button
  - [ ] 4.3.7 Verify activity entries are in reverse chronological order

- [ ] 4.4 Verify requirements
  - [ ] 4.4.1 Verify Requirement 1: Context menu displays Activity Log option
  - [ ] 4.4.2 Verify Requirement 2: Modal displays correctly with all states
  - [ ] 4.4.3 Verify Requirement 3: Data fetching works with correct parameters
  - [ ] 4.4.4 Verify Requirement 4: Activity entries display correctly
  - [ ] 4.4.5 Verify Requirement 5: Activity descriptions follow correct format
  - [ ] 4.4.6 Verify Requirement 6: Icons display correctly for each activity type
  - [ ] 4.4.7 Verify Requirement 7: Edge cases handled gracefully
  - [ ] 4.4.8 Verify Requirement 8: Connector ID passed correctly
  - [ ] 4.4.9 Verify Requirement 9: System reliability (retry, error recovery, data integrity)
