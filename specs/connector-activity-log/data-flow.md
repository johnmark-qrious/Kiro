---
status: draft
approvedBy:
approvedDate:
---

# Connector Activity Log — Data Flow

## System Overview

The connector system spans three repos. Prefect handles connector operations (create, edit, activate, deactivate, run). The Ubiquity backend stores the audit trail. The frontend reads and displays it.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER ACTION                                     │
│  (create / edit / activate / deactivate / run connector)                 │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Ubiquity-WebApps      │
          │   (Next.js frontend)    │
          │                         │
          │  Calls Prefect API to   │
          │  perform the operation  │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Ubiquity-Connectors-   │
          │  Prefect (Python)       │
          │                         │
          │  1. Performs the         │
          │     connector operation │
          │     (via Prefect flows) │
          │                         │
          │  2. Logs the event to   │──────────────────┐
          │     Ubiquity backend    │                  │
          └─────────────────────────┘                  │
                                                       │ gRPC calls:
                                                       │ - EnsureService
                                                       │ - AddServiceOperation
                                                       │
                                          ┌────────────▼────────────┐
                                          │  QT-Ubi-UbiquityBackend │
                                          │  (C# / .NET)            │
                                          │                         │
                                          │  RemotingBridge gRPC    │
                                          │  ServiceManagementSvc   │
                                          │                         │
                                          │  Stores history in      │
                                          │  ServiceHistory table   │
                                          └─────────────────────────┘
```

## How History Gets Written (Prefect → Backend)

When Prefect performs a connector operation, it logs the event:

```
Prefect Flow (grpc_interface.py)
  │
  │  Step 1: EnsureService
  │  ─────────────────────
  │  Request:
  │    applicationId = "A7C8E9F1-2B3D-4E5F-6A7B-8C9D0E1F2A3B"  (Connectors constant)
  │    accountId     = <account UUID>
  │    displayName   = "Connectors"
  │
  │  Response:
  │    serviceId     = <GUID>  (unique per account, created if doesn't exist)
  │
  │  Step 2: AddServiceOperation
  │  ───────────────────────────
  │  Request:
  │    service_id    = <serviceId from step 1>
  │    item_id       = <connector UUID>           ← identifies which connector
  │    category      = CREATED / EDITED / ACTIVATED / DEACTIVATED
  │    item_type     = CONNECTOR
  │    history_text  = "optional notes"
  │
  │  Result:
  │    A row is written to ServiceHistory table
  ▼
```

## How History Gets Read (Frontend → Backend)

When a user opens the Activity Log modal:

```
ActivityLogModal (React)
  │
  │  Props: connectorId, accountId, connectorName
  │
  │  useQuery → fetchServiceHistoryAction({ connectorId, accountId })
  ▼
fetch-service-history.ts (Next.js server action)
  │
  │  Step 1: EnsureService (same as Prefect does)
  │  ─────────────────────
  │    applicationId = "A7C8E9F1-2B3D-4E5F-6A7B-8C9D0E1F2A3B"
  │    accountId     = <from props>
  │    → returns serviceId
  │
  │  Step 2: GetServiceHistory
  │  ─────────────────────────
  │    serviceId  = <from step 1>
  │    itemId     = <connectorId>    ← filters to this specific connector
  │    searchArgs = { pageNo: 1, pageSize: 100, orderBy: DATE DESC }
  │    → returns ServiceHistoryInfo[]
  │
  │  Step 3: Map to ActivityLogEntry[]
  │  ─────────────────────────────────
  │    category 0 → "edit"
  │    category 1 → "send"
  │    category 2 → "created"
  │    category 3 → "activated"
  │    category 4 → "deactivated"
  ▼
ActivityLogModal renders the timeline
```

## The Three Repos and Their Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│  Ubiquity-WebApps (Next.js)                                         │
│                                                                     │
│  READS activity log                                                 │
│  - ConnectorContextMenu → opens ActivityLogModal                    │
│  - ActivityLogModal → calls fetchServiceHistoryAction               │
│  - fetch-service-history.ts → gRPC to backend                      │
│                                                                     │
│  TRIGGERS connector operations                                      │
│  - Create/Edit/Activate/Deactivate → calls Prefect API              │
│  - Does NOT write to service history directly                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Ubiquity-Connectors-Prefect (Python)                               │
│                                                                     │
│  WRITES activity log                                                │
│  - grpc_interface.py → ensure_connector_service()                   │
│  - grpc_interface.py → log_connector_audit()                        │
│  - Called during connector create/edit/activate/deactivate flows    │
│                                                                     │
│  PERFORMS connector operations                                      │
│  - Manages connector configs in Prefect variables                   │
│  - Runs import/export flows                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  QT-Ubi-UbiquityBackend (C# / .NET)                                │
│                                                                     │
│  STORES activity log                                                │
│  - ServiceManagementServiceImpl.cs → EnsureService, GetServiceHistory│
│  - ServiceManager.cs → core business logic                          │
│  - ServiceHistory table in database                                 │
│                                                                     │
│  Provides gRPC API via RemotingBridge                               │
│  - EnsureService(applicationId, accountId) → serviceId              │
│  - AddServiceOperation(serviceId, itemId, category) → writes row    │
│  - GetServiceHistory(serviceId, itemId, searchArgs) → reads rows    │
└─────────────────────────────────────────────────────────────────────┘
```

## ID Relationships

```
Account (e.g. "Spark NZ")
  │
  ├── accountId: 73132aa6-...  (Ubiquity account GUID)
  │
  ├── Service (Connectors app for this account)
  │     ├── serviceId: <auto-created by EnsureService>
  │     ├── applicationId: A7C8E9F1-2B3D-4E5F-6A7B-8C9D0E1F2A3B  (constant)
  │     │
  │     └── History entries (filtered by itemId = connectorId)
  │           ├── Connector A created    (itemId = connector_a_uuid)
  │           ├── Connector A activated  (itemId = connector_a_uuid)
  │           ├── Connector B edited     (itemId = connector_b_uuid)
  │           └── ...
  │
  ├── Connector A
  │     ├── connector_id: 2cabd6ee-...  (UUID, used as itemId)
  │     └── connector_uuid: 7tarLMU...  (base64-encoded, used in Prefect URLs)
  │
  └── Connector B
        └── connector_id: ...
```

## Important Notes

- `connector_id` (UUID format) and `connector_uuid` (base64-encoded) represent the same GUID
  - The backend's `GuidHelper` can decode both formats
  - Prefect stores them as UUIDs, the old MVC app used base64
- `EnsureService` is idempotent — calling it multiple times for the same account returns the same serviceId
- The frontend does NOT write history — only Prefect does, during connector operations
- If Prefect doesn't call `log_connector_audit()` for an operation, it won't appear in the activity log

## Source Files

| File | Repo | Role |
|------|------|------|
| `grpc_interface.py` | Ubiquity-Connectors-Prefect | Writes history via `log_connector_audit()` |
| `fetch-service-history.ts` | Ubiquity-WebApps | Reads history via `ensureService` + `getServiceHistory` |
| `ActivityLogModal.tsx` | Ubiquity-WebApps | Renders the history timeline in a modal |
| `ConnectorContextMenu.tsx` | Ubiquity-WebApps | Passes `connectorId` + `accountId` to the modal |
| `ServiceManagementServiceImpl.cs` | QT-Ubi-UbiquityBackend | gRPC service implementation |
| `ServiceManager.cs` | QT-Ubi-UbiquityBackend | Core business logic for service history |
| `u3Constants.cs` | QT-Ubi-UbiquityBackend | Defines `Connectors` application GUID |
