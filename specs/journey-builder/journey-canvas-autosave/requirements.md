---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

The Journey Builder canvas currently has no server persistence — saving only downloads a JSON file locally. This feature adds autosaving so that canvas changes (nodes and edges) are automatically persisted to the backend via gRPC, and previously saved canvases are loaded when a journey is opened. The system uses a debounced change-detection approach, subscribing to Jotai atoms and diffing serialized snapshots before issuing full-replacement updates through the existing `journeyClient.updateJourney()` gRPC endpoint.

## Glossary

- **Canvas**: The React Flow workspace where users visually build journeys by placing and connecting nodes
- **Autosave_System**: The client-side subsystem responsible for detecting canvas changes, debouncing, diffing, and triggering server persistence
- **Save_Status_Indicator**: A UI component that displays the current save state (idle, saving, saved, error) to the user
- **Journey_Loader**: The subsystem responsible for fetching a saved journey from the server and hydrating the canvas on mount
- **FlowData**: The serialized representation of canvas nodes and edges, stripped of transient React Flow properties (icon, measured, selected, dragging)
- **Snapshot**: A JSON string of the current FlowData used for change detection by comparing against the last-saved version
- **Journey_Metadata**: Cached server-side journey properties (displayName, status) required for the full-replacement update pattern
- **Server_Action**: A Next.js server action that calls the gRPC backend on behalf of the client
- **Debounce_Timer**: A 2-second delay that resets on each canvas change, ensuring saves only fire after the user pauses editing
- **Save_Queue**: A mechanism ensuring only one save request is in-flight at a time, with pending changes queued for a subsequent save

## Requirements

### Requirement 1: Serialize Canvas State for Persistence

**User Story:** As a developer, I want a reusable serialization utility that produces a clean FlowData representation, so that both autosave and manual save use a consistent format free of transient React Flow properties.

#### Acceptance Criteria

1. THE Autosave_System SHALL serialize nodes by retaining only `id`, `position`, `data`, and `type`, and excluding `icon`, `measured`, `selected`, and `dragging` properties from node data
2. THE Autosave_System SHALL serialize edges by retaining only `id`, `source`, `target`, `sourceHandle`, `targetHandle`, and `type`
3. THE Autosave_System SHALL produce a FlowData object containing the serialized nodes array and serialized edges array
4. THE Autosave_System SHALL ensure the serialized output contains no `undefined` values, no class instances, no BigInt, no Date objects, no NaN, and no Infinity values
5. FOR ALL valid canvas states, serializing then JSON-stringifying then JSON-parsing SHALL produce an object structurally equivalent to the original FlowData (round-trip property)

### Requirement 2: Load Saved Journey on Mount

**User Story:** As a user, I want the canvas to load my previously saved journey when I navigate to it, so that I can continue editing where I left off.

#### Acceptance Criteria

1. WHEN a user navigates to a journey page, THE Journey_Loader SHALL fetch the journey data from the server using TanStack Query `useQuery` with the `getJourneyAction` server action
2. WHEN the server returns saved FlowData, THE Journey_Loader SHALL deserialize the nodes and edges and hydrate the `nodesAtom` and `edgesAtom` with the loaded data
3. WHEN the server returns a journey with no saved FlowData, THE Journey_Loader SHALL initialize the canvas with default start and end nodes
4. WHEN the server returns journey metadata, THE Journey_Loader SHALL cache the `displayName` and `status` in `journeyMetadataAtom` for use in subsequent save operations
5. THE Journey_Loader SHALL store the journey ID in `journeyIdAtom` when the journey page mounts
6. IF the server request to load the journey fails, THEN THE Journey_Loader SHALL display an error state to the user

### Requirement 3: Save Journey Flow to Server

**User Story:** As a developer, I want a server action that persists the full journey state to the backend, so that autosave and any future manual save can write canvas data reliably.

#### Acceptance Criteria

1. THE Server_Action SHALL send a full-replacement update containing `displayName`, `config` (FlowData), and `status` on every save call to `journeyClient.updateJourney()`
2. THE Server_Action SHALL read the current `displayName` and `status` from the cached Journey_Metadata to construct the full update payload
3. WHEN the gRPC call succeeds, THE Server_Action SHALL return a success result to the caller
4. IF the gRPC call fails, THEN THE Server_Action SHALL propagate the error to the caller with a descriptive message

### Requirement 4: Display Save Status to User

**User Story:** As a user, I want to see the current save status on the canvas and the save button, so that I know whether my changes have been persisted and can manually trigger a save.

#### Acceptance Criteria

1. THE Sidebar SHALL retain the Save button, which triggers an immediate save (bypassing debounce) using the same server action as autosave
2. WHILE the Autosave_System is persisting changes (either via autosave or manual save), THE Save button SHALL display a rotating loader/spinner beside the "Save" text
3. WHILE the Autosave_System is idle with no pending changes, THE Save_Status_Indicator SHALL display nothing
4. WHILE the Autosave_System is persisting changes, THE Save_Status_Indicator SHALL display "Saving..." with a spinner
5. WHEN the Autosave_System completes a successful save, THE Save_Status_Indicator SHALL display "Saved" with a checkmark
6. WHEN the Save_Status_Indicator displays "Saved", THE Save_Status_Indicator SHALL fade the indicator after 3 seconds
7. IF the Autosave_System fails to save after all retry attempts, THEN THE system SHALL display an error toast notification with a red warning icon, "Save Failed" heading, and "Please retry" message
8. WHEN the user clicks the Save button after a failed save, THE Autosave_System SHALL reset the retry counter and attempt to save the current canvas state again

### Requirement 5: Autosave with Debounced Change Detection

**User Story:** As a user, I want my canvas changes to be automatically saved after I stop editing, so that I do not lose work without having to manually trigger a save.

#### Acceptance Criteria

1. THE Autosave_System SHALL subscribe to `nodesAtom` and `edgesAtom` to detect canvas changes
2. WHEN a canvas change is detected, THE Autosave_System SHALL reset a 2-second Debounce_Timer before evaluating whether to save
3. WHEN the Debounce_Timer expires, THE Autosave_System SHALL serialize the current canvas state and compare the resulting Snapshot against the last-saved Snapshot
4. WHEN the current Snapshot differs from the last-saved Snapshot, THE Autosave_System SHALL invoke the save Server_Action with the current FlowData
5. WHEN the current Snapshot matches the last-saved Snapshot, THE Autosave_System SHALL skip the save operation
6. THE Autosave_System SHALL permit only one save request to be in-flight at a time
7. WHEN changes occur while a save request is in-flight, THE Autosave_System SHALL queue the changes and initiate a new save after the current request completes
8. WHEN a save request succeeds, THE Autosave_System SHALL update the last-saved Snapshot to the successfully saved value

### Requirement 6: Retry Failed Saves with Exponential Backoff

**User Story:** As a user, I want failed saves to be retried automatically, so that transient network issues do not cause data loss.

#### Acceptance Criteria

1. IF a save request fails, THEN THE Autosave_System SHALL retry the save up to 3 attempts total
2. THE Autosave_System SHALL use exponential backoff delays of 1 second, 2 seconds, and 4 seconds between retry attempts
3. IF all 3 retry attempts fail, THEN THE Autosave_System SHALL set the save status to error and stop automatic retries
4. WHEN the user triggers a manual retry after all automatic retries have failed, THE Autosave_System SHALL reset the retry counter and attempt to save again

### Requirement 7: Warn on Tab Close with Unsaved Changes

**User Story:** As a user, I want to be warned before closing the tab if I have unsaved changes, so that I do not accidentally lose my work.

#### Acceptance Criteria

1. WHILE the Autosave_System has unsaved changes (current Snapshot differs from last-saved Snapshot), THE Autosave_System SHALL register a `beforeunload` event handler that triggers a browser confirmation dialog
2. WHILE the Autosave_System has no unsaved changes, THE Autosave_System SHALL remove the `beforeunload` event handler
3. WHEN the Autosave_System unmounts, THE Autosave_System SHALL remove the `beforeunload` event handler

### Requirement 8: Integrate Autosave into Canvas and Update Save Button

**User Story:** As a developer, I want the autosave hook wired into the existing canvas component and the save button updated to trigger immediate server saves, so that users have both automatic and manual save options.

#### Acceptance Criteria

1. WHEN the JourneyBuilder component mounts with a journey ID, THE Autosave_System SHALL activate and begin monitoring canvas changes
2. THE Autosave_System SHALL update the `saveStatusAtom` so that the Save_Status_Indicator and Save button reflect the current state
3. THE Save button in the Sidebar SHALL trigger an immediate save to the server (bypassing the 2-second debounce) using the same `updateJourneyAction` server action
4. THE Save button SHALL display a rotating loader beside the "Save" text while a save is in progress
5. THE Canvas SHALL remove the `saveFlow` JSON-download function from `flow-utils.ts` as it is replaced by server persistence


### Requirement 9: High-Impact Unit Tests

**User Story:** As a developer, I want tests covering the most critical and error-prone parts of the autosave system, so that regressions in serialization, change detection, and retry logic are caught early.

#### Acceptance Criteria

1. THE test suite SHALL verify that `serializeFlow()` strips transient properties (`icon`, `measured`, `selected`, `dragging`) and produces valid FlowData with no `undefined` values
2. THE test suite SHALL verify that snapshot diffing correctly identifies meaningful changes (node added, node data edited, edge added/removed) and ignores non-meaningful changes (same state re-serialized)
3. THE test suite SHALL verify that the autosave hook debounces rapid changes and only triggers a single save after the debounce period
4. THE test suite SHALL verify that the retry logic attempts saves with exponential backoff (1s, 2s, 4s) and stops after 3 failed attempts
5. THE test suite SHALL verify that only one save is in-flight at a time and queued changes trigger a subsequent save after the current one completes
