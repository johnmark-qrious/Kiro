---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: Journey Canvas Autosave

## Overview

Incrementally build the autosave system starting with pure utilities, then server actions, hooks, UI, and finally wiring everything together. Each task builds on the previous, ensuring no orphaned code. All file paths are relative to `monorepo/apps/journey-builder/`.

## Tasks

- [x] 1. Add new Jotai atoms and types
  - [x] 1.1 Add `journeyIdAtom`, `journeyMetadataAtom`, and `saveStatusAtom` to `src/state/global-flow-atoms.ts`
    - Define `JourneyMetadata` interface with `displayName` and `status`
    - Define `SaveStatus` type as `"idle" | "saving" | "saved" | "error"`
    - Export `journeyIdAtom` (atom<string | null>, default null)
    - Export `journeyMetadataAtom` (atom<JourneyMetadata | null>, default null)
    - Export `saveStatusAtom` (atom<SaveStatus>, default "idle")
    - _Requirements: 2.4, 2.5, 4.1, 5.1, 8.2_

  - [x] 1.2 Add `SerializedEdge` type to `src/types/utils-types.ts` (or appropriate types file)
    - Define `SerializedEdge` with `id`, `source`, `target`, `sourceHandle?`, `targetHandle?`, `type?`
    - _Requirements: 1.2_

- [x] 2. Implement serialization and snapshot utilities
  - [x] 2.1 Create `src/utils/serialize-flow.ts`
    - Implement `serializeFlow(nodes, edges)` that strips `icon`, `measured`, `selected`, `dragging` from node data
    - Retain only `id`, `position`, `data`, `type` on nodes
    - Retain only `id`, `source`, `target`, `sourceHandle`, `targetHandle`, `type` on edges
    - Return a `FlowData` object with serialized nodes and edges arrays
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Write property test: Serialization strips transient properties
    - **Property 1: Serialization strips transient properties**
    - Generate random nodes with `icon`, `measured`, `selected`, `dragging` and random edges with extra props
    - Assert output nodes contain only `id`, `position`, `data`, `type` and no transient keys in `data`
    - Assert output edges contain only `id`, `source`, `target`, `sourceHandle`, `targetHandle`, `type`
    - Test file: `__tests__/unit/utils/serialize-flow.test.ts`
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 2.3 Write property test: Serialization round-trip
    - **Property 2: Serialization round-trip**
    - Generate random valid FlowData, serialize → JSON.stringify → JSON.parse → assert deep-equal to original serialized output
    - Test file: `__tests__/unit/utils/serialize-flow.test.ts`
    - **Validates: Requirements 1.4, 1.5**

  - [x] 2.4 Create `src/utils/snapshot.ts`
    - Implement `createSnapshot(flowData)` that returns `JSON.stringify(flowData)`
    - Implement `snapshotsEqual(a, b)` that returns `a === b`
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create server actions
  - [x] 4.1 Create `src/domains/journeys/actions/get-journey.ts`
    - Implement `getJourneyAction(journeyId)` as a Next.js server action (`"use server"`)
    - Call `requireSessionInfoCached()` for auth
    - Call `journeyClient.getJourney({ id: journeyId })`
    - Return `{ id, displayName, config, status }` from the response
    - _Requirements: 2.1_

  - [x] 4.3 Create `src/domains/journeys/actions/update-journey.ts`
    - Implement `updateJourneyAction(journeyId, config, displayName, status)` as a Next.js server action
    - Call `requireSessionInfoCached()` for auth
    - Call `journeyClient.updateJourney({ id, displayName, config, status })`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.5 Write property test: Full-replacement update includes all fields
    - **Property 9: Full-replacement update includes all fields**
    - Generate random FlowData + metadata combinations
    - Assert every call to `journeyClient.updateJourney` includes `id`, `displayName`, `config`, and `status` — none undefined
    - Test file: `__tests__/unit/domains/journeys/actions/update-journey.test.ts`
    - **Validates: Requirements 3.1**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement journey loader hook
  - [x] 6.1 Create `src/hooks/use-journey-loader.ts`
    - Implement `useJourneyLoader(journeyId)` hook
    - Use TanStack Query `useQuery` with `queryKey: ["journey", journeyId]` and `queryFn: () => getJourneyAction(journeyId)`
    - Set `staleTime: Infinity` and `refetchOnWindowFocus: false`
    - On data received: hydrate `nodesAtom`/`edgesAtom` with deserialized flow data (rehydrate icons via `createNodeData`)
    - On data received: cache `displayName` and `status` in `journeyMetadataAtom`
    - Set `journeyIdAtom` on mount
    - If no saved config, leave default start/end nodes (existing JourneyBuilder behavior)
    - Return query object for `isLoading`/`isError` usage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 6.2 Write unit tests for `useJourneyLoader`
    - Test: mock getJourneyAction returns saved config → atoms hydrated with deserialized nodes/edges
    - Test: mock returns null config → default start/end nodes remain
    - Test: mock returns metadata → journeyMetadataAtom populated
    - Test: mock failure → error state returned
    - Test: hydration race condition — simulate user editing canvas before loader finishes, verify autosave does NOT persist default start/end nodes over actual saved data (metadata is null until load completes, so autosave should skip)
    - Test file: `__tests__/unit/hooks/use-journey-loader.test.ts`
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

- [x] 7. Implement SaveStatusIndicator component
  - [x] 7.1 Create `src/components/save-status-indicator.tsx`
    - Read `saveStatusAtom` via `useAtomValue`
    - Render nothing when status is `"idle"`
    - Render spinner + "Saving..." when status is `"saving"`
    - Render checkmark + "Saved" when status is `"saved"`, fade after 3 seconds
    - On `"error"` status: trigger a `toast.error()` via sonner with red warning icon, "Save Failed" heading, and "Please retry" message
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 8. Implement core autosave hook
  - [x] 8.1 Create `src/hooks/use-autosave.ts`
    - Subscribe to `nodesAtom` and `edgesAtom` via `useAtomValue`
    - Read `journeyIdAtom` and `journeyMetadataAtom`
    - Write to `saveStatusAtom`
    - Implement 2-second trailing debounce on atom changes
    - On debounce expiry: serialize via `serializeFlow`, create snapshot, compare with `lastSavedSnapshotRef`
    - If snapshot differs: call `updateJourneyAction` with current FlowData + cached metadata
    - Implement single in-flight save queue: if save in progress, store pending snapshot
    - On save success: update `lastSavedSnapshotRef`, set status `"saved"`, start 3s fade timer back to `"idle"`
    - On save failure: retry with exponential backoff (1s → 2s → 4s), max 3 total attempts
    - After all retries exhausted: set status `"error"` and trigger error toast via sonner
    - Expose `retry()` function that resets retry counter and attempts save with current state
    - Expose `saveNow()` function that bypasses debounce and triggers an immediate save
    - Skip save if `journeyId` or `metadata` is null (not ready)
    - Clean up debounce timer and in-flight state on unmount
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2_

  - [x] 8.2 Write property test: Debounce coalesces rapid changes
    - **Property 4: Debounce coalesces rapid changes**
    - Simulate N rapid atom changes within 2s window
    - Assert at most one save triggered after debounce expires
    - Test file: `__tests__/unit/hooks/use-autosave.test.ts`
    - **Validates: Requirements 5.2**

  - [x] 8.3 Write property test: Single in-flight save with queuing
    - **Property 5: Single in-flight save with queuing**
    - Simulate save triggers with varying async timing
    - Assert at most one save in-flight at any time, queued changes trigger subsequent save
    - Test file: `__tests__/unit/hooks/use-autosave.test.ts`
    - **Validates: Requirements 5.6, 5.7**

  - [x] 8.4 Write property test: Last-saved snapshot updated on success
    - **Property 6: Last-saved snapshot updated on success**
    - Simulate successful save of random FlowData
    - Assert last-saved snapshot equals snapshot of saved data, subsequent same-state evaluation skips save
    - Test file: `__tests__/unit/hooks/use-autosave.test.ts`
    - **Validates: Requirements 5.8**

  - [x] 8.5 Write property test: Retry count invariant
    - **Property 7: Retry count invariant**
    - Simulate failing save operations
    - Assert exactly 3 total attempts before status set to `"error"`
    - Test file: `__tests__/unit/hooks/use-autosave.test.ts`
    - **Validates: Requirements 6.1, 6.3**

  - [x] 8.6 Write unit tests for autosave hook
    - Test exponential backoff timing (1s, 2s, 4s delays)
    - Test manual retry resets counter and attempts save again
    - Test save skipped when journeyId or metadata is null
    - Test file: `__tests__/unit/hooks/use-autosave.test.ts`
    - _Requirements: 6.2, 6.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add beforeunload guard
  - [x] 10.1 Add `beforeunload` event handling to `useAutosave`
    - Register `beforeunload` handler when current snapshot differs from last-saved snapshot
    - Remove handler when snapshots are equal
    - Remove handler on hook unmount (cleanup)
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 10.2 Write property test: beforeunload registered iff unsaved changes
    - **Property 8: beforeunload registered iff unsaved changes**
    - Generate random pairs of current/last-saved snapshots
    - Assert handler registered when snapshots differ, removed when equal
    - Test file: `__tests__/unit/hooks/use-autosave.test.ts`
    - **Validates: Requirements 7.1, 7.2**

- [x] 11. Wire autosave into canvas and update save button
  - [x] 11.1 Modify `src/components/JourneyFlow.tsx`
    - Pass `journeyId` as a prop to `JourneyBuilder`
    - _Requirements: 8.1_

  - [x] 11.2 Modify `src/components/journey-builder.tsx`
    - Accept `journeyId` prop
    - Call `useJourneyLoader(journeyId)` to load saved journey on mount
    - Call `useAutosave()` to start monitoring canvas changes, destructure `saveNow` and `retry`
    - Render `<SaveStatusIndicator />` in the canvas overlay area
    - Pass `saveNow` to `<Sidebar />` as the `onSave` prop (replaces JSON download with immediate server save)
    - Remove `saveFlow` import and JSON-download logic
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 11.3 Modify `src/components/sidebar/sidebar.tsx`
    - Keep `onSave` prop (now triggers immediate server save via `saveNow`)
    - Update Save button to show a rotating loader/spinner beside "Save" text when `saveStatusAtom` is `"saving"`
    - Read `saveStatusAtom` via `useAtomValue` to determine spinner visibility
    - _Requirements: 4.1, 4.2, 8.4_

  - [x] 11.4 Remove `saveFlow` function from `src/utils/flow-utils.ts`
    - Delete the `saveFlow()` JSON-download function
    - Keep `loadFlow()` if still used for file import
    - _Requirements: 8.5_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All file paths are relative to `monorepo/apps/journey-builder/`
- Testing uses `bun:test` + `fast-check` for property-based tests
