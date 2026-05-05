---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Architecture Diagrams with Mermaid

Use Mermaid diagrams to communicate architecture decisions. Keep diagrams focused — one concept per diagram.

## C4 Model Levels

### Level 1: System Context — Who uses what

```mermaid
graph TB
    User[Web User] -->|HTTPS| WebApp[Next.js App]
    WebApp -->|gRPC| Backend[Backend Services]
    Backend -->|SQL| DB[(Database)]
    WebApp -->|REST| ExternalAPI[External API]
```

Use for: Initial architecture overview, stakeholder communication, onboarding.

### Level 2: Container — What runs where

```mermaid
graph TB
    subgraph "Browser"
        Client[React Client Components]
    end
    subgraph "Next.js Server"
        RSC[Server Components]
        SA[Server Actions]
        RH[Route Handlers]
    end
    subgraph "Backend"
        GrpcSvc[gRPC Services]
    end
    subgraph "Data"
        DB[(PostgreSQL)]
    end

    Client -->|"user interactions"| SA
    RSC -->|"gRPC via Connect"| GrpcSvc
    SA -->|"gRPC via Connect"| GrpcSvc
    RH -->|"gRPC via Connect"| GrpcSvc
    GrpcSvc --> DB
```

Use for: Deployment planning, team boundaries, infrastructure decisions.

### Level 3: Component — What's inside a container

```mermaid
graph LR
    subgraph "Journey Builder App"
        Page[Page/Layout RSC] --> Domain[Domain Utils]
        Domain --> GrpcClient[gRPC Client]
        Page --> Components[UI Components]
        Components --> Actions[Server Actions]
        Actions --> GrpcClient
        GrpcClient --> Transport[Connect Transport]
    end
    Transport -->|"gRPC"| Backend[Backend Service]
```

Use for: Feature planning, code organization, dependency analysis.

## Sequence Diagrams — How things flow

### Data Fetching Flow

```mermaid
sequenceDiagram
    participant Browser
    participant RSC as Server Component
    participant SA as Server Action
    participant gRPC as gRPC Service
    participant DB as Database

    Browser->>RSC: Navigate to page
    RSC->>gRPC: Fetch data (Connect transport)
    gRPC->>DB: Query
    DB-->>gRPC: Results
    gRPC-->>RSC: Protobuf response
    RSC-->>Browser: Streamed HTML

    Browser->>SA: Form submission
    SA->>gRPC: Mutate data
    gRPC->>DB: Write
    DB-->>gRPC: Confirmation
    gRPC-->>SA: Response
    SA-->>Browser: Revalidate + redirect
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Next as Next.js Middleware
    participant RSC as Server Component
    participant Auth as Auth Package
    participant gRPC as gRPC Service

    Browser->>Next: Request
    Next->>Auth: Check session headers
    alt No session
        Auth-->>Next: Redirect to login
        Next-->>Browser: 302 /login
    else Valid session
        Auth-->>Next: Pass through
        Next->>RSC: Forward request
        RSC->>Auth: requireSessionClaimsCached()
        Auth-->>RSC: SessionClaims
        RSC->>gRPC: Request with session interceptor
        Note over RSC,gRPC: X-Current-Session header injected
        gRPC-->>RSC: Response
        RSC-->>Browser: Rendered page
    end
```

## State Diagrams — Lifecycle and transitions

```mermaid
stateDiagram-v2
    [*] --> Draft: Create
    Draft --> Active: Publish
    Draft --> Archived: Archive
    Active --> Paused: Pause
    Paused --> Active: Resume
    Active --> Archived: Archive
    Paused --> Archived: Archive
    Archived --> [*]
```

Use for: Entity lifecycle, workflow states, feature flags.

## Entity Relationship Diagrams

```mermaid
erDiagram
    Account ||--o{ Journey : "has many"
    Journey ||--o{ JourneyConnection : "has many"
    Journey {
        string id PK
        string account_id FK
        string display_name
        json config
        timestamp created_at
        timestamp updated_at
    }
    JourneyConnection {
        string id PK
        string journey_id FK
        string source_type
        json config
    }
```

Use for: Data modeling, schema design, migration planning.

## Guidelines

- One diagram per concept — don't cram everything into one
- Label edges with the protocol or action (gRPC, REST, "validates", "triggers")
- Use subgraphs to show deployment boundaries
- Keep sequence diagrams to the happy path first, then add error flows separately
- Use consistent naming: match component names to actual code (e.g., `gRPC Client` not `API Layer`)
- Include diagrams in design docs, not as standalone files
