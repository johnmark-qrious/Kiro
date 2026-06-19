---
status: draft
priority: 4
wave: 3
cooperation_probability: 60%
estimate: 2 weeks / $25-35K NZD
gate: Provider co-design workshop must happen before build
---

# Idea D: SSP/TSP Performance Analytics

## Executive Summary

Operational visibility into the sampling and testing pipeline. SQL views expose provider performance metrics. Zespri builds Power BI dashboards on top. Providers see their own data. Zespri sees aggregate patterns for allocation decisions.

**Critical constraint:** Metrics MUST be co-designed with SSPs and TSPs. Imposing metrics without provider input will trigger collective resistance.

## Problem Statement

- No visibility into SSP/TSP operational performance
- Bottlenecks during peak harvest are discovered reactively (when growers complain)
- Allocation decisions for next season are based on gut feel, not data
- No way to identify which providers are consistently fast/slow/accurate
- Workload distribution is uneven but unmeasured

## Business Case

| Metric | Value |
|--------|-------|
| SSPs in NZ | ~10-15 providers |
| TSPs (labs) | ~5-8 providers |
| Peak season bottleneck cost | Unknown (this feature measures it) |
| Allocation improvement potential | 10-20% faster end-to-end cycle (hypothesis) |
| Build cost | $25-35K NZD |

## Requirements

### Functional

1. **SQL Views (Spark builds)**
   - SSP Performance: avg collection speed (Assigned to Collected), daily throughput, error rate (compromised samples)
   - TSP Performance: avg testing speed (LoggedIn to Tested), daily throughput, error rate
   - Allocation Efficiency: end-to-end cycle time, regional coverage gaps, workload distribution

2. **KPI Threshold Table (Zespri owns)**
   - Zespri admin defines target/warning/critical thresholds per metric
   - Thresholds can vary by season, region
   - Audit-trailed (who set what, when)

3. **Formula Versioning (immutable)**
   - Every calculation formula is version-controlled
   - Historical versions cannot be edited, only superseded
   - Enables: "what formula was active when this metric was calculated?"

4. **Provider Self-Service (each provider sees own data)**
   - SSP sees: their collection speed, throughput, comparison to anonymous average
   - TSP sees: their testing speed, throughput, comparison to anonymous average
   - No provider sees another provider's named data

5. **Zespri Ops Dashboard (aggregate)**
   - Regional heatmap: where are bottlenecks?
   - Provider scorecard: who's meeting targets?
   - Workload distribution: is allocation balanced?
   - Trend over season: are things getting better or worse?

6. **Raw Data Export**
   - Zespri can always pull raw data and verify independently
   - No single-gatekeeper risk (Spark builds views, Zespri owns interpretation)

### Non-Functional

- Views refresh every 4 hours during harvest season
- Dashboard accessible to Zespri ops team only (not providers, not growers)
- Provider self-service scoped by provider ID in auth token
- Formula versioning is append-only (write-once semantics)

## Technical Design

### Governance Architecture (Conflict of Interest Mitigation)

```
+-------------------------------------------------------------+
|  SEPARATION OF DUTIES                                        |
|                                                              |
|  SPARK NZ (builder):          ZESPRI (owner):                |
|  - Writes SQL views           - Defines KPIs                 |
|  - Builds dataset refresh     - Sets thresholds              |
|  - Maintains data pipeline    - Owns Power BI workspace      |
|  - Zero access to dashboards  - Controls who sees what       |
|  - Zero input on thresholds   - Interprets results           |
|  - Formula logic is versioned - Makes allocation calls       |
|    (immutable-append)         - Audits formula versions       |
|                                                              |
|  RAW DATA EXPORT: Zespri can always pull raw data and        |
|  verify independently. No single-gatekeeper risk.            |
+-------------------------------------------------------------+
```

### Database Objects

```sql
-- Metrics produced by SQL views
CREATE VIEW vw_SSPPerformance AS
SELECT
  SSPId,
  Season,
  Region,
  AVG(DATEDIFF(HOUR, AssignedDate, CollectedDate)) AS AvgCollectionHours,
  COUNT(*) AS SamplesProcessed,
  SUM(CASE WHEN FinalState IN (10,11) THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS ErrorRate
FROM SampleRequest
GROUP BY SSPId, Season, Region;

-- Zespri-owned thresholds (audit-trailed)
CREATE TABLE ZespriKPIThreshold (
  ThresholdId INT IDENTITY PRIMARY KEY,
  MetricName NVARCHAR(100),
  TargetValue DECIMAL(10,2),
  WarningValue DECIMAL(10,2),
  CriticalValue DECIMAL(10,2),
  Season NVARCHAR(10),
  Region NVARCHAR(100) NULL,
  SetBy NVARCHAR(100),
  SetDate DATETIME2,
  Notes NVARCHAR(500)
);

-- Formula versioning (immutable-append)
CREATE TABLE AnalyticsFormulaVersion (
  VersionId INT IDENTITY PRIMARY KEY,
  FormulaName NVARCHAR(100),
  VersionNumber INT,
  Definition NVARCHAR(MAX),
  CreatedBy NVARCHAR(100),
  CreatedDate DATETIME2,
  SupersededDate DATETIME2 NULL,
  ChangeReason NVARCHAR(500)
  -- NO UPDATE trigger: rows are immutable once created
);
```

### Metrics Produced

| Metric | Calculation | Unit |
|--------|-------------|------|
| Collection Speed | Avg time from Assigned to Collected | Hours |
| Testing Speed | Avg time from LoggedIn to Tested | Hours |
| End-to-End Cycle | Avg time from Assigned to Released | Hours |
| Daily Throughput | Samples processed per provider per day | Count |
| Error Rate | Compromised samples / total samples | Percentage |
| Coverage Gap | Regions with >48h avg collection time | Geographic |
| Workload Skew | Std deviation of samples across providers | Index |
| Backlog Risk | Samples waiting >24h at any stage | Count |

## Cost Estimate

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Provider co-design workshop | Facilitate metric definition with SSPs/TSPs | 2 days | $3K |
| SQL views (3 views) | SSP performance, TSP performance, allocation efficiency | 3 days | $5K |
| KPI threshold + formula versioning tables | Schema + admin UI for Zespri | 1 day | $2K |
| Power BI dataset configuration | Scheduled refresh, data model | 2 days | $3K |
| Provider self-service endpoint | API returning own-provider metrics | 2 days | $3K |
| Raw data export endpoint | For independent verification | 1 day | $2K |
| Documentation | Governance model, formula definitions, metric methodology | 1 day | $2K |
| Testing + validation | Verify against known data, edge cases | 2 days | $3K |
| **Total** | | **2 weeks** | **$23K** |

## Validation & Testing

### Acceptance Criteria

- [ ] SQL views produce correct metrics (validated against manual calculation on sample data)
- [ ] Providers can only see their own data (auth scoping verified)
- [ ] Zespri can see all providers in aggregate
- [ ] KPI thresholds are audit-trailed (who set what, when)
- [ ] Formula versions are immutable (UPDATE rejected)
- [ ] Raw data export matches view calculations
- [ ] Refresh completes within 15 minutes for full season data

### How to Validate

1. **Co-design workshop:** Run with 2-3 willing SSPs/TSPs. Agree on metrics before any code.
2. **Manual verification:** Calculate metrics by hand for 100 sample requests. Compare to view output.
3. **Auth test:** Log in as SSP-A. Confirm SSP-B data is invisible.
4. **Immutability test:** Attempt UPDATE on AnalyticsFormulaVersion. Confirm rejection.

### Kill Conditions

- SSPs/TSPs collectively refuse to participate in co-design
- Zespri won't involve providers (imposes metrics unilaterally - we warn but build anyway, accepting risk)
- Zespri already has adequate metrics in spreadsheets and doesn't want automation
- Legal/contractual issues with measuring provider performance

## Stakeholder Sign-off Required

- [ ] Zespri Ops - confirms value of visibility
- [ ] SSP representatives - co-design participation
- [ ] TSP representatives - co-design participation
- [ ] Zespri Legal/Procurement - confirms no contractual conflict
- [ ] Zespri Finance - budget approval

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Providers resist being measured | High | High | Co-design is mandatory. Frame as self-service visibility, not surveillance. |
| Providers game the metrics | Medium | Medium | Multiple metrics (speed + accuracy + throughput). Quarterly review. |
| Contractual conflict | Medium | High | Legal review before launch. Metrics are informational, not contractual penalties. |
| Zespri uses metrics punitively | Low | High | Governance doc explicitly states: metrics inform decisions, not automate them. |
| Data quality issues in state timestamps | Low | Medium | Validate timestamp reliability before building views. |
