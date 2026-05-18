---
inclusion: manual
---

# Ubiquity Platform Architecture

This is the stable architecture overview of the Ubiquity platform. It describes how the repos in this workspace connect and what each one does. Use this as your starting point when building features that span multiple repos.

## Repositories

### Ubiquity-WebApps (Frontend Monorepo)
- Stack: Next.js 15, React 19, TypeScript, Tailwind 4, Bun, Turbo, Biome
- State: Jotai
- Validation: Zod
- Structure: Bun workspaces with Turbo for orchestration

**Apps:**
- `database` — Connector management UI (add, list, configure, monitor data connectors)
  - Domains: `accounts`, `add-connector`, `connector-list`
  - Connects to Backend via gRPC (Connect protocol) for account/list/service management
  - Connects to Connectors-Prefect via REST API for connector CRUD and run operations
- `journey-builder` — Visual journey/campaign builder UI

**Shared Packages:**
- `auth` — Session management, permissions, auth utilities (server-side)
- `error-handling` — Centralized error handling
- `http-client` — Shared HTTP client utilities
- `logger` — Logging (server logger)
- `navbar` — Shared navigation component
- `schemas` — Zod schemas for connector configs (shared contract with Prefect API)
- `timing` — Timing/performance utilities
- `ui` — Shared UI component library
- `utils` — General utilities

### QT-Ubi-UbiquityBackend (Backend)
- Stack: .NET/C#, Visual Studio solution (`u3.sln`)
- Architecture: Multi-service monolith with domain-based projects
- Domains: system, list, mail, smta, forms, survey, share, event, txt, push, dte
- Each domain has: common, core, content, nunit (tests), config files
- Exposes gRPC services (via `grpc/` project) consumed by WebApps
- Also has REST APIs: `api/` (v1), `apiv2/` (v2)
- Infrastructure: `tf/` (Terraform), Docker support
- Key services consumed by frontend: AccountService, ListService, TransactionalListService, ServiceManagementService

### ubiquity-protos (Proto Definitions)
- Stack: Protobuf, Buf CLI
- Purpose: Single source of truth for all gRPC service contracts
- Proto domains: billing, journeybuilder, list, mail, system, tracking
- Generates SDK packages for 3 languages:
  - `packages/typescript/` → `@qriousnz/ubiquity-protos` (consumed by WebApps via Connect)
  - `packages/python/` → `ubiquity-protos` PyPI package (consumed by Connectors-Prefect)
  - `packages/dotnet/` → NuGet package (consumed by Backend)
- Versioned with semantic-release
- Breaking change detection via `buf breaking` (FILE level)

### Ubiquity-Connectors-Prefect (Connector Orchestration)
- Stack: Python 3.12, Prefect 3, FastAPI, Polars, uv
- Purpose: Orchestrates data connector flows (import/export between external sources and Ubiquity)
- Structure:
  - `src/Flows/` — Prefect flows: extractors, importers, maintenance, connector_blocks
  - `src/connectors_interface_api/` — FastAPI REST API for connector management (CRUD, run, toggle, history)
- External sources supported: SFTP, Azure Blob Storage, AWS S3
- Consumes `ubiquity-protos` Python package for gRPC communication with Backend
- Infrastructure: `tf/` (Terraform SSM), Docker
- Linting: Ruff, type checking: mypy

### Ubiquity-Diagram (Architecture Visualization)
- Stack: Next.js 15, React 19, TypeScript, Tailwind 4, Bun, Biome
- Purpose: Visual architecture explorer / diagramming tool
- Uses: @xyflow/react (React Flow), dagre for layout
- State: Jotai
- Standalone app (not part of WebApps monorepo)

## How They Connect

```
┌─────────────────────────────────────────────────────┐
│                   ubiquity-protos                    │
│         (Proto definitions → TS, Python, .NET)      │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
     TS package     Python package   .NET package
           │              │              │
           ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ WebApps      │  │ Connectors   │  │ Backend          │
│ (Next.js)    │  │ (Prefect)    │  │ (.NET)           │
│              │  │              │  │                  │
│ database app ├──┤ FastAPI REST ├──┤ gRPC services    │
│ journey app  │  │ Prefect flows│  │ REST APIs        │
└──────────────┘  └──────────────┘  └──────────────────┘
       │                                    │
       └──────── gRPC (Connect) ────────────┘
```

**Data flow for connectors:**
1. WebApps `database` app → REST API → Connectors-Prefect FastAPI (connector CRUD, run, toggle)
2. WebApps `database` app → gRPC (Connect) → Backend (account info, list metadata, service management)
3. Connectors-Prefect → gRPC → Backend (reads/writes list data during import/export flows)
4. Connectors-Prefect → External sources (SFTP, Azure Blob, S3) for actual data transfer

## Key Conventions

- Proto changes go through `ubiquity-protos` first, then consumers update their generated packages
- Frontend uses Connect protocol (not raw gRPC) — `@connectrpc/connect` with `createGrpcTransport`
- Connector configs are defined as Zod schemas in `packages/schemas` and must match the Prefect API contract
- All repos use conventional commits with commitlint
- Frontend repos use Biome for linting/formatting, Bun as package manager
- Backend uses .NET with XML-based configuration files
- Connectors-Prefect uses Ruff for linting, uv for package management
- **File downloads use streaming from backend** — when a gRPC service has a server-streaming RPC returning `bytes chunk`, pipe it via a Next.js Route Handler directly to the browser. No client-side CSV/file generation libraries. See `apps/admin/src/app/billing/download/route.ts` for the pattern.

## When Building Features

- If the feature touches gRPC contracts → start in `ubiquity-protos`, then update consumers
- If the feature is frontend-only → work in `Ubiquity-WebApps`
- If the feature involves data connectors → likely spans WebApps (UI) + Connectors-Prefect (API/flows) + possibly protos
- If the feature needs new backend services → Backend + protos + WebApps
