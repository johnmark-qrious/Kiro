---
status: draft
approvedBy:
approvedDate:
---

# Design Document: Journey List CRUD Integration

## Overview

This design document outlines the architecture and implementation approach for integrating the JourneyBuilder gRPC API with the journey-builder Next.js application. The feature replaces hardcoded dummy data with real journey data from the backend service, enabling users to list, create, and delete journeys through a fully functional UI.

The implementation follows Next.js 14+ App Router patterns with server actions, leveraging existing infrastructure including gRPC clients, session management, error handling utilities, and UI components. The design prioritizes type safety, proper error handling, accessibility, and optimal user experience through optimistic updates.

### Key Design Goals

- Seamless integration with existing gRPC infrastructure
- Type-safe server actions following Next.js best practices
- Consistent error handling and user feedback
- Accessible UI with keyboard navigation and screen reader support
- Optimistic updates for responsive user experience
- Proper authentication and authorization through session interceptors

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  JourneyBuilderPage (Client Component)                 │ │
│  │  - Manages UI state                                    │ │
│  │  - Handles user interactions                           │ │
│  │  - Calls server actions                                │ │
│  │  - Implements optimistic updates                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ Server Action Calls              │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           │  Next.js Server                  │
│  ┌────────────────────────▼───────────────────────────────┐ │
│  │  Server Actions Layer                                  │ │
│  │  - listJourneysAction()                                │ │
│  │  - createJourneyAction(displayName)                    │ │
│  │  - deleteJourneyAction(journeyId)                      │ │
│  │  - Retrieves session context                           │ │
│  │  - Validates inputs                                    │ │
│  │  - Handles errors                                      │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│                           │ gRPC Calls                       │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  gRPC Client Layer                                     │ │
│  │  - journeyClient (JourneyService)                      │ │
│  │  - journeyBuilderTransport with sessionInterceptor     │ │
│  │  - Connection pooling                                  │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ gRPC Protocol
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              JourneyBuilder gRPC API                         │
│              (localhost:50051)                               │
│  - JourneyService.ListJourneys                              │
│  - JourneyService.CreateJourney                             │
│  - JourneyService.DeleteJourney                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### List Journeys Flow
1. User navigates to journey-builder page
2. Page component calls `listJourneysAction()` server action
3. Server action retrieves `accountId` from session context
4. Server action calls `journeyClient.listJourneys({ accountId })`
5. gRPC client adds session metadata via interceptor
6. API returns journey list
7. Server action transforms and returns serializable data
8. Client component renders journeys in SortableTable

#### Create Journey Flow
1. User clicks "New Journey" button
2. Dialog opens with form
3. User enters display name and submits
4. Client performs optimistic update (adds journey to UI)
5. Client calls `createJourneyAction(displayName)`
6. Server action validates input and retrieves session
7. Server action calls `journeyClient.createJourney({ accountId, displayName })`
8. On success: toast notification, refresh list
9. On failure: rollback optimistic update, show error toast

#### Delete Journey Flow
1. User clicks delete icon on journey row
2. Confirmation dialog appears
3. User confirms deletion
4. Client performs optimistic update (removes journey from UI)
5. Client calls `deleteJourneyAction(journeyId)`
6. Server action validates ownership and calls API
7. On success: toast notification
8. On failure: rollback optimistic update, show error toast

## Components and Interfaces

### Server Actions

#### Location
`monorepo/apps/journey-builder/src/domains/journeys/actions/`

#### listJourneysAction

```typescript
"use server";

import { requireSessionInfoCached } from "@monorepo/packages-auth/server";
import { journeyClient } from "@/lib/grpc-clients";

export interface JourneyListItem {
  id: string;
  displayName: string;
  updatedAt: Date;
}

export async function listJourneysAction(): Promise<JourneyListItem[]> {
  const sessionInfo = await requireSessionInfoCached();
  
  const response = await journeyClient.listJourneys({
    accountId: sessionInfo.accountId,
  });
  
  return response.journeys.map(journey => ({
    id: journey.id,
    displayName: journey.displayName,
    updatedAt: journey.updatedAt ? new Date(journey.updatedAt.seconds * 1000) : new Date(),
  }));
}
```

#### createJourneyAction

```typescript
"use server";

import { requireSessionInfoCached } from "@monorepo/packages-auth/server";
import { journeyClient } from "@/lib/grpc-clients";
import { z } from "zod";

const createJourneySchema = z.object({
  displayName: z.string()
    .trim()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or less"),
});

export async function createJourneyAction(displayName: string): Promise<JourneyListItem> {
  // Validate input
  const validated = createJourneySchema.parse({ displayName });
  
  const sessionInfo = await requireSessionInfoCached();
  
  const response = await journeyClient.createJourney({
    accountId: sessionInfo.accountId,
    displayName: validated.displayName,
  });
  
  return {
    id: response.journey.id,
    displayName: response.journey.displayName,
    updatedAt: response.journey.updatedAt ? new Date(response.journey.updatedAt.seconds * 1000) : new Date(),
  };
}
```

#### deleteJourneyAction

```typescript
"use server";

import { requireSessionInfoCached } from "@monorepo/packages-auth/server";
import { journeyClient } from "@/lib/grpc-clients";

export async function deleteJourneyAction(journeyId: string): Promise<void> {
  const sessionInfo = await requireSessionInfoCached();
  
  await journeyClient.deleteJourney({
    id: journeyId,
    accountId: sessionInfo.accountId,
  });
}
```

### Client Components

#### JourneyBuilderPage

Main page component that orchestrates the journey list UI.

**Location:** `monorepo/apps/journey-builder/src/app/page.tsx`

**State Management:**
- `journeys: JourneyListItem[]` - Current list of journeys
- `isLoading: boolean` - Loading state for initial fetch
- `isCreateDialogOpen: boolean` - Create dialog visibility
- `deleteConfirmation: { isOpen: boolean; journeyId: string | null }` - Delete dialog state

**Key Methods:**
- `loadJourneys()` - Fetches journeys from server action
- `handleCreateJourney(displayName: string)` - Creates new journey with optimistic update
- `handleDeleteJourney(journeyId: string)` - Deletes journey with optimistic update
- `handleRowClick(journeyId: string)` - Navigates to journey detail page

#### CreateJourneyDialog

Dialog component for creating new journeys.

**Location:** `monorepo/apps/journey-builder/src/domains/journeys/components/CreateJourneyDialog.tsx`

**Props:**
```typescript
interface CreateJourneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (displayName: string) => Promise<void>;
}
```

**Features:**
- Form validation with Zod schema
- Loading state during submission
- Error display for validation failures
- Keyboard accessibility (Enter to submit, Escape to cancel)

#### DeleteConfirmationDialog

Dialog component for confirming journey deletion.

**Location:** `monorepo/apps/journey-builder/src/domains/journeys/components/DeleteConfirmationDialog.tsx`

**Props:**
```typescript
interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  journeyName: string;
}
```

**Features:**
- Clear confirmation message with journey name
- Loading state during deletion
- Keyboard accessibility

#### JourneyTableSkeleton

Loading skeleton component for the journey table.

**Location:** `monorepo/apps/journey-builder/src/domains/journeys/components/JourneyTableSkeleton.tsx`

**Features:**
- Matches SortableTable structure
- Shows 5 skeleton rows by default
- Accessible loading announcement

#### EmptyJourneysState

Empty state component when no journeys exist.

**Location:** `monorepo/apps/journey-builder/src/domains/journeys/components/EmptyJourneysState.tsx`

**Features:**
- Friendly message encouraging first journey creation
- Call-to-action button to open create dialog
- Centered layout with icon

### Updated Infrastructure

#### gRPC Client Configuration

**File:** `monorepo/apps/journey-builder/src/lib/grpc-clients.ts`

**Changes:**
- Add `sessionInterceptor` to `journeyBuilderTransport`
- Ensure proper connection pooling

```typescript
const journeyBuilderTransport = createGrpcTransport({
  baseUrl: env.JOURNEY_BUILDER_GRPC_URL,
  interceptors: [sessionInterceptor],
});
```

#### Environment Configuration

**Files:**
- `.env`
- `.env.template`

**Addition:**
```
JOURNEY_BUILDER_GRPC_URL=http://localhost:50051
```

## Data Models

### Journey (gRPC Response)

```typescript
interface Journey {
  id: string;                          // GUID
  accountId: string;                   // GUID
  displayName: string;                 // Journey name
  config?: Struct;                     // Optional JSON config
  status: JourneyStatus;               // DRAFT, PENDING, STARTED, COMPLETED, FAILED
  createdAt: Timestamp;                // Creation timestamp
  updatedAt: Timestamp;                // Last update timestamp
}
```

### JourneyListItem (Client Model)

```typescript
interface JourneyListItem {
  id: string;                          // GUID for navigation and operations
  displayName: string;                 // Display in table
  updatedAt: Date;                     // Formatted for display
}
```

**Rationale:** The client model is simplified to include only fields needed for the list view. Additional fields (config, status, nodes, connections) will be added when implementing the journey detail page.

### Error Response Types

```typescript
interface ActionError {
  code: ErrorCode;
  message: string;
  userMessage: string;
}

type ErrorCode = 
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "UNKNOWN_ERROR";
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

**Redundant Properties:**
- 2.5 and 2.7: Both test that a created journey appears in the table after creation
- 3.4 and 3.5: Both test that a deleted journey is removed from the table after deletion
- 6.2 and 6.3: Both test navigation URL construction - 6.3 is subsumed by 6.2 if we verify the URL format

**Properties to Combine:**
- 9.1, 9.2, 9.3, 9.4: These can be combined into one property about error categorization and appropriate messaging
- 10.3 and 10.5: Both test optimistic updates - can be combined into one property about immediate UI updates
- 10.4 and 10.6: Both test rollback behavior - can be combined into one property about rollback on failure
- 11.1, 11.2, 11.3: All test ARIA announcements - can be combined into one property about screen reader announcements

**Final Property Set:**
After removing redundancies and combining related properties, we have the following unique, testable properties:

1. Journey list rendering (1.3, 1.4)
2. Error handling for list operations (1.6)
3. Data round-trip consistency (1.8)
4. Create API integration (2.3)
5. Success feedback for create (2.4)
6. Journey appears after creation (2.5)
7. Timestamp handling for new journeys (2.6)
8. Error handling for create (2.8)
9. Input trimming (2.12)
10. Delete API integration (3.2)
11. Success feedback for delete (3.3)
12. Journey removed after deletion (3.4)
13. Error handling for delete (3.6)
14. Concurrent operation prevention (3.9)
15. Data field extraction (5.1)
16. Timestamp formatting (5.2)
17. Account ID integrity (5.4)
18. Journey title as clickable link (6.1)
19. Navigation URL construction (6.2)
20. Server action serialization (7.5)
21. Authorization validation (8.3, 8.6)
22. Error categorization and messaging (9.1-9.4 combined)
23. Success notifications (9.5)
24. Retry logic (9.8)
25. Error code mapping (9.10)
26. Optimistic updates (10.3, 10.5 combined)
27. Rollback on failure (10.4, 10.6 combined)
28. Screen reader announcements (11.1-11.3 combined)
29. ARIA labels for links (11.7)

### Property 1: Journey List Rendering Completeness

*For any* list of journeys returned by the API, all journeys should be rendered in the SortableTable with their displayName and formatted updatedAt timestamp visible.

**Validates: Requirements 1.3, 1.4**

### Property 2: Error Display on List Failure

*For any* error returned by the listJourneys API call, an error message should be displayed to the user via toast notification.

**Validates: Requirements 1.6**

### Property 3: Journey Data Round-Trip Consistency

*For any* journey data received from the API, transforming it for display and then re-fetching should produce equivalent journey information (id, displayName, updatedAt).

**Validates: Requirements 1.8**

### Property 4: Create Journey API Integration

*For any* valid display name (non-empty, trimmed, ≤100 chars), submitting the create form should call the createJourney API with the correct accountId and displayName.

**Validates: Requirements 2.3**

### Property 5: Success Feedback for Journey Creation

*For any* successful journey creation, a success toast notification should be displayed and the journey list should be refreshed.

**Validates: Requirements 2.4**

### Property 6: Created Journey Appears in List

*For any* successfully created journey, the journey should appear in the SortableTable with the correct displayName.

**Validates: Requirements 2.5, 2.7**

### Property 7: New Journey Timestamp Accuracy

*For any* newly created journey, the updatedAt timestamp should reflect the current date and time (within a reasonable tolerance of a few seconds).

**Validates: Requirements 2.6**

### Property 8: Error Handling for Journey Creation

*For any* error returned by the createJourney API call, an error toast notification should be displayed and the create dialog should remain open.

**Validates: Requirements 2.8**

### Property 9: Display Name Whitespace Trimming

*For any* display name input with leading or trailing whitespace, the whitespace should be trimmed before validation and submission.

**Validates: Requirements 2.12**

### Property 10: Delete Journey API Integration

*For any* journey deletion confirmation, the deleteJourney API should be called with the correct journeyId and accountId.

**Validates: Requirements 3.2**

### Property 11: Success Feedback for Journey Deletion

*For any* successful journey deletion, a success toast notification should be displayed and the journey list should be refreshed.

**Validates: Requirements 3.3**

### Property 12: Deleted Journey Removed from List

*For any* successfully deleted journey, the journey should no longer appear in the SortableTable.

**Validates: Requirements 3.4, 3.5**

### Property 13: Error Handling for Journey Deletion

*For any* error returned by the deleteJourney API call, an error toast notification should be displayed and the journey should remain in the list (rollback optimistic update).

**Validates: Requirements 3.6**

### Property 14: Concurrent Operation Prevention

*For any* journey with a delete operation in progress, other operations (edit, delete) on that journey should be disabled or prevented.

**Validates: Requirements 3.9**

### Property 15: Journey Data Field Extraction

*For any* Journey object returned by the API, the transformation should correctly extract id, displayName, and updatedAt fields into the JourneyListItem model.

**Validates: Requirements 5.1**

### Property 16: Timestamp Formatting Consistency

*For any* updatedAt timestamp from the API, it should be formatted into a human-readable date string using the formatDateTime utility.

**Validates: Requirements 5.2**

### Property 17: Account ID Referential Integrity

*For any* journey displayed in the UI, the journey's accountId should match the accountId from the current session context.

**Validates: Requirements 5.4**

### Property 18: Journey Title as Clickable Link

*For any* journey rendered in the SortableTable, the displayName should be rendered as a clickable link element.

**Validates: Requirements 6.1**

### Property 19: Navigation URL Construction

*For any* journey link clicked, the navigation should go to `/journey-builder/{journeyId}` where journeyId is the journey's id (not accountId).

**Validates: Requirements 6.2, 6.3**

### Property 20: Server Action Data Serialization

*For any* server action response (list, create, delete), the returned data should be JSON-serializable (no functions, no circular references, dates as strings or Date objects).

**Validates: Requirements 7.5**

### Property 21: Authorization Validation

*For any* server action invocation (list, create, delete), the accountId from the session should be used to ensure users can only access their own journeys.

**Validates: Requirements 8.3, 8.6**

### Property 22: Error Categorization and Messaging

*For any* gRPC error (network, permission, validation, server), the error should be categorized by inspecting the gRPC status code and an appropriate user-friendly toast message should be displayed.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.10**

### Property 23: Success Notification Display

*For any* successful create or delete operation, a success toast notification should be displayed to the user.

**Validates: Requirements 9.5**

### Property 24: Transient Error Retry Logic

*For any* API call that fails with a transient network error, the request should be retried up to 2 times before displaying an error to the user.

**Validates: Requirements 9.8**

### Property 25: Optimistic UI Updates

*For any* create or delete operation initiated by the user, the UI should update immediately (add/remove journey from list) before the API call completes.

**Validates: Requirements 10.3, 10.5**

### Property 26: Optimistic Update Rollback

*For any* create or delete operation that fails after an optimistic UI update, the UI should rollback to the previous state and display an error message.

**Validates: Requirements 10.4, 10.6**

### Property 27: Screen Reader Announcements

*For any* state change (error, loading, success), the change should be announced to screen readers using ARIA live regions or toast notifications with proper accessibility attributes.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 28: Journey Link ARIA Labels

*For any* journey title link rendered in the table, the link should include an ARIA label that clearly identifies the journey (e.g., "View journey: {displayName}").

**Validates: Requirements 11.7**

## Error Handling

### Error Classification

The application uses the existing error handling utilities from `@monorepo/packages-error-handling` to classify and handle errors:

```typescript
import { identifyErrorCode, ErrorMessages } from "@monorepo/packages-error-handling";

function handleApiError(error: unknown): void {
  const errorCode = identifyErrorCode(error);
  const userMessage = ErrorMessages[errorCode];
  
  toast.error(userMessage);
}
```

### gRPC Error Mapping

gRPC status codes are mapped to application error codes:

| gRPC Status Code | Error Code | User Message |
|-----------------|------------|--------------|
| `INVALID_ARGUMENT` | `VALIDATION_ERROR` | "Please check your input and try again" |
| `NOT_FOUND` | `NOT_FOUND` | "The requested journey was not found" |
| `PERMISSION_DENIED` | `UNAUTHORIZED` | "You don't have permission to perform this action" |
| `UNAVAILABLE` | `NETWORK_ERROR` | "Network error. Please check your connection" |
| `DEADLINE_EXCEEDED` | `TIMEOUT_ERROR` | "Request timed out. Please try again" |
| `INTERNAL` | `UNKNOWN_ERROR` | "Something went wrong. Please try again" |

### Error Handling Patterns

#### Server Action Error Handling

```typescript
export async function createJourneyAction(displayName: string): Promise<JourneyListItem> {
  try {
    // Validation
    const validated = createJourneySchema.parse({ displayName });
    
    // Session retrieval
    const sessionInfo = await requireSessionInfoCached();
    
    // API call
    const response = await journeyClient.createJourney({
      accountId: sessionInfo.accountId,
      displayName: validated.displayName,
    });
    
    return transformJourneyToListItem(response.journey);
  } catch (error) {
    // Let the error propagate to the client for handling
    throw error;
  }
}
```

#### Client Error Handling

```typescript
async function handleCreateJourney(displayName: string) {
  // Optimistic update
  const tempId = `temp-${Date.now()}`;
  const optimisticJourney = {
    id: tempId,
    displayName,
    updatedAt: new Date(),
  };
  
  setJourneys(prev => [...prev, optimisticJourney]);
  
  try {
    const newJourney = await createJourneyAction(displayName);
    
    // Replace optimistic journey with real one
    setJourneys(prev => 
      prev.map(j => j.id === tempId ? newJourney : j)
    );
    
    toast.success("Journey created successfully");
    setIsCreateDialogOpen(false);
  } catch (error) {
    // Rollback optimistic update
    setJourneys(prev => prev.filter(j => j.id !== tempId));
    
    // Show error
    const errorCode = identifyErrorCode(error);
    const userMessage = ErrorMessages[errorCode];
    toast.error(userMessage);
  }
}
```

### Retry Logic

For transient network errors, implement retry logic with exponential backoff:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const errorCode = identifyErrorCode(error);
      const isTransient = errorCode === ErrorCodes.NETWORK_ERROR || 
                         errorCode === ErrorCodes.TIMEOUT_ERROR;
      
      if (!isTransient || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  
  throw lastError;
}
```

### Timeout Configuration

All gRPC calls should have a 30-second timeout configured at the transport level:

```typescript
const journeyBuilderTransport = createGrpcTransport({
  baseUrl: env.JOURNEY_BUILDER_GRPC_URL,
  interceptors: [sessionInterceptor],
  defaultTimeoutMs: 30000,
});
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples and edge cases
- UI component rendering and interactions
- Integration between components
- Error conditions and boundary cases

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Data transformation correctness
- API integration contracts
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library:** Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `// Feature: journey-list-crud-integration, Property {number}: {property_text}`

**Example Property Test:**

```typescript
import fc from "fast-check";
import { describe, it, expect } from "bun:test";

describe("Journey List CRUD Integration", () => {
  it("Property 9: Display Name Whitespace Trimming", () => {
    // Feature: journey-list-crud-integration, Property 9: Display Name Whitespace Trimming
    
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 10 }).filter(s => /^\s*$/.test(s)),
        (validName, whitespace) => {
          const inputWithWhitespace = whitespace + validName + whitespace;
          const trimmed = inputWithWhitespace.trim();
          
          expect(trimmed).toBe(validName);
          expect(trimmed.length).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**Server Actions:**
- Test successful API calls with mocked gRPC client
- Test error handling for various gRPC status codes
- Test input validation (empty, too long, whitespace-only)
- Test session context retrieval
- Test data transformation

**Client Components:**
- Test journey list rendering with various data sets
- Test empty state display
- Test loading skeleton display
- Test create dialog open/close
- Test delete confirmation dialog
- Test optimistic updates and rollbacks
- Test toast notifications
- Test keyboard navigation
- Test ARIA attributes and screen reader support

**Integration Tests:**
- Test complete create flow (button click → dialog → form submit → API call → list refresh)
- Test complete delete flow (delete icon → confirmation → API call → list refresh)
- Test error recovery flows
- Test navigation to journey detail page

### Test File Organization

```
monorepo/apps/journey-builder/
├── __tests__/
│   ├── unit/
│   │   ├── domains/
│   │   │   └── journeys/
│   │   │       ├── actions/
│   │   │       │   ├── list-journeys.test.ts
│   │   │       │   ├── create-journey.test.ts
│   │   │       │   └── delete-journey.test.ts
│   │   │       └── components/
│   │   │           ├── CreateJourneyDialog.test.tsx
│   │   │           ├── DeleteConfirmationDialog.test.tsx
│   │   │           ├── JourneyTableSkeleton.test.tsx
│   │   │           └── EmptyJourneysState.test.tsx
│   │   └── app/
│   │       └── page.test.tsx
│   └── property/
│       └── journey-crud-properties.test.ts
```

### Accessibility Testing

**Manual Testing Checklist:**
- [ ] Keyboard navigation through journey list
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Screen reader announces loading states
- [ ] Screen reader announces errors
- [ ] Screen reader announces success messages
- [ ] Dialog can be closed with Escape key
- [ ] Dialog can be confirmed with Enter key
- [ ] Journey links have descriptive ARIA labels
- [ ] All interactive elements are keyboard accessible

**Automated Accessibility Tests:**
- Use `@testing-library/jest-dom` for ARIA attribute assertions
- Use `axe-core` for automated accessibility scanning
- Test focus management in dialogs
- Test ARIA live region updates

### Performance Testing

**Metrics to Monitor:**
- Initial page load time
- Time to first journey render
- Create operation response time
- Delete operation response time
- Optimistic update responsiveness

**Performance Targets:**
- Initial load: < 2 seconds
- Optimistic update: < 100ms
- API call completion: < 1 second (typical)
- List refresh after operation: < 500ms

## Implementation Notes

### Phase 1: Infrastructure Setup
1. Add session interceptor to journeyBuilderTransport
2. Update environment configuration files
3. Create server action directory structure

### Phase 2: Server Actions
1. Implement listJourneysAction with error handling
2. Implement createJourneyAction with validation
3. Implement deleteJourneyAction with authorization

### Phase 3: UI Components
1. Create CreateJourneyDialog with form validation
2. Create DeleteConfirmationDialog
3. Create JourneyTableSkeleton
4. Create EmptyJourneysState

### Phase 4: Page Integration
1. Update JourneyBuilderPage to use server actions
2. Implement optimistic updates
3. Add error handling and toast notifications
4. Add loading states
5. Implement navigation to journey detail

### Phase 5: Testing
1. Write unit tests for server actions
2. Write unit tests for UI components
3. Write property-based tests
4. Perform accessibility testing
5. Perform integration testing

### Phase 6: Polish
1. Add loading skeletons
2. Refine error messages
3. Optimize performance
4. Add analytics/logging
5. Documentation

## Dependencies

### External Libraries
- `@connectrpc/connect` - gRPC client
- `@connectrpc/connect-node` - Node.js gRPC transport
- `@qriousnz/journey-service-grpc-sdk` - Generated gRPC types
- `zod` - Schema validation
- `sonner` - Toast notifications
- `fast-check` - Property-based testing

### Internal Packages
- `@monorepo/packages-auth` - Session management
- `@monorepo/packages-error-handling` - Error utilities
- `@monorepo/packages-ui` - UI components
- `@monorepo/packages-utils` - Date formatting utilities

### Environment Requirements
- JourneyBuilder gRPC API running on localhost:50051
- PostgreSQL database (via docker-compose)
- Valkey/Redis (via docker-compose)

## Security Considerations

### Input Validation
- All user inputs are validated with Zod schemas
- Display names are trimmed and length-limited
- XSS protection through React's automatic escaping

### Authorization
- All server actions verify session context
- Account ID is retrieved server-side, never from client
- Journey ownership is verified before deletion
- Session interceptor adds authentication metadata to all gRPC calls

### Data Protection
- No sensitive data in client-side state
- Journey data filtered by account ID at API level
- Session tokens handled securely by auth package

## Monitoring and Observability

### Logging
- Log all server action invocations with accountId
- Log all gRPC errors with status codes
- Log retry attempts for transient errors

### Metrics
- Track API call success/failure rates
- Track API call latency
- Track optimistic update rollback frequency
- Track error types and frequencies

### Error Tracking
- Integrate with error tracking service (e.g., Sentry)
- Include context: accountId, journeyId, operation type
- Track user-facing errors separately from system errors

## Future Enhancements

### Pagination
- Add pagination support when API supports it
- Implement infinite scroll or page-based navigation
- Handle accounts with >100 journeys

### Filtering and Search
- Add search by journey name
- Add filter by status
- Add sort by creation date

### Bulk Operations
- Select multiple journeys
- Bulk delete
- Bulk status change

### Journey Templates
- Create journey from template
- Save journey as template
- Template library

### Collaboration
- Share journeys with team members
- Journey permissions
- Activity log

