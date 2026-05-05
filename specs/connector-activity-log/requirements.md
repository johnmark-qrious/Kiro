---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

This feature completes the activity log functionality for the connector management interface, allowing users to view the lifecycle history of connectors. The log displays key events such as creation, activation, deactivation, and modifications, including who performed each action and when. The data is sourced from existing audit records in the legacy SQL Server database (`u3_system` via `ServiceHistory`). This feature improves auditability and transparency for organizations with multiple users managing integrations.

**Current State**: The context menu UI and activity log modal skeleton have been implemented. The backend gRPC endpoint (`GetServiceHistory`) is available. This PBI focuses on completing the data integration and display logic.

## Glossary

- **Connector**: An integration configuration that connects the Ubiquity platform to external systems
- **Activity_Log**: A chronological record of lifecycle events for a specific connector
- **Activity_Log_Modal**: A modal overlay component that displays the Activity_Log
- **Context_Menu**: A dropdown menu accessed via the meatball button on each connector row
- **ServiceHistory**: The legacy database table containing audit records of connector lifecycle events
- **Activity_Entry**: A single record in the Activity_Log representing one lifecycle event
- **ServiceHistoryCategory**: An enumeration of event types (Edit, Send, Created, Activated, Deactivated, Deleted)
- **ActivityType**: The frontend enumeration mapping to ServiceHistoryCategory
- **RemotingBridge**: The gRPC service that provides access to legacy database data
- **GetServiceHistory**: The gRPC endpoint that retrieves ServiceHistory records

## Requirements

### Requirement 1: Access Activity Log via Context Menu

**User Story:** As a connector manager, I want to access the activity log from the connector row, so that I can quickly view the history of a specific connector.

#### Acceptance Criteria

1. WHEN a user clicks the meatball button on a connector row, THE Context_Menu SHALL display an "Activity Log" option
2. WHEN a user clicks the meatball button on a connector row, THE Context_Menu SHALL continue to display existing options including "Connector Settings" and "Edit Connector" (permission-gated)
3. WHEN a user selects "Activity Log" from the Context_Menu, THE Activity_Log_Modal SHALL open
4. WHEN the Activity_Log_Modal opens, THE Connector_List_View SHALL remain visible beneath the modal overlay

### Requirement 2: Display Activity Log Modal

**User Story:** As a connector manager, I want to view activity log entries in a clear modal interface, so that I can easily read and understand the connector's history.

#### Acceptance Criteria

1. WHEN the Activity_Log_Modal is displayed, THE Activity_Log_Modal SHALL show the connector name in the modal header
2. WHEN the Activity_Log_Modal is displayed, THE Activity_Log_Modal SHALL render as an overlay on top of the Connector_List_View
3. WHEN a user clicks outside the Activity_Log_Modal, THE Activity_Log_Modal SHALL close
4. WHEN a user clicks the close button in the Activity_Log_Modal, THE Activity_Log_Modal SHALL close
5. THE Activity_Log_Modal SHALL display a loading state while fetching data from RemotingBridge
6. IF the GetServiceHistory request fails, THEN THE Activity_Log_Modal SHALL display an error message

### Requirement 3: Fetch Activity Log Data

**User Story:** As a connector manager, I want the activity log to show real historical data, so that I can audit actual events that occurred.

#### Acceptance Criteria

1. WHEN the Activity_Log_Modal opens, THE Frontend_Client SHALL call the GetServiceHistory endpoint with the connector UUID as the item_id filter
2. WHEN calling GetServiceHistory, THE Frontend_Client SHALL request entries in descending date order
3. WHEN the GetServiceHistory response is received, THE Frontend_Client SHALL map ServiceHistoryCategory values to ActivityType values
4. THE Frontend_Client SHALL upgrade @qriousnz/ubiquity-protos to version 3.3.0 in all package locations (apps/database, apps/journey-builder, packages/auth, packages/navbar)

### Requirement 4: Display Activity Entries

**User Story:** As a connector manager, I want each activity entry to show who did what and when, so that I can understand the complete context of each event.

#### Acceptance Criteria

1. FOR EACH Activity_Entry, THE Activity_Log_Modal SHALL display the user's display name who performed the action
2. FOR EACH Activity_Entry, THE Activity_Log_Modal SHALL display a formatted action description
3. FOR EACH Activity_Entry, THE Activity_Log_Modal SHALL display the date in en-NZ locale format (day numeric, month short, year numeric)
4. THE Activity_Log_Modal SHALL display Activity_Entry records in reverse chronological order (most recent first)
5. FOR EACH Activity_Entry, THE Activity_Log_Modal SHALL display an icon corresponding to the action type on the left side
6. FOR EACH Activity_Entry, THE Activity_Log_Modal SHALL display the action text and date on the right side of the icon

### Requirement 5: Format Activity Descriptions

**User Story:** As a connector manager, I want activity descriptions to follow a consistent format, so that I can quickly scan and understand events.

#### Acceptance Criteria

1. WHEN an Activity_Entry represents a creation event, THE Activity_Log_Modal SHALL format the description as "[user] created [connector name]"
2. WHEN an Activity_Entry represents an activation event, THE Activity_Log_Modal SHALL format the description as "[user] changed status to activated"
3. WHEN an Activity_Entry represents a deactivation event, THE Activity_Log_Modal SHALL format the description as "[user] changed status to deactivated"
4. WHEN an Activity_Entry represents an edit event, THE Activity_Log_Modal SHALL format the description as "[user] edited [connector name]"
5. WHEN an Activity_Entry represents a send event, THE Activity_Log_Modal SHALL format the description using the text from ServiceHistory

### Requirement 6: Display Action Type Icons

**User Story:** As a connector manager, I want different icons for different action types, so that I can visually distinguish events at a glance.

#### Acceptance Criteria

1. WHEN an Activity_Entry has ActivityType "created", THE Activity_Log_Modal SHALL display a creation icon
2. WHEN an Activity_Entry has ActivityType "activated", THE Activity_Log_Modal SHALL display an activation icon
3. WHEN an Activity_Entry has ActivityType "deactivated", THE Activity_Log_Modal SHALL display a deactivation icon
4. WHEN an Activity_Entry has ActivityType "edit", THE Activity_Log_Modal SHALL display an edit icon
5. WHEN an Activity_Entry has ActivityType "send", THE Activity_Log_Modal SHALL display a send icon

### Requirement 7: Handle Edge Cases

**User Story:** As a connector manager, I want the activity log to handle missing or incomplete data gracefully, so that I can still view available history even when some data is unavailable.

#### Acceptance Criteria

1. IF an Activity_Entry references a deleted user, THEN THE Activity_Log_Modal SHALL display a placeholder text for the user name
2. IF an Activity_Entry is missing a display name, THEN THE Activity_Log_Modal SHALL display the email address instead
3. IF an Activity_Entry is missing both display name and email address, THEN THE Activity_Log_Modal SHALL display "Unknown User"
4. IF the GetServiceHistory response contains zero entries, THEN THE Activity_Log_Modal SHALL display a message indicating no activity history is available
5. THE Activity_Log_Modal SHALL render correctly on all supported screen sizes

### Requirement 8: Pass Connector Identifier

**User Story:** As a developer, I want the connector ID to be passed correctly to the modal, so that the correct activity log is retrieved.

#### Acceptance Criteria

1. WHEN the Context_Menu renders, THE Context_Menu SHALL receive the connector UUID as a prop
2. WHEN the "Activity Log" option is selected, THE Context_Menu SHALL pass the connector UUID to the Activity_Log_Modal
3. THE Activity_Log_Modal SHALL use the connector UUID to filter ServiceHistory records via the item_id parameter

### Requirement 9: System Reliability and Data Integrity

**User Story:** As a connector manager, I want the activity log to be reliable and accurate, so that I can trust the audit trail even when issues occur.

#### Acceptance Criteria

1. WHEN the GetServiceHistory response is received, THE Activity_Log_Modal SHALL display the same number of entries as returned by the backend
2. IF the GetServiceHistory request fails, THE Activity_Log_Modal SHALL remain functional and allow the user to close it
3. WHEN a user reopens the Activity_Log_Modal after an error, THE Activity_Log_Modal SHALL retry fetching the data
4. THE Activity_Log_Modal SHALL not display duplicate entries for the same event
5. WHEN the backend returns entries with invalid or malformed data, THE Activity_Log_Modal SHALL handle them gracefully without crashing
