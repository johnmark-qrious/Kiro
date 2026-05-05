---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

This feature replaces hardcoded dummy journey data in the journey-builder application with real data from the JourneyBuilder gRPC API. The implementation will enable users to list, create, and delete journeys through API integration while maintaining proper error handling and user feedback.

## Glossary

- **Journey_Builder_App**: The Next.js application that provides the user interface for managing journeys
- **Journey_Service**: The gRPC backend service that manages journey data persistence and retrieval
- **Journey**: A data entity representing a customer journey with properties including id, accountId, displayName, config, status, createdAt, and updatedAt
- **Account_ID**: A GUID identifier that associates journeys with a specific account
- **Session_Context**: The authentication and account information available from the layout context
- **Journey_Status**: An enumeration with values DRAFT, PENDING, STARTED, COMPLETED, FAILED
- **gRPC_Client**: The pre-configured client instance for communicating with the Journey_Service
- **Server_Action**: A Next.js server-side function that executes on the server and can be called from client components
- **Session_Interceptor**: A gRPC interceptor that adds authentication context to all gRPC requests
- **Toast_Notification**: A temporary UI message displayed to inform users of success or error states
- **Optimistic_Update**: A UI update pattern where the interface is updated immediately before server confirmation

## Requirements

### Requirement 1: List Journeys from API

**User Story:** As a user, I want to see my actual journeys from the database, so that I can view and manage real journey data instead of dummy data.

#### Acceptance Criteria

1. WHEN the journey-builder page loads, THE Journey_Builder_App SHALL call Journey_Service.ListJourneys with the Account_ID from Session_Context
2. WHEN Journey_Service.ListJourneys is called with an Account_ID, THE Journey_Service SHALL filter and return only journeys belonging to that account
3. WHEN Journey_Service.ListJourneys returns successfully, THE Journey_Builder_App SHALL display the journeys in the SortableTable component
4. THE SortableTable SHALL display each journey's displayName in the name column and updatedAt timestamp in the last update column
5. WHILE the API call is in progress, THE Journey_Builder_App SHALL display a loading skeleton for the table
6. IF Journey_Service.ListJourneys returns an error, THEN THE Journey_Builder_App SHALL display an error message to the user
7. WHEN Journey_Service.ListJourneys returns an empty array, THE Journey_Builder_App SHALL display an empty state message with a call-to-action to create the first journey
8. FOR ALL journeys returned by the API, parsing the response then displaying then re-fetching SHALL produce consistent journey data (round-trip property)

### Requirement 2: Create New Journey

**User Story:** As a user, I want to create a new journey through the UI, so that I can start building a customer journey.

#### Acceptance Criteria

1. WHEN the user clicks the "New Journey" button, THE Journey_Builder_App SHALL display a dialog with a form
2. THE form SHALL include a Display Name field that is required
3. WHEN the user submits the form with a valid Display Name, THE Journey_Builder_App SHALL call Journey_Service.CreateJourney with Account_ID from Session_Context and the provided displayName
4. WHEN Journey_Service.CreateJourney returns successfully, THE Journey_Builder_App SHALL display a success Toast_Notification and refresh the journey list
5. WHEN a journey is successfully created, THE newly created journey SHALL appear in the SortableTable
6. WHEN the SortableTable is updated after creation, THE new journey SHALL display with the current date and time as the last update value
7. WHEN Journey_Service.CreateJourney returns successfully, THE SortableTable SHALL be refreshed to include the new journey
8. IF Journey_Service.CreateJourney returns an error, THEN THE Journey_Builder_App SHALL display an error Toast_Notification without closing the dialog
9. THE Journey_Service SHALL create new journeys with status set to DRAFT
10. IF the user submits the form with an empty Display Name, THEN THE Journey_Builder_App SHALL display a validation error
11. IF the Display Name exceeds 100 characters, THEN THE Journey_Builder_App SHALL display a validation error
12. WHEN validating the Display Name, THE Journey_Builder_App SHALL trim whitespace before validation
13. IF the Display Name contains only whitespace, THEN THE Journey_Builder_App SHALL display a validation error
14. WHEN processing the Display Name, THE Journey_Builder_App SHALL sanitize the input to prevent XSS attacks
15. WHILE a create operation is in progress, THE "New Journey" button SHALL be disabled
16. WHILE the form is submitting, THE submit button SHALL show a loading state and be disabled

### Requirement 3: Delete Journey

**User Story:** As a user, I want to delete journeys I no longer need, so that I can keep my journey list organized.

#### Acceptance Criteria

1. WHEN the user initiates a delete action for a journey, THE Journey_Builder_App SHALL display a confirmation dialog
2. WHEN the user confirms deletion, THE Journey_Builder_App SHALL call Journey_Service.DeleteJourney with the journey id and Account_ID
3. WHEN Journey_Service.DeleteJourney returns successfully, THE Journey_Builder_App SHALL display a success Toast_Notification and refresh the journey list
4. WHEN a journey is successfully deleted, THE deleted journey SHALL be removed from the SortableTable
5. WHEN Journey_Service.DeleteJourney returns successfully, THE SortableTable SHALL be refreshed to reflect the deletion
6. IF Journey_Service.DeleteJourney returns an error, THEN THE Journey_Builder_App SHALL display an error Toast_Notification and keep the journey in the list
7. WHEN the user cancels the confirmation dialog, THE Journey_Builder_App SHALL close the dialog without calling the API
8. WHILE a delete operation is in progress, THE delete button SHALL be disabled
9. IF a delete is in progress for a journey, THEN other operations on that journey SHALL be prevented

### Requirement 4: Configure gRPC Service URL

**User Story:** As a developer, I want the application to connect to the correct gRPC service endpoint, so that API calls reach the running service.

#### Acceptance Criteria

1. THE Journey_Builder_App SHALL use localhost:50051 as the JOURNEY_BUILDER_GRPC_URL
2. THE .env file SHALL contain JOURNEY_BUILDER_GRPC_URL=localhost:50051
3. THE .env.template file SHALL contain JOURNEY_BUILDER_GRPC_URL=localhost:50051
4. WHEN the gRPC_Client is initialized, THE Journey_Builder_App SHALL use the JOURNEY_BUILDER_GRPC_URL from environment configuration

### Requirement 5: Handle API Response Data

**User Story:** As a developer, I want to properly parse and handle API responses, so that the application displays accurate journey information.

#### Acceptance Criteria

1. WHEN Journey_Service returns a Journey object, THE Journey_Builder_App SHALL extract the id, accountId, displayName, and updatedAt fields
2. WHEN displaying timestamps, THE Journey_Builder_App SHALL format the updatedAt Timestamp into a human-readable date format
3. THE Journey_Builder_App SHALL handle Journey objects with optional config fields without errors
4. FOR ALL valid Journey objects received from the API, the data SHALL maintain referential integrity with the Account_ID from Session_Context

Note: The config and status fields are not currently displayed in the UI and can be added later when needed for journey detail views.

### Requirement 6: Navigate to Journey Detail

**User Story:** As a user, I want to click on a journey title to view its details, so that I can edit and manage the journey.

#### Acceptance Criteria

1. WHEN a journey is displayed in the SortableTable, THE journey title (displayName) SHALL be rendered as a clickable link
2. WHEN the user clicks on a journey title, THE Journey_Builder_App SHALL navigate to `/journey-builder/{journey-id}` where journey-id is the journey's id (GUID)
3. THE navigation link SHALL use the journey id, NOT the account id
4. THE journey title link SHALL have appropriate visual styling to indicate it is clickable
5. THE Last Update column SHALL remain as plain text (not clickable)

### Requirement 7: Server Actions Architecture

**User Story:** As a developer, I want all gRPC calls to be made through Next.js server actions, so that session context is properly handled server-side and follows Next.js best practices.

#### Acceptance Criteria

1. THE Journey_Builder_App SHALL make all gRPC calls through Server_Action functions, not directly from client components
2. WHEN a Server_Action is invoked, THE Server_Action SHALL use requireSessionInfoCached() to retrieve the Account_ID server-side
3. THE client components SHALL call Server_Action functions to interact with Journey_Service
4. THE Server_Action functions SHALL be defined in separate action files following Next.js conventions
5. WHEN a Server_Action completes, THE Server_Action SHALL return serializable data to the client component
6. THE Server_Action functions SHALL handle gRPC client initialization and connection management

### Requirement 8: Authentication and Authorization

**User Story:** As a developer, I want all gRPC calls to include proper authentication context, so that users can only access their own journeys and the system is secure.

#### Acceptance Criteria

1. THE journeyBuilderTransport SHALL include a Session_Interceptor that adds authentication context to all gRPC requests
2. THE Session_Interceptor SHALL be configured similarly to the main transport's session interceptor
3. WHEN a Server_Action retrieves the Account_ID from session, THE Server_Action SHALL validate that the Account_ID matches the requested resources
4. IF a user attempts to access journeys for a different Account_ID, THEN THE Journey_Builder_App SHALL reject the request with an authorization error
5. THE gRPC_Client SHALL include authentication metadata in all requests via the Session_Interceptor
6. WHEN Journey_Service.DeleteJourney is called, THE Server_Action SHALL verify the journey belongs to the authenticated Account_ID before deletion

### Requirement 9: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when operations succeed or fail, so that I understand what happened and can take appropriate action.

#### Acceptance Criteria

1. WHEN an API call fails due to network issues, THE Journey_Builder_App SHALL display a Toast_Notification indicating a network error
2. WHEN an API call fails due to permission issues, THE Journey_Builder_App SHALL display a Toast_Notification indicating an authorization error
3. WHEN an API call fails due to validation issues, THE Journey_Builder_App SHALL display a Toast_Notification with the specific validation error message
4. WHEN an API call fails due to server errors, THE Journey_Builder_App SHALL display a Toast_Notification indicating a server error
5. WHEN a create or delete operation succeeds, THE Journey_Builder_App SHALL display a success Toast_Notification
6. THE Journey_Builder_App SHALL set a timeout of 30 seconds for all API calls
7. IF an API call times out, THEN THE Journey_Builder_App SHALL display a timeout error Toast_Notification
8. WHEN an API call fails due to transient network issues, THE Journey_Builder_App SHALL retry the request up to 2 times before displaying an error
9. THE Journey_Builder_App SHALL use the Toaster component from the layout for all Toast_Notification displays
10. WHEN differentiating error types, THE Journey_Builder_App SHALL inspect the gRPC status code to determine the appropriate error category

### Requirement 10: Performance and Scalability

**User Story:** As a user, I want the application to handle my journey list efficiently, so that the interface remains responsive even with many journeys.

#### Acceptance Criteria

1. WHEN Journey_Service.ListJourneys is called, THE Journey_Service SHALL return a maximum of 100 journeys per account
2. IF an account has more than 100 journeys, THE Journey_Builder_App SHALL display a message indicating the limit has been reached
3. WHEN a create operation is initiated, THE Journey_Builder_App SHALL perform an Optimistic_Update by adding the journey to the UI immediately
4. IF a create operation fails after an Optimistic_Update, THEN THE Journey_Builder_App SHALL rollback the UI change and display an error
5. WHEN a delete operation is initiated, THE Journey_Builder_App SHALL perform an Optimistic_Update by removing the journey from the UI immediately
6. IF a delete operation fails after an Optimistic_Update, THEN THE Journey_Builder_App SHALL rollback the UI change and display an error
7. WHILE the initial journey list is loading, THE Journey_Builder_App SHALL display a loading skeleton that matches the table structure
8. THE loading skeleton SHALL indicate the approximate number of rows being loaded

### Requirement 11: Accessibility

**User Story:** As a user with accessibility needs, I want the journey management interface to be fully accessible, so that I can use assistive technologies to manage my journeys.

#### Acceptance Criteria

1. WHEN an error message is displayed, THE error message SHALL be announced to screen readers using ARIA live regions
2. WHEN a loading state begins, THE loading state SHALL be announced to screen readers using ARIA live regions
3. WHEN a success Toast_Notification is displayed, THE message SHALL be announced to screen readers
4. WHEN the delete confirmation dialog is displayed, THE dialog SHALL be keyboard accessible
5. WHEN the delete confirmation dialog is open and the user presses ESC, THE Journey_Builder_App SHALL cancel the deletion
6. WHEN the delete confirmation dialog is open and the user presses Enter, THE Journey_Builder_App SHALL confirm the deletion
7. WHEN a journey title link is rendered, THE link SHALL include an ARIA label that clearly identifies the journey
8. THE journey title links SHALL have proper focus indicators for keyboard navigation
