---
sync: draft
lastLocalEdit: 2026-05-21T13:56:00+12:00
---

# Zespri MCS - New Feature Proposal (FY2027)

## Executive Summary

This proposal presents four high-value feature investments for the Zespri Maturity Clearance System (MCS), validated through adversarial design review. Each feature was stress-tested for technical feasibility, business value, conflict of interest, and architectural risk.

**Key facts:**
- Zespri: $5.9B NZD revenue (2025 record), 248M trays sold, 116M consumer households reached
- MCS: 5,000 users, 100+ tests/day during harvest, $400M+ in grower bonuses calculated annually
- Platform: Next.js 14 + Azure Functions (.NET 6) + SQL Server, hosted in Zespri's Azure tenant

**Total investment:** 14 weeks / $175-245K NZD
**Revenue protected:** $5.9B operation with direct impact on $400M bonus accuracy and market access

| # | Feature | Timeline | Investment | Primary Value |
|---|---------|----------|------------|---------------|
| 1 | NIR Device Integration | 4 weeks | $50-75K | Future-proofs maturity testing, 100x data density |
| 2 | Grower Self-Service Portal | 6 weeks | $75-100K | Eliminates 60-80% support calls, serves 4,800 mobile users |
| 3 | Traceability & Compliance Automation | 2 weeks | $25-35K | Protects market access (EU, China), audit-ready exports |
| 4 | SSP/TSP Performance Analytics | 2 weeks | $25-35K | Provider quality visibility, data-driven allocation |

**What was rejected (and why):**
- Weather/Climate Integration - buy HortPlus MetWatch subscription instead
- IoT Orchard Sensors - buy CropX/Sensoterra/The Yield instead
- Multi-Country Supply Chain - fix platform foundation first (12+ month horizon)

---

## Feature 1: NIR Device Integration

### What Is It

Near-Infrared (NIR) spectroscopy is a non-destructive testing technology that measures fruit quality attributes (dry matter, Brix, hue angle) by shining near-infrared light through the fruit skin. Unlike traditional destructive lab testing (which cuts the fruit), NIR gives instant readings in the field without damaging the sample.

Devices like the Felix F-751 Kiwi Quality Meter are handheld, battery-powered instruments that SSPs can carry into orchards. A single reading takes 2-3 seconds. This means instead of collecting a sample, driving it to a lab, waiting for results, and driving back, field workers get immediate maturity data on-site.

### Why It Matters for Zespri

The kiwifruit industry is moving toward non-destructive testing as the primary maturity assessment method. Academic research (2024-2026) shows NIR spectroscopy achieving high accuracy for kiwifruit SSC, dry matter, and storage day prediction. Zespri is already trialing handheld NIR devices in-field.

**If MCS cannot accept NIR data, it becomes irrelevant.** Labs won't exist for routine clearance testing in 5-10 years. MCS must evolve or be replaced.

**Business impact:**
- 10-100x more data points per orchard (non-destructive = test every fruit, not just samples)
- Real-time maturity tracking without lab turnaround delays
- Better predictive models (more data = more accurate clearance predictions)
- Protects accuracy of $400M+ annual grower bonus calculations
- No off-the-shelf alternative exists that integrates with MCS's clearance workflow

### How It Works (Technical)

**Architecture: Anti-Corruption Layer pattern**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Felix F-751     │     │ Vendor Adapter    │     │ MCS Core    │
│ (or other NIR)  │────▶│ (Azure Function)  │────▶│ NirReading  │
│                 │     │ Maps proprietary  │     │ table + API │
│ Proprietary     │     │ format → MCS      │     │             │
│ JSON/CSV output │     │ schema            │     │ Existing    │
└─────────────────┘     └──────────────────┘     │ clearance   │
                                                  │ workflow    │
                                                  └─────────────┘
```

**Key design decisions:**
- MCS defines a universal `NirReading` ingest schema (device-agnostic)
- Each vendor gets a separate Azure Function adapter that maps their proprietary format to the MCS schema
- New vendor = new adapter function, zero changes to MCS core
- NIR readings stored alongside (not replacing) lab results
- Discrepancy flagging: when NIR and lab results differ beyond threshold, system alerts
- Validation thresholds owned by Zespri science team, not Spark

**MCS Ingest Schema (proposed):**

```json
{
  "sampleRequestId": "string (links to existing SR)",
  "deviceId": "string (registered device identifier)",
  "deviceModel": "string (e.g. 'Felix F-751')",
  "operatorId": "string (MCS user who took reading)",
  "timestamp": "ISO 8601",
  "location": { "lat": 0.0, "lng": 0.0 },
  "readings": {
    "dryMatterPercent": 0.0,
    "brixDegrees": 0.0,
    "hueAngle": 0.0,
    "pressureKg": 0.0,
    "firmness": 0.0
  },
  "rawSpectrumRef": "string (blob storage reference for raw spectral data)",
  "qualityScore": 0.0,
  "notes": "string"
}
```

**New database objects:**
- `[dbo].[NirReading]` - stores all NIR readings
- `[dbo].[NirDevice]` - registered devices (serial number, model, calibration date)
- `[dbo].[NirValidationRule]` - Zespri-owned thresholds for NIR vs lab comparison

**New API endpoint:**
- `POST /nir/readings` - accepts batch of NIR readings conforming to schema
- `GET /nir/readings/{sampleRequestId}` - retrieve NIR readings for a sample request
- `GET /nir/devices` - list registered devices

### Scope and Estimate

| Phase | Scope | Duration |
|-------|-------|----------|
| Phase 1 | Define schema, build ingest endpoint, build 1 vendor adapter (Felix F-751), store readings in DB | 4 weeks |
| Phase 2 (deferred) | Validation workflow (NIR vs lab comparison), discrepancy alerting, Zespri science team defines acceptance thresholds | Zespri business decision |
| Phase 3 (deferred) | Additional vendor adapters as Zespri trials other devices | 1 week per adapter |

**Phase 1 estimate: 4 weeks / $50-75K NZD**

### Prerequisites

- Confirm which NIR device Zespri is currently trialing
- Zespri science team defines the ingest schema fields (which readings matter)
- Device vendor provides API/export format documentation
- Agree on device registration process (who registers devices, calibration tracking)

### Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Vendor adapter proliferation (>3 vendors) | Registry pattern or adapter factory at that threshold |
| NIR accuracy disputed by growers | Store both NIR + lab results, let Zespri science team set acceptance criteria |
| Device calibration drift | Track calibration dates in NirDevice table, flag readings from overdue devices |
| No universal NIR API standard | Schema-first approach means MCS doesn't care about vendor protocols |

---


## Feature 2: Grower Self-Service Portal

### What Is It

A lightweight, mobile-first web application that gives kiwifruit growers direct visibility into their orchard's maturity clearance status. Growers can check whether their fruit is cleared for harvest, view test results, and see upcoming sample schedules - all from their phone, without calling support.

This is NOT "making MCS responsive." It's a separate, standalone satellite application that reads from the same database but has zero coupling to the existing MCS codebase. Think of it as a read-only window into MCS data, purpose-built for growers.

### Why It Matters for Zespri

**The support problem:**
- 5,000 MCS users, majority are growers
- During harvest season, growers repeatedly check one thing: "Is my fruit cleared yet?"
- Current system is desktop-only (zero responsive CSS, no mobile support)
- Support staff are overwhelmed during the 6-8 week harvest window
- Every support call costs time and money, and delays are measured in lost revenue

**The user problem:**
- Growers are in orchards, not at desks
- They need status checks, not data entry
- Current MCS requires full desktop login for a 10-second status check
- No push notifications means growers must actively poll the system

**Business impact:**
- Eliminates 60-80% of harvest-season support calls
- Serves 4,800+ growers currently locked out of mobile access
- Push notifications mean growers act faster on clearance decisions
- Faster harvest decisions = better fruit quality = higher grower returns
- Aligns with Zespri 2035 strategy: "technology transforming how businesses operate"

### How It Works (Technical)

**Architecture: Greenfield satellite app (zero coupling to MCS core)**

```
┌─────────────────────────────────────────────────┐
│              Grower Portal (NEW)                  │
│  Next.js 15 | React 19 | Mobile-first | PWA     │
│                                                   │
│  3 screens:                                       │
│  1. Orchard Status (clearance progress)           │
│  2. Test History (results timeline)               │
│  3. Clearance Certificate (downloadable)          │
│                                                   │
│  Auth: Azure AD B2C (grower self-registration)    │
│  Data: Direct SQL read queries (read-only)        │
│  Notifications: Azure Notification Hubs (push)    │
└───────────────────────┬─────────────────────────┘
                        │ SQL read queries
                        │ (dedicated connection pool, max 10)
                        ▼
┌─────────────────────────────────────────────────┐
│           MCS SQL Server Database                 │
│  (existing - no schema changes needed)           │
│                                                   │
│  Views consumed:                                  │
│  - vw_SampleReportMaturityAreaDetails            │
│  - SampleRequest (status, dates)                 │
│  - Orchard/Block associations                    │
│  - CalcResult (clearance outcomes)               │
└─────────────────────────────────────────────────┘
```

**Why this bypasses all tech debt:**
- Does NOT touch the 133KB god class
- Does NOT route through Azure Functions API
- Does NOT depend on the existing Next.js 14 codebase
- Reads directly from SQL Server via Prisma (same pattern MCS UI already uses for complex queries)
- Greenfield = mobile-first from day zero, modern stack, proper error boundaries

**Key design decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 (App Router) | Greenfield, no legacy constraints. RSC for fast loads. |
| Auth | Azure AD B2C | Grower self-registration, Zespri approval workflow. SMS passwordless for growers without email. |
| Data access | Direct SQL via Prisma | Same DB, read-only queries. No dependency on C# API layer. |
| Connection isolation | Dedicated pool (max 10 connections) | Prevents portal from starving core MCS app |
| Caching | 60-second stale-while-revalidate (RSC) | Growers don't need real-time. 1-minute staleness acceptable. |
| Notifications | Azure Notification Hubs | Push to mobile browsers (PWA) when clearance status changes |
| Hosting | Azure App Service (same subscription) | Consistent with MCS UI hosting model |

**Screens:**

**1. Orchard Status (home screen)**
- List of grower's orchards/blocks with current clearance status
- Traffic light system: Red (not cleared), Amber (testing in progress), Green (cleared)
- Tap to expand: see which maturity areas, which varieties, expected timeline
- Pull-to-refresh

**2. Test History**
- Timeline view of all sample requests for grower's KPINs
- Each entry shows: date collected, date tested, result (DM%, Brix), clearance outcome
- Filter by season, variety, block

**3. Clearance Certificate**
- Downloadable PDF/view of official clearance status
- Shows: KPIN, block, variety, clearance date, criteria met
- Shareable with packhouse operators

### Bulk Onboarding (4,800+ growers)

| Step | Method | Duration |
|------|--------|----------|
| Extract grower list | SQL query from `[dbo].[MCSUser]` where role = grower | Minutes |
| Create B2C accounts | Microsoft Graph API batch (240 batches x 20 users) | ~12 minutes |
| Notification | SMS to each grower with activation link | Automated |
| Auth method | SMS passwordless (B2C custom policy) | No email required |
| Approval | Zespri admin approves batch, or auto-approve from known KPIN list | Configurable |

### Scope and Estimate

| Deliverable | Duration |
|-------------|----------|
| Project setup (Next.js 15, B2C config, DB connection, deployment pipeline) | 1 week |
| Orchard Status screen + data queries | 1.5 weeks |
| Test History screen + filtering | 1 week |
| Clearance Certificate screen + PDF generation | 1 week |
| Push notifications (status change triggers) | 0.5 weeks |
| Bulk onboarding script + testing | 0.5 weeks |
| UAT + polish | 0.5 weeks |
| **Total** | **6 weeks** |

**Estimate: 6 weeks / $75-100K NZD**

### Trigger Condition (When to Build)

This feature activates when ANY of these conditions are met:
- Support tickets exceed 40/week for 2 consecutive weeks during harvest
- Support SLA breach occurs due to volume
- Zespri explicitly requests grower self-service capability

### Prerequisites

- Zespri approves Azure AD B2C tenant setup (grower identity separate from internal users)
- Agree on which data growers can see (clearance status is obvious, but what about raw test values?)
- Define notification triggers (on clearance? on test completion? on state change?)
- Confirm SMS provider for passwordless auth (existing Spark eTXT or B2C native)

### Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Database load from portal queries | Dedicated connection pool (max 10), 60s RSC cache, indexed views. Escalation: add read replica if P95 > 200ms |
| B2C identity surface area | Scope to grower tenant only, never bleed into internal MCS auth |
| Growers without smartphones | Portal is PWA (works in any browser). SMS notifications work on feature phones. |
| Grower data privacy (seeing other growers' data) | KPIN-scoped queries only. B2C token contains KPIN claims. Server-side filtering. |

---


## Feature 3: Traceability & Compliance Automation

### What Is It

An automated compliance reporting layer that generates audit-ready evidence packs proving the chain of custody for every kiwifruit sample - from orchard block, through sampling, lab testing, to clearance decision. One API call produces a complete traceability bundle that satisfies GLOBALG.A.P., GFSI, and market-specific import requirements.

This is NOT a new UI. It's a backend capability (SQL views + one Azure Function endpoint) that produces structured compliance data on demand. Consumers are compliance teams, auditors, and downstream systems (SAP, quality claims platform).

### Why It Matters for Zespri

**Regulatory landscape:**
- Zespri requires GLOBALG.A.P. certification for all growers
- GFSI (Global Food Safety Initiative) requirements apply to both NZ and offshore operations
- EU and China have specific import traceability requirements
- 2026 season brought new registration requirements for GFSI compliance
- Zespri processes 40,000+ quality claims/year ($70M NZD) - traceability links clearance to claims

**The current gap:**
- MCS stores all the traceability data (sample → lab → result → clearance → who approved → when)
- But there's no audit-grade export capability
- Compliance teams manually extract data from multiple screens and compile reports
- Auditors can't get a single-click evidence pack
- No structured link between MCS clearance decisions and downstream SAP quality claims

**Business impact:**
- Market access protection: EU/China regulatory non-compliance = loss of market access ($100M+ revenue at risk)
- Audit efficiency: hours of manual compilation reduced to seconds
- Claims linkage: when a quality claim arrives, trace back to exact clearance decision instantly
- Regulatory future-proofing: template-driven approach means annual GLOBALG.A.P. changes are config updates, not code changes

### How It Works (Technical)

**Architecture: SQL views + single Azure Function endpoint**

```
┌─────────────────────────────────────────────────┐
│         Compliance API (NEW Azure Function)       │
│                                                   │
│  GET /compliance/orchard/{kpin}/season/{year}    │
│  GET /compliance/sample/{sampleId}/chain         │
│  GET /compliance/export/{format}                 │
│                                                   │
│  Returns: JSON evidence pack or PDF bundle        │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│           SQL Views (NEW)                         │
│                                                   │
│  vw_ComplianceChainOfCustody                     │
│  - Sample request → state transitions → dates    │
│  - Who collected (SSP) → who tested (TSP)        │
│  - Lab results (DM%, Brix, pressure)             │
│  - Clearance decision + approver + timestamp     │
│                                                   │
│  vw_ComplianceOrchardSeason                      │
│  - All samples for KPIN in season                │
│  - Clearance outcomes per variety/block          │
│  - Compliance status (complete/incomplete)        │
│                                                   │
│  vw_ComplianceGlobalGAP                          │
│  - Fields mapped to GLOBALG.A.P. requirements    │
│  - Template-driven (config table defines fields) │
└─────────────────────────────────────────────────┘
```

**Template-driven compliance mapping:**

Instead of hardcoding GLOBALG.A.P. field requirements in code, the system uses a configuration table:

```sql
-- [dbo].[ComplianceTemplate]
CREATE TABLE ComplianceTemplate (
    TemplateId INT IDENTITY PRIMARY KEY,
    TemplateName NVARCHAR(100),        -- 'GLOBALG.A.P. 2026', 'China Import 2026'
    FieldName NVARCHAR(100),           -- 'SampleCollectionDate'
    SourceColumn NVARCHAR(200),        -- 'SampleRequest.CollectedDate'
    DisplayLabel NVARCHAR(200),        -- 'Date of Sample Collection'
    Required BIT,
    ValidationRule NVARCHAR(500),      -- Optional: 'NOT NULL AND > SeasonStartDate'
    SortOrder INT,
    ActiveFrom DATE,
    ActiveTo DATE NULL                 -- NULL = currently active
)
```

**Annual GLOBALG.A.P. update process:**
1. Zespri compliance team provides new field requirements
2. Spark adds/modifies rows in `ComplianceTemplate` table (config change, not code change)
3. SQL views automatically pick up new template
4. No deployment needed for annual regulatory changes

**Evidence pack structure (JSON):**

```json
{
  "generatedAt": "2026-05-21T13:00:00Z",
  "template": "GLOBALG.A.P. 2026",
  "orchard": {
    "kpin": 12345,
    "grower": "Smith Orchards Ltd",
    "region": "Bay of Plenty",
    "blocks": ["A1", "A2", "B1"]
  },
  "season": "2026",
  "samples": [
    {
      "sampleId": "S-2026-00142",
      "variety": "Hayward",
      "block": "A1",
      "chainOfCustody": {
        "created": { "date": "2026-03-15", "by": "System" },
        "assigned": { "date": "2026-03-15", "ssp": "NZ Sampling Ltd" },
        "collected": { "date": "2026-03-16", "by": "J. Brown (SSP)" },
        "custodyChanged": { "date": "2026-03-16", "tsp": "Fruit Lab NZ" },
        "tested": { "date": "2026-03-17", "by": "Lab Tech A. Wilson" },
        "released": { "date": "2026-03-17", "by": "System (Calc Engine)" }
      },
      "results": {
        "dryMatterPercent": 17.2,
        "brixDegrees": 6.8,
        "pressureKg": 8.1
      },
      "clearance": {
        "outcome": "Cleared",
        "criteria": "Mainpack",
        "date": "2026-03-17",
        "calcEngineVersion": "2026.1"
      }
    }
  ],
  "complianceStatus": "COMPLETE",
  "missingFields": []
}
```

### Scope and Estimate

| Deliverable | Duration |
|-------------|----------|
| SQL views (3 views: chain of custody, orchard season, GLOBALG.A.P. mapping) | 3 days |
| ComplianceTemplate config table + seed data for GLOBALG.A.P. 2026 | 1 day |
| Azure Function endpoint (3 routes: orchard, sample, export) | 3 days |
| PDF generation (evidence pack as downloadable PDF) | 2 days |
| Testing + documentation | 1 day |
| **Total** | **2 weeks** |

**Estimate: 2 weeks / $25-35K NZD**

### Prerequisites

- Zespri compliance team provides current GLOBALG.A.P. field requirements for 2026 season
- Confirm which downstream systems consume compliance data (SAP? Claims platform?)
- Agree on export formats needed (JSON, PDF, CSV, XML?)
- Identify which market-specific templates are needed beyond GLOBALG.A.P. (EU, China, Japan?)

### Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Regulatory change requires structural schema change | SQL views = abstraction layer. View definition absorbs schema drift. 2-week scope = low sunk cost if rewrite needed. |
| GLOBALG.A.P. requirements change annually | Template-driven config table. Annual update = data change, not code change. |
| Data completeness (some samples may have gaps) | `complianceStatus` field + `missingFields` array explicitly flags incomplete records |
| Performance on large orchards (many samples) | Views are indexed, queries scoped to single KPIN + season. Bounded result sets. |

---


## Feature 4: SSP/TSP Performance Analytics

### What Is It

A set of SQL views and Power BI datasets that surface service provider performance metrics: how fast SSPs collect samples, how fast TSPs return test results, error rates, geographic coverage gaps, and workload distribution. The data already exists in MCS (every state transition is timestamped). This feature simply makes it visible and measurable.

**Important governance note:** Spark NZ builds the data pipeline only. Zespri owns the Power BI workspace, defines all KPIs, sets performance thresholds, and controls who sees the dashboards. This separation exists because Spark NZ may have subcontractors operating as SSPs/TSPs, creating a potential conflict of interest.

### What Are SSPs and TSPs?

- **SSP (Sampling Service Provider):** Companies contracted to physically collect fruit samples from orchards. They visit the orchard, pick the designated fruit, label it, and transport it to a testing lab. During peak harvest, SSPs are managing hundreds of sample collections per day across geographic regions.

- **TSP (Testing Service Provider):** Laboratories that receive collected samples and perform destructive testing (cutting fruit, measuring dry matter, Brix, pressure, colour). They enter results into MCS, which triggers the Calc Engine to determine clearance.

**Why performance matters:** The speed of the SSP→TSP→Result pipeline directly determines how quickly growers can harvest. A slow SSP means fruit sits on the vine past optimal maturity. A slow TSP means growers wait days for clearance. During the 6-8 week harvest window, every day of delay costs real money.

### Why It Matters for Zespri

**Current state:**
- MCS tracks every state transition with timestamps (Assigned → Collected → ChangeCustody → LoggedIn → Tested → Released)
- But nobody is measuring the time between transitions
- No visibility into which providers are fast vs slow
- No data to support allocation decisions during peak season
- Power BI is already embedded in MCS (infrastructure exists)

**Business impact:**
- Identify bottleneck providers during peak harvest (redirect workload before it's too late)
- Data-driven SSP/TSP allocation (assign more work to faster providers)
- Hold providers accountable with objective metrics (not anecdotes)
- Detect geographic coverage gaps (regions where samples take longer)
- Feed into future AI-powered allocation optimizer
- ROI ~20:1 (cheapest feature, highest operational leverage)

### How It Works (Technical)

**Architecture: SQL views → Power BI datasets (Spark builds pipes, Zespri controls dashboards)**

```
┌─────────────────────────────────────────────────┐
│         SQL Views (NEW - built by Spark)          │
│                                                   │
│  vw_SSPPerformance                               │
│  - Time: Assigned → Collected (collection speed) │
│  - Volume: samples collected per day/week        │
│  - Geography: performance by region              │
│  - Errors: compromised samples, missed pickups   │
│                                                   │
│  vw_TSPPerformance                               │
│  - Time: LoggedIn → Tested (testing speed)       │
│  - Volume: tests completed per day/week          │
│  - Accuracy: results requiring re-test           │
│  - Backlog: samples waiting > 24h               │
│                                                   │
│  vw_AllocationEfficiency                         │
│  - End-to-end: Assigned → Released (total cycle) │
│  - By region, variety, provider combination      │
│  - Peak vs off-peak comparison                   │
│  - Workload distribution (even vs skewed)        │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│    Power BI Dataset (Zespri-owned workspace)      │
│                                                   │
│  Scheduled refresh: every 4 hours during harvest │
│  Access: Zespri operations team only             │
│  Thresholds: defined in ZespriKPIThreshold table │
│                                                   │
│  Dashboards (built by Zespri data team):         │
│  - Provider Scorecard                            │
│  - Regional Coverage Map                         │
│  - Harvest Season Pipeline                       │
│  - Workload Distribution                         │
└─────────────────────────────────────────────────┘
```

**Governance architecture (conflict of interest mitigation):**

```
┌─────────────────────────────────────────────────────────────┐
│                    SEPARATION OF DUTIES                       │
│                                                               │
│  SPARK NZ (builder):              ZESPRI (owner):            │
│  ─────────────────                ────────────────           │
│  • Writes SQL views               • Defines KPIs             │
│  • Builds dataset refresh          • Sets thresholds         │
│  • Maintains data pipeline         • Owns Power BI workspace │
│  • Zero access to dashboards       • Controls who sees what  │
│  • Zero input on thresholds        • Interprets results      │
│  • Formula logic is versioned      • Makes allocation calls  │
│    (immutable-append)              • Audits formula versions  │
│                                                               │
│  RAW DATA EXPORT: Zespri can always pull raw data and        │
│  verify independently. No single-gatekeeper risk.            │
└─────────────────────────────────────────────────────────────┘
```

**KPI Threshold table (Zespri-owned, audit-trailed):**

```sql
-- [dbo].[ZespriKPIThreshold] - Zespri admin only, audit-trailed
CREATE TABLE ZespriKPIThreshold (
    ThresholdId INT IDENTITY PRIMARY KEY,
    MetricName NVARCHAR(100),          -- 'SSP_CollectionTime_Hours'
    TargetValue DECIMAL(10,2),         -- 24.0
    WarningValue DECIMAL(10,2),        -- 36.0
    CriticalValue DECIMAL(10,2),       -- 48.0
    Season NVARCHAR(10),               -- '2026'
    Region NVARCHAR(100) NULL,         -- NULL = all regions
    SetBy NVARCHAR(100),               -- 'J.Smith@zespri.com'
    SetDate DATETIME2,
    Notes NVARCHAR(500)
)
```

**Formula versioning (immutable-append):**

Every calculation formula is version-controlled. Historical versions cannot be edited, only superseded:

```sql
-- [dbo].[AnalyticsFormulaVersion] - write-once semantics
CREATE TABLE AnalyticsFormulaVersion (
    VersionId INT IDENTITY PRIMARY KEY,
    FormulaName NVARCHAR(100),         -- 'SSP_CollectionSpeed'
    VersionNumber INT,                  -- Monotonically increasing
    Definition NVARCHAR(MAX),           -- SQL or DAX formula text
    CreatedBy NVARCHAR(100),
    CreatedDate DATETIME2,
    SupersededDate DATETIME2 NULL,      -- NULL = current version
    ChangeReason NVARCHAR(500)
    -- NO UPDATE trigger: rows are immutable once created
)
```

**Metrics produced:**

| Metric | Calculation | Unit |
|--------|-------------|------|
| Collection Speed | Avg time from Assigned → Collected | Hours |
| Testing Speed | Avg time from LoggedIn → Tested | Hours |
| End-to-End Cycle | Avg time from Assigned → Released | Hours |
| Daily Throughput | Samples processed per provider per day | Count |
| Error Rate | Compromised samples / total samples | Percentage |
| Coverage Gap | Regions with >48h avg collection time | Geographic |
| Workload Skew | Std deviation of samples across providers | Index |
| Backlog Risk | Samples waiting >24h at any stage | Count |

### Scope and Estimate

| Deliverable | Duration |
|-------------|----------|
| SQL views (3 views: SSP performance, TSP performance, allocation efficiency) | 3 days |
| KPI threshold table + formula versioning tables | 1 day |
| Power BI dataset configuration + scheduled refresh | 2 days |
| Raw data export endpoint (for independent verification) | 1 day |
| Documentation (governance model, formula definitions) | 1 day |
| Testing + validation against known data | 2 days |
| **Total** | **2 weeks** |

**Estimate: 2 weeks / $25-35K NZD**

### Prerequisites

- Zespri defines KPIs and acceptable thresholds (not Spark)
- Zespri legal signs off on separation-of-duties governance document
- Zespri data team available to build Power BI dashboards (Spark provides dataset only)
- Confirm Power BI workspace exists and Spark has dataset-publish permissions

### Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Conflict of interest (Spark grading peers) | Strict separation: Spark builds pipes, Zespri owns interpretation. Raw export for independent verification. |
| Gaming metrics (providers optimizing for speed over quality) | Multiple metrics (speed + accuracy + error rate). Gaming one degrades another. |
| Historical formula manipulation | Immutable-append versioning. Write-once semantics. Audit trail. |
| Information asymmetry (Zespri relies on Spark for recommendations) | Configuration-as-data: thresholds in Zespri-owned table. Spark = formula executor only. |

---

## Implementation Roadmap

### Recommended Sequence

```
Week 1-2:   Traceability & Compliance (quick win, immediate regulatory value)
Week 1-2:   SSP/TSP Analytics (parallel, independent work)
Week 3-6:   NIR Integration (schema + endpoint + adapter)
Week 7-12:  Grower Portal (triggered by support volume threshold)
```

**Why this order:**
1. **Traceability + Analytics first** (weeks 1-2): Both are 2-week efforts, can run in parallel, deliver immediate value, and require no new infrastructure. Pure SQL + Azure Functions.
2. **NIR second** (weeks 3-6): Requires Zespri science team input on schema. Start after traceability/analytics ship (team bandwidth).
3. **Grower Portal last** (weeks 7-12): Largest scope, requires B2C setup, and has an explicit trigger condition. May not activate until next harvest season.

### Parallel Execution Opportunity

Traceability and Analytics are fully independent (different SQL views, different endpoints, different consumers). They can be built simultaneously by different developers if team capacity allows, compressing the timeline:

```
Parallel track:
  Week 1-2: Traceability (Dev A) + Analytics (Dev B)
  Week 3-6: NIR Integration (Dev A + B)
  Week 7-12: Grower Portal (full team)

Total elapsed: 12 weeks (vs 14 sequential)
```

---

## Investment Summary

| Feature | Duration | Cost (NZD) | ROI Signal | Risk Level |
|---------|----------|------------|------------|------------|
| Traceability & Compliance | 2 weeks | $25-35K | Market access protection ($100M+) | Low |
| SSP/TSP Analytics | 2 weeks | $25-35K | Operational efficiency (20:1) | Low |
| NIR Integration | 4 weeks | $50-75K | Future-proofs testing ($400M accuracy) | Medium |
| Grower Portal | 6 weeks | $75-100K | Support cost reduction (60-80%) | Medium |
| **Total** | **14 weeks** | **$175-245K** | **Protecting $5.9B revenue** | |

**Cost context:** $175-245K represents 0.003% of Zespri's $5.9B revenue, protecting operations that calculate $400M in grower bonuses and maintain market access worth $100M+.

---

## What Was Rejected (and Alternatives)

| Rejected Idea | Why | Alternative |
|---------------|-----|-------------|
| Weather/Climate Integration | HortPlus MetWatch already serves NZ kiwifruit industry. Not Spark's domain. | Procurement: buy MetWatch API subscription. If correlation with maturity data needed later, it's a 2-week integration, not a 6-8 week build. |
| IoT Orchard Sensors | Mature products exist (CropX, Sensoterra, Harvest Electronics). Spark has zero IoT expertise. $10M+ true cost including hardware. | Procurement: evaluate existing sensor platforms. If MCS integration needed, it's a vendor API pull (2 weeks), not a sensor platform build. |
| Multi-Country Supply Chain | Cannot internationalize a condemned foundation. Different countries = different regulations, languages, testing standards. 16-20 week estimate is fantasy. | Prerequisite: fix platform foundation first (tech debt remediation). Revisit multi-country in 12-18 months after CI, tests, and service extraction are complete. |

---

## Appendix: Validation Process

This proposal was validated through a structured adversarial review (Deathmatch protocol):

1. **Round 1 (Attack):** All 7 ideas challenged on feasibility, authority, demand, maintenance burden, tech debt risk, simpler alternatives, and harvest-season failure modes
2. **Round 2 (Defense):** Architect, Cost Analyst, and User Advocate defended surviving ideas with specific technical mitigations, business cases, and user impact data
3. **Round 3 (Verdict):** 3 ideas killed unanimously, 2 confirmed survivors, 2 wounded
4. **Round 4 (Redemption):** Wounded ideas presented new arguments addressing specific gaps
5. **Round 5 (Final):** All 4 surviving ideas confirmed. No late wounds discovered.

**Key architectural principle across all survivors:** Every feature bypasses the condemned MCS codebase entirely. All read from/write to the database directly, with zero coupling to the 133KB god class or deprecated Azure Functions layer. Foundation remediation is a separate workstream.
