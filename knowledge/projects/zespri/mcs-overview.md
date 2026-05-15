---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-13T14:04:00+12:00
lastPublished:
---

# Zespri MCS — Overview & Architecture

> **SUPERSEDED:** This file was sourced from Confluence (May 8 2026) before codebase access. The authoritative, code-verified architecture doc is now `mcs-architecture.md` in this same folder. This file is retained for infrastructure/DevOps details not visible in code (ADF, APIM, release history, team info).

## What Is MCS?

The **Maturity Clearance System (MCS)** is a data platform built and maintained by Spark NZ for Zespri (world's largest kiwifruit marketer, ~$3.1B revenue). It ensures kiwifruit is:
- Picked at the right time (maturity testing)
- Graded correctly (quality assessment via Calc Engine)
- Payment grades calculated accurately for growers

The system manages the full lifecycle of **Sample Requests** — from orchard block association, through sampling by service providers (SSPs), lab testing by testing service providers (TSPs), to clearance-to-pick decisions.

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 14 (TypeScript) | Frontend application (upgraded from v12 in FY2026, MCS26-51) |
| Azure Front Door | Entry point for all web traffic |
| Azure App Service | Hosting for UI (migrated from serverless in FY2026) |

Note: The Next.js 14 migration (MCS26-51) moved the UI to Azure App Service, but some APIs remain on Azure Function Apps. Changing those URLs would cost external users (SSPs/TSPs who call eAPIs via Postman) money, so they were left in place.

### Backend
| Technology | Purpose |
|-----------|---------|
| Azure Function Apps (C#) | Primary API layer |
| Next.js API routes | Secondary API (within MCS-External Azure Function App) |
| Entity Framework (EF Core) | ORM for database access (scaffold-based) |
| Azure SQL Database | Primary data store (4 instances: DEV, TST, PPE, PRD — all Zespri-owned) |
| Azure Data Factory (ADF) | Data pipelines, automation, scheduled jobs |
| Azure Blob Storage | File storage (maps, uploads, extracts) |
| SendGrid | Email notifications |
| Spark eTXT | SMS notifications |
| Azure API Management (APIM) | API gateway (must be modified before prod deploys) |
| Azure Logic Apps | Error monitoring & alerting |

### Infrastructure & DevOps
| Technology | Purpose |
|-----------|---------|
| Azure DevOps (Zespri tenant) | CI/CD pipelines, Git repos |
| GlobalProtect VPN | Developer DB access |
| Azure Virtual Desktop | Alternative DB access |
| Azure AD / Service Principals | Authentication (migrated Jan 2026, P6480) |
| ServiceNow | Change management (CAB process) |
| Jira (Zespri) | Project tracking (MCS26 board) |

### Key Azure Resources
- Subscription: `ZespriAppWorkload`
- Resource group: `rg-maturityclearances`
- ADF (dev): `adf-zes-dev-wu2-mcs` (integrated with Azure DevOps)
- Logic App (error alerts): `la-zes-prd-wu2-mcs-hourly-error-adf-summary`
- Function App (external): `azfun-zes-[dev/tst/ppe/prd]-sea-external-packhouse`
- Blob Storage: `stzeststwu2mcsorchmap` (maps container)

### Source Repositories (Azure DevOps - Zespri org)
- `Zespri.MCS.UI` — Frontend (Next.js)
- `Zespri.MCS.APIs` — C# API layer
- `Zespri.MCS.DataAccess` — Entity Framework data access
- `Zespri.MCS.DataFactory` — ADF pipeline definitions

## Development Workflow

- **Branching:** Trunk-based with Git tags (separation of code and release)
- **Environments:** DEV → TST → PPE → PRD
- **DEV/TST:** Deployed by developers
- **PPE/PRD:** Deployed by SRE
- **CAB process:** Required for all production releases (via ServiceNow)
- **Pipeline limitation:** 3 parallel agents max in Zespri DevOps (jobs may queue)
- **DB backup:** Not required since March 2022 — Azure SQL point-in-time restoration available
- **No local databases:** All DBs are Zespri-owned and hosted in Azure. No local MSSQL instances.

## Authorisation Model

- Project: `Zespri.MCS.UI`
- Auth endpoints: `/auth/request-token` and `/auth/validate-token`
- Source of truth tables:
  - `[dbo].[MCSUser]` — Main user table
  - `[dbo].[MCSUserRole]` — Role assignments
- Users/roles synced from Zespri CRM via stored procedures
- Role-based access: Admin Tier 1, Admin Tier 2 (minimal access), Support role

## Key Domains

### Sample Requests (Core Entity)
- Transitions through states: Assigned → Collected → ChangeCustody → LoggedIn → Tested → Released
- Status stored in `[dbo].[SampleRequest.Status]` column
- Display status may differ from underlying state (role/page dependent)
- Status history tracked for audit (MCS26-38)

### Calc Engine
- Acceptance criteria types: Kiwistart, Modified Kiwistart, Mainpack, Advanced Mainpack
- 24 database views must be updated when adding new criteria
- Key views: `vw_SampleReportMaturityAreaDetails`, `vw_SampleReportMaturityAreaDetailsByArea`, etc.
- Checks for inheritance, then sample clearance levels
- Future work needed: rework to check inheritance first, then sample clearance

### Season Rollover
- Critical annual process transitioning block, orchard, and production data to new season
- Automated in FY2026 (MCS26-9) via admin tile
- Provides controlled, auditable interface for managing transitions

### Maturity Areas (MA)
- Geographic/orchard groupings for clearance decisions
- Block associations link orchards to MAs
- ADF task checks Maturity Areas every 15 minutes

### Allocations
- SSP and TSP allocations by region and variety
- Allocation % by region with association by variety

### Non-Dry Matter (Non-DM)
- Separate from DM (Dry Matter) testing
- Provisional release process for non-DM results
- Non-DM provisional release must NOT apply to Monitoring or Residues (MCS26-137)

### CRM Sync
- Country sync: `[Stg].[UspCRMMCSCountrySync]` → `[dbo].[Country]`
- Region sync: `[Stg].[UspCRMMCSSupplyRegionSync]` → `[dbo].[Region]`
- Deleted records flagged (soft delete) when CRM reference no longer exists

## External APIs (eAPI)

4 categories of external APIs for SSPs and TSPs:

1. **Allocation eAPI (eAPI1)** — Allocate/de-allocate sample requests
2. **State Change eAPI (eAPI2)** — `PUT /mcs/SampleRequest?State={State}&BlindedSampleNumber={id}`
   - SSPs can set: Assigned, Collected, ChangeCustody, CompromisedSSP
   - TSPs can set: LoggedIn, Tested, CompromisedTSP
3. **Hazard eAPI** — Adding new hazards
4. **Spray Diary / Residue Placeholder API** — Creates placeholder in Spray Diary (KPIN, BlindedSampleId, ResidueTypeCode, RequestedCollectionDate) before TSP can send results

## ADF Pipelines (Data Factory)

3 key pipelines (PROD):
1. **FruitsResult** — `pl_azuresql_mcs_view_to_sftp_FruitResults`
2. **SampleResultAllSizes** — `pl_azuresql_mcs_view_to_sftp_SampleResultsAllSizes`
3. **SampleRequest** — `pl_azuresql_mcs_view_to_sftp_SampleRequest`

All export data from Azure SQL views to SFTP. Built in TST environment due to DEV view inconsistencies.

## Notification System

- Email via SendGrid (layout/design managed in SendGrid dashboard)
- SMS via Spark eTXT (templates in `{path}/src/helpers/notification/sms-templates.ts`)
- Notification API always returns 202 Accepted (fire-and-forget)
- Notification types stored in `[dbo].[Notification]` table
- Error monitoring: Logic App sends hourly error summary emails covering ADF jobs

## Storage

- Azure Blob Storage with different containers per use case
- Map files: GUID filenames + extension (JPG, GIF, PNG)
- SAS tokens required for file access
- Short-term: processing, uploads, downloads, extracts
- Long-term: maps

## Database Access

- No local databases — all hosted by Zespri in Azure
- Access methods: GlobalProtect VPN or Azure Virtual Desktop
- ORM refresh command (when new DB fields added):
  ```
  cd Zespri.MCS.APIs/API Source/Zespri.MCS.DataAccess
  dotnet ef dbcontext scaffold "Server=tcp:[connection string]" Microsoft.EntityFrameworkCore.SqlServer
  ```

## FY2026 Enhancement Project Summary

- Board: MCS26 (Jira)
- Total tickets: 109 (59 defects, 28 user stories, 15 tasks, 7 sub-tasks)
- 5 releases shipped (Sept 2025 → Jan 2026)
- Key epics: Season Rollover automation, Non-DM provisional release, Next.js upgrade, Role management, Allocation improvements
- Assignee: Sharon Alabastro (BA), Hamish Dickinson (DEV), John Mark Martinez (Next.js upgrade)

## Release History (FY2026)

| Release | PPE Date | PROD Date | Key Features |
|---------|----------|-----------|--------------|
| #1 | 23 Sept 2025 | 25 Sept 2025 | Season rollover automation, defect fixes |
| #2 | 21 Oct 2025 | 23 Oct 2025 | Enhancements and defect fixes |
| #3.1 | 12 Nov 2025 | 13 Nov 2025 | Role updates, allocation improvements |
| #3.2 | 26 Nov 2025 | 27 Nov 2025 | Test type filter, block info, admin search |
| #4 | 15 Dec 2025 | 18 Dec 2025 | Non-DM provisional release, Next.js 14 upgrade |
| #5 | 15 Jan 2026 | 16 Jan 2026 | Final FY2026 enhancements |

## Known Future Work (from Benet Notes)

- Better configuration table management (sizeband, allocation tables) — should be built into admin screens
- Calc engine rework: check inheritance first, then sample clearance
- If sample clearance lower than inheritance → sample level fails against inherited criteria

## Source Provenance & Freshness

All information sourced from Confluence search excerpts on 2026-05-08.

| Topic | Source Date | Confidence | Notes |
|-------|------------|------------|-------|
| Tech stack (Next.js 14, Azure App Service) | Dec 2025 | High | MCS26-51 deployed Release #4 |
| Release process (trunk-based) | 2025 | High | Active, used across all FY26 releases |
| Auth model (Azure AD) | Jan 2026 | High | P6480 migration completed |
| ADF pipelines | ~2024 | Medium | May have new pipelines since |
| Calc engine / views | FY2026 | High | Referenced in active tickets |
| eAPI state flow | Unknown | Medium | Marked "in progress" |
| Cost optimisation | 2022 | Low | Marked TBD, may be stale |
| Benet future work notes | Unknown | Medium | Aspirational, not committed |

**Rule:** When working on Zespri MCS, always cross-reference Confluence for the latest version before acting on knowledge here. This file is a map, not ground truth.

## Confluence Source

- Space: BIGDATA (space ID: 13631490)
- Root page: "Zespri Support Knowledge Base" (ID: 9974841462)
- 25+ child pages covering architecture, APIs, releases, and feature documentation
- API token can list/search but NOT read full page bodies (permission limitation)
- Zespri DevOps org: `https://dev.azure.com/zespri/Maturity Clearance System/`
