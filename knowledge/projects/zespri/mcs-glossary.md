---
sync: draft
lastLocalEdit: 2026-05-13T20:52:00+12:00
lastPublished:
---

# Zespri MCS Glossary

## Business Terms

| Term | Definition |
|------|-----------|
| **MCS** | Maturity Clearance System. The platform that manages kiwifruit maturity testing and harvest clearance. |
| **Zespri** | Zespri International Limited. World's largest kiwifruit marketer (~$3.1B revenue). The client. |
| **KPIN** | Kiwifruit Property Identification Number. Unique identifier for an orchard property. Central to all permission scoping. |
| **Grower** | Orchard owner who grows kiwifruit. Receives payment bonuses based on fruit quality grades. |
| **Block** | A subdivision of an orchard (KPIN). A single orchard can have multiple blocks growing different varieties. |
| **Maturity Area (MA)** | A grouping of orchard blocks for testing purposes. Blocks are "associated" to MAs. |
| **GRM Area** | Geographic Region Management area. Used for regional filtering and reporting. |
| **Sample Request (SR)** | The core entity in MCS. Represents a request to test fruit from a specific block for maturity. Tracks the full lifecycle from creation to clearance. |
| **Blinded Sample Number** | Unique identifier for a sample request, used in eAPI calls. Prevents bias in testing. |
| **Clearance / CTP** | Clearance To Pick. The decision that fruit has reached maturity and can be harvested. |
| **DM (Dry Matter)** | The primary maturity indicator. Percentage of fruit mass that isn't water. Higher DM = more mature = better taste. Fruit must reach minimum DM levels for clearance. |
| **BRIX** | Sugar content measurement. One of the lab test metrics alongside DM. |
| **Non-DM** | Tests other than Dry Matter (residues, monitoring). Have separate clearance paths. Provisional release does NOT apply to monitoring or residues. |
| **Provisional Release** | Conditional clearance before all results are in. Applies to DM only, not monitoring/residues. |
| **Dispensation** | Special approval to harvest fruit that technically failed clearance criteria. Admin-only override. |
| **Inheritance** | Clearance criteria that cascade from parent blocks/areas to children. HW seed inheritance is a specific case. |
| **Calc Engine** | The calculation system (24 database views) that evaluates test results against clearance criteria. Checks inheritance first, then sample clearance. |
| **Kiwistart** | Early-season clearance program. Has its own set of criteria rules. |
| **Mainpack** | Standard clearance program (after Kiwistart period). |
| **Sizeband** | Fruit size classification. Affects allocation and pricing. |
| **Season Rollover** | Annual admin operation that transitions the system from one harvest season to the next. Resets data, archives old season. |
| **Sweep Check** | Process to catch any growers/blocks still outstanding at end of season. |
| **TR (Transport Request)** | Message sent to SAP with clearance results for payment calculation. |
| **Allocation** | Assignment of SSPs and TSPs to regions/varieties. Determines who collects and tests samples where. |

## Roles & Actors

| Term | Definition |
|------|-----------|
| **SSP** | Sampling Service Provider. External company that physically visits orchards and collects fruit samples. Uses eAPI to update sample status. |
| **TSP** | Testing Service Provider. Lab that receives samples and runs maturity tests (DM, BRIX, etc.). Submits results via eAPI. |
| **Packhouse** | Facility where harvested fruit is packed for export. Has its own user scope (`packhouse_ids`). |
| **Zespri Admin** | Internal Zespri user with full system access (`is_zespri: true`). Bypasses all permission checks. |
| **Support User** | Zespri MCS Support role. Limited admin capabilities. |

## Kiwifruit Varieties

| Code | Name | Notes |
|------|------|-------|
| **GA** | Gold3 | Premium gold kiwifruit |
| **HE** | Green14 | Green variety |
| **HW** | Hayward | Classic green kiwifruit |
| **RS** | Red19 | Red variety |
| **WK** | Wilkins | Phasing out |

## Sample Request States

| ID | State | Meaning |
|----|-------|---------|
| 1 | **Requested** | Created, not yet linked to anything |
| 2 | **Associated** | Linked to a maturity area |
| 3 | **Unassociated** | Removed from area |
| 4 | **Allocated** | Assigned to an SSP |
| 5 | **Assigned** | SSP accepted the job |
| 6 | **Collected** | Fruit physically picked |
| 7 | **ChangeCustody** | Handed from SSP to TSP |
| 8 | **LoggedIntoLab** | TSP received at lab |
| 9 | **TestInProgress** | Lab testing underway |
| 10 | **CompromisedSSP** | Sample compromised while with SSP |
| 11 | **CompromisedTSP** | Sample compromised while with TSP |
| 12 | **TestsCompleted** | All tests done |
| 15 | **Cleared** | Passes clearance criteria |
| 16 | **Failed** | Fails clearance criteria |
| 17 | **Completed** | Final archive state (season end) |
| 18 | **Cancelled** | Cancelled before testing |
| 19 | **Processing** | Calc engine computing metrics |
| 20 | **Failed_D** | Failed with dispensation (approved anyway) |
| 21 | **Cleared_O** | Override cleared (admin manual) |
| 22 | **Provisional** | Provisional release |
| 23 | **Cleared_I** | Cleared interim |

## Technical Terms

| Term | Definition |
|------|-----------|
| **eAPI** | External API. REST endpoints consumed by SSPs and TSPs to interact with MCS from their own systems. Hosted on Azure Function Apps. |
| **eAPI1** | Allocation eAPI. Allocate/de-allocate sample requests. |
| **eAPI2** | State Change eAPI. `PUT /mcs/SampleRequest?State={State}&BlindedSampleNumber={id}` |
| **BFF** | Backend For Frontend. The Next.js API routes layer that sits between the browser and the C# API. |
| **Prisma** | ORM used in the Next.js BFF layer for direct SQL Server reads. 72KB schema file. |
| **EF / Entity Framework** | ORM used in the C# Azure Functions API. Scaffolded from database (never manually edited). |
| **MCSContext** | The 1MB Entity Framework DbContext file. 200+ entities, 50+ views. Auto-generated via scaffold. |
| **SampleRequestApi.cs** | The 133KB monolithic C# file containing all sample request business logic. Primary refactoring target. |
| **qubic-lib** | Zespri's internal UI component library. Provides theme, layout, utilities. |
| **ADF** | Azure Data Factory. Runs scheduled data pipelines (exports to SFTP, monitoring checks). |
| **APIM** | Azure API Management. Gateway for external APIs. Must be modified before prod deploys. |
| **SAS Token** | Shared Access Signature. Time-limited token for Azure Blob Storage file access. |
| **CAB** | Change Advisory Board. Required approval process for all production releases (via ServiceNow). |
| **PPE** | Pre-Production Environment. Final testing stage before production. |

## Environments

| Code | Name | Deployed By |
|------|------|-------------|
| **DEV** | Development | Developers |
| **TST** | Test | Developers |
| **PPE** | Pre-Production | SRE |
| **PRD** | Production | SRE (CAB required) |

## External Systems

| System | Purpose |
|--------|---------|
| **SAP** | Receives clearance results (TR messages) for grower payment calculation ($400M+ annually) |
| **Spray Diary** | Receives residue test placeholders |
| **CRM (Zespri)** | Source of truth for users, roles, countries, regions. Synced to MCS. |
| **ADFS** | Zespri's Active Directory Federation Services at `fs.zespri.com`. Handles authentication. |
| **Power BI** | Embedded reports within MCS UI |
| **SendGrid** | Email notifications (19 templates) |
| **Spark eTXT** | SMS notifications |
| **Dynatrace** | Application Performance Monitoring |
| **ServiceNow** | Change management (CAB process) |
| **Jira** | Project tracking (MCS26 board, Zespri tenant) |
