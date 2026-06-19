---
status: draft
priority: 5
wave: 2
cooperation_probability: 65%
estimate: 2-3 weeks / $25-35K NZD
gate: Baseline error rate data needed (how many corrections per season?)
---

# Idea E: Anomaly Detection on Test Results

## Executive Summary

Real-time statistical flagging of outlier DM readings, unusual patterns for variety/region/season, and potential lab errors or compromised samples. Flags go to the Science Team for review. Decision support, not decision making.

**The Science Team owns this.** They define thresholds, review flags, and decide action. The system surfaces candidates for their attention.

## Problem Statement

- 100+ tests/day during harvest season
- Bad data (lab errors, compromised samples, data entry mistakes) can slip through
- Errors propagate to SAP payment calculations ($400M in bonuses)
- Current detection is manual review by Science Team (doesn't scale at peak volume)
- A single miscalculated bonus batch could cost millions in corrections + grower trust

## Business Case

| Metric | Value |
|--------|-------|
| Tests per season | ~6,000+ (100/day x 60 days) |
| Estimated error rate | Unknown (gate: need baseline) |
| Cost of undetected error reaching SAP | $10K-$1M+ depending on scope |
| Historical corrections per season | Unknown (gate: need data) |
| Build cost | $25-35K NZD |
| Break-even | Catching 1-2 significant errors per season |

## Prerequisites (Gates Before Build)

### Gate 1: Baseline Error Data

Ask Zespri: "In the last 3 seasons, how many test results were manually corrected after submission?"

| Answer | Action |
|--------|--------|
| Significant (>2% of results) | Strong business case. Proceed. |
| Low (<0.5%) | Weak business case. Offer free analysis on historical data to find hidden errors. |
| "We don't track" | Offer free analysis. If we find anomalies, business case emerges. |

**Kill condition:** Error rate genuinely low AND free analysis finds nothing.

### Gate 2: Science Team Buy-in

- Science Team must define what "anomalous" means for each variety/region
- They must agree to review flagged results
- They must own the threshold configuration

**Kill condition:** Science Team says "we catch everything already" AND our analysis confirms it.

## Requirements

### Functional

1. **Statistical Anomaly Detection**
   - Z-score analysis: flag results >3 standard deviations from variety/region/season mean
   - Isolation Forest: detect multivariate outliers (DM + Brix + variety + region combined)
   - Temporal anomaly: flag sudden jumps in DM for a block (>3% increase between consecutive tests)
   - Duplicate detection: same DM value submitted for multiple different samples (copy-paste error)

2. **Flag Dashboard (Science Team only)**
   - List of flagged results with reason and severity
   - One-click: "Dismiss" (false positive) or "Investigate" (real concern)
   - Investigation workflow: contact TSP, request retest, or accept with note
   - Dismissal reasons tracked (improves model over time)

3. **Threshold Configuration (Science Team owns)**
   - Per variety: what's the normal DM range at each point in season?
   - Per region: are some regions naturally higher/lower?
   - Adjustable sensitivity: "flag more" vs "flag less" slider
   - Season-specific (thresholds may differ year to year)

4. **TSP Notification (private)**
   - When a flag is confirmed as real error: TSP notified privately
   - No public shaming, no league tables
   - Framed as: "We detected a potential data quality issue. Please verify."

5. **Learning Loop**
   - Dismissed flags feed back into model (reduces false positives over time)
   - Confirmed errors feed back (improves detection)
   - Seasonal recalibration (new season = new baseline)

### Non-Functional

- Detection runs within 5 minutes of result submission
- False positive rate < 20% (Science Team shouldn't be overwhelmed)
- Zero impact on result submission flow (detection is async, post-commit)
- Flags are internal only (growers and providers never see them)

## Technical Design

### Architecture

```
+---------------------------------------------------+
|  MCS eAPI (existing)                              |
|  TSP submits test result                           |
+----------------------------+----------------------+
                             |
                    Result committed to DB
                    Event published
                             |
                             v
+---------------------------------------------------+
|  Anomaly Detection Service (NEW)                  |
|  Azure Function (event-triggered)                  |
|                                                   |
|  1. Receive new test result                        |
|  2. Load historical distribution for              |
|     this variety/region/season                     |
|  3. Run detection algorithms                       |
|  4. If anomalous: write to [dbo].[AnomalyFlag]   |
+---------------------------------------------------+
                             |
                             v
+---------------------------------------------------+
|  [dbo].[AnomalyFlag]                             |
|                                                   |
|  FlagId INT IDENTITY                               |
|  SampleRequestId INT                               |
|  DetectionMethod NVARCHAR(50) -- 'zscore',        |
|    'isolation_forest', 'temporal', 'duplicate'     |
|  Severity NVARCHAR(20) -- 'low', 'medium', 'high' |
|  Reason NVARCHAR(500)                              |
|  Status NVARCHAR(20) -- 'pending', 'dismissed',   |
|    'investigating', 'confirmed'                    |
|  ReviewedBy NVARCHAR(100)                          |
|  ReviewedDate DATETIME2                            |
|  DismissalReason NVARCHAR(500)                     |
|  CreatedDate DATETIME2                             |
+---------------------------------------------------+
                             |
                             v
+---------------------------------------------------+
|  Science Team Dashboard (NEW tab in MCS)          |
|  - Pending flags with severity                     |
|  - One-click dismiss/investigate                   |
|  - Historical flag accuracy stats                  |
+---------------------------------------------------+
```

### Detection Methods

| Method | What It Catches | False Positive Risk |
|--------|----------------|---------------------|
| Z-score (>3 SD) | Extreme outliers for variety/region | Low (3 SD is very conservative) |
| Isolation Forest | Multivariate outliers (unusual combinations) | Medium (needs tuning) |
| Temporal jump | Sudden DM increase between consecutive tests for same block | Low (physics-based: DM doesn't jump 5% in a week) |
| Duplicate value | Same DM submitted for different samples | Very low (almost always an error) |
| Batch anomaly | All results from one TSP on one day are identical or suspiciously similar | Low (indicates equipment/process issue) |

## Cost Estimate

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Historical analysis | Analyze 3 seasons of data, establish baselines, find known errors | 3 days | $5K |
| Detection algorithms | Implement Z-score, isolation forest, temporal, duplicate checks | 4 days | $6K |
| Azure Function service | Event-triggered detection, write flags to DB | 2 days | $3K |
| Flag dashboard | Science Team UI for reviewing/dismissing flags | 3 days | $5K |
| Threshold configuration | Admin UI for Science Team to set sensitivity | 2 days | $3K |
| TSP notification | Private notification workflow | 1 day | $2K |
| Testing + calibration | Tune false positive rate, validate against known errors | 3 days | $5K |
| **Total** | | **2.5 weeks** | **$29K** |

## Validation & Testing

### Acceptance Criteria

- [ ] Detection fires within 5 minutes of result submission
- [ ] Known historical errors (if any) would have been caught by the system
- [ ] False positive rate < 20% (measured over 1 week of shadow mode)
- [ ] Science Team can dismiss/investigate flags in < 30 seconds
- [ ] Dismissed flags reduce future false positives (learning loop works)
- [ ] TSP notifications are private (no other provider can see)
- [ ] Zero impact on result submission latency

### How to Validate

1. **Historical analysis (pre-build):** Run detection on last 3 seasons. How many anomalies found? Cross-reference with known corrections.
2. **Shadow mode (week 1):** Run detection on live data but don't show flags. Measure: how many would have fired? Are they real?
3. **Science Team review (week 2):** Show shadow mode results. Ask: "Would these have been useful?"
4. **Live deployment:** If Science Team says yes, enable flag dashboard.

### Kill Conditions

- Error rate is genuinely low (<0.5%) AND historical analysis finds nothing
- Science Team says "we catch everything already" AND analysis confirms it
- False positive rate can't be reduced below 30% (Science Team overwhelmed by noise)

## Stakeholder Sign-off Required

- [ ] Zespri Science Team - defines thresholds, agrees to review flags
- [ ] Zespri Data Team - provides historical correction data
- [ ] Zespri Finance - budget approval

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No business case (errors are rare) | Medium | Fatal | Gate 1 answers this before spend. Free analysis offered. |
| Science Team doesn't want to review flags | Medium | High | Keep volume low (<5 flags/day). High-severity only. |
| TSPs feel accused | Medium | Medium | Private notifications. Frame as "data quality support" not "error detection." |
| False positives erode trust | Medium | Medium | Conservative thresholds initially. Learning loop reduces over time. |
| Model needs seasonal recalibration | Low | Low | Automatic baseline recalculation at season start. |
