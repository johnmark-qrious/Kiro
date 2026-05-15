---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-13T14:04:00+12:00
lastPublished:
---

# Zespri MCS — Business Context & Purpose

> **STATUS:** Confluence-sourced (May 8 2026). Business context remains valid - not contradicted by codebase. Technical details now in `mcs-architecture.md`.

## Why MCS Exists

> "This system is used by 5,000 people across multiple service lines within the kiwifruit industry and is responsible for running 100+ tests per day and calculating $400 million worth of bonuses per year."

### The Problem

Zespri needed a platform that contains all orchard and maturity testing data in one place. Before MCS, the process was manual, fragmented, and couldn't scale with Zespri's growth.

Zespri International Limited is the world's largest marketer of kiwifruit, selling in 50+ countries. They work with ~2,800 NZ growers and ~1,500 international growers plus post-harvest companies. To earn the premium they do for high-quality fruit, Zespri only accepts fruit that has met their stringent maturity criteria.

The legacy system was unwieldy and couldn't keep pace with the industry's scale and complexity. It needed to be replaced with modern, future-proof technology to automate the maturity clearance process.

### The Solution

MCS is the platform Spark NZ built to:
1. **Determine when fruit can be picked** — maturity testing ensures optimal harvest timing
2. **Grade fruit correctly** — quality assessment via the Calc Engine
3. **Calculate payment grades** — determines the $400M+ in bonuses paid to growers annually
4. **Coordinate the entire supply chain** — from orchard to packhouse to export

## Target Users (5,000+ people)

| User Type | Role in the System |
|-----------|-------------------|
| **Zespri** | System owner. Manages clearance criteria, season rollover, industry pricing, allocations |
| **Zespri MCS Administrator** | Full system access, manages roles and configuration |
| **Zespri MCS Support User** | Support operations, troubleshooting |
| **Zespri User** | Standard Zespri staff access |
| **Grower/Farmer** | Views their orchard's maturity status and clearance results |
| **Packhouse Employee** | Manages fruit intake, views clearance status |
| **Orchard Packhouse Contact** | Liaison between orchard and packhouse |
| **MCS Packhouse Administrator** | Admin for packhouse operations |
| **Picking Company** | Needs to know when fruit is cleared to pick |
| **Sampling Service Providers (SSP)** | Physically collect samples from orchards. Use eAPI to update states. |
| **Testing Service Providers (TSP)** | Lab-test samples. Use eAPI to submit results. |

## The Kiwifruit Maturity Process

### Varieties Tested
| Code | Variety | Notes |
|------|---------|-------|
| GA | Gold3 | Premium gold kiwifruit |
| HE | Green14 | Green variety |
| HW | Hayward | Classic green kiwifruit |
| RS | Red19 | Red variety |
| WK | Wilkins | Phasing out |

Numbers after names = breeding program version identifiers.

### How It Works (Simplified Flow)

```
Season Start
    │
    ▼
┌─────────────────────────────────────────────┐
│ 1. SETUP                                     │
│    - Season Rollover (annual data transition)│
│    - Maturity Areas defined                  │
│    - Blocks associated to MAs               │
│    - Allocations set (SSP/TSP by region)    │
│    - Clearance criteria configured           │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ 2. SAMPLING                                  │
│    - Sample Requests created (bulk CSV or UI)│
│    - SSPs assigned to collect samples        │
│    - SSPs visit orchards, collect fruit      │
│    - State: Assigned → Collected             │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ 3. TESTING                                   │
│    - Samples transferred to TSPs             │
│    - State: ChangeCustody → LoggedIn         │
│    - Lab tests run (DM, BRIX, etc.)          │
│    - Results submitted via eAPI              │
│    - State: Tested                           │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ 4. CLEARANCE (Calc Engine)                   │
│    - Results evaluated against criteria      │
│    - Kiwistart / Mainpack / Advanced rules   │
│    - Inheritance checks (HW seed)            │
│    - CTP (Clearance To Pick) granted or not  │
│    - State: Released (or Failed)             │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ 5. REPORTING & PAYMENT                       │
│    - Results sent to SAP (TR messages)       │
│    - Quality grades determine grower payment │
│    - $400M+ in bonuses calculated annually   │
│    - Reports exported via ADF → SFTP         │
└─────────────────────────────────────────────┘
```

### Key Business Rules

- **Dry Matter (DM)** is the primary maturity indicator — fruit must reach minimum DM levels
- **Non-DM tests** (residues, monitoring) have separate clearance paths
- **Provisional Release** allows conditional clearance before all results are in (DM only, NOT for monitoring/residues)
- **Inheritance** — some clearance criteria cascade from parent blocks/areas
- **Sweep checks** — catch any growers/blocks still outstanding
- **GRM Area** — Geographic Region Management area, used for filtering and reporting

### Data Flows to External Systems

- **SAP** — Receives TR (Transport Request) messages with clearance results for payment calculation
- **Spray Diary** — Receives residue test placeholders (KPIN, BlindedSampleId, ResidueTypeCode)
- **CRM (Zespri)** — Source of truth for users, roles, countries, regions (synced to MCS)
- **SFTP** — Receives exported CSV reports (FruitResults, SampleResultAllSizes, SampleRequest)

## Bulk Operations (CSV Uploads)

MCS supports bulk data management via CSV:
- Maturity Areas and related blocks (new MAs, existing blocks)
- Block associations to existing Maturity Areas
- Hazards
- Sample Requests

Each upload can be for a single item or many.

## Business Value

- **Scale:** 100+ tests per day during harvest season
- **Financial impact:** $400M+ in grower bonuses calculated through this system
- **Users:** 5,000+ across the kiwifruit industry
- **Quality assurance:** Ensures only mature, high-quality fruit reaches market — protecting Zespri's premium brand
- **Compliance:** Meets market import requirements and food safety standards
- **Efficiency:** Replaced manual/fragmented legacy processes with automated, data-driven decisions

## Source

- Confluence page: "Zespri Maturity Clearance System" (space: BIGDATA)
- Confluence page: "MCS ( Maturity Clearance System ) Overview" (ID: 10285645939)
- Spark NZ customer story: spark.co.nz/online/large-business-govt/why-choose-spark/customer-stories/zespri
- Zespri Kiwiflier publications (canopy.zespri.com)
