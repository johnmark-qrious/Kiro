---
status: draft
priority: 3
wave: 2
cooperation_probability: 70%
estimate: 4-6 weeks / $50-75K NZD
gate: DM data quality confirmation + backtest accuracy <= +/-3 days
---

# Idea C: Scheduling Intelligence (Harvest Window Forecasting)

## Executive Summary

Use historical DM (Dry Matter) data to predict when orchard blocks will approach clearance thresholds. Use predictions to schedule SSP visits at the optimal time - reducing wasted trips to immature blocks and accelerating the clearance pipeline.

**This is a SCHEDULING tool, not a CLEARANCE tool.** Lab testing remains the clearance authority. This tells ops WHEN to send the SSP, not WHETHER fruit is cleared.

## Problem Statement

- SSPs visit blocks on fixed schedules, not based on maturity readiness
- Many visits result in "too early" - fruit hasn't reached DM threshold yet
- Each wasted visit costs: SSP time + transport + lab processing of immature sample
- During peak harvest, scheduling bottlenecks delay clearance by days
- Experienced Zespri ops staff intuitively know which blocks clear early/late, but this knowledge isn't systematized and doesn't scale to 5,000+ blocks

## Business Case

| Metric | Value |
|--------|-------|
| Estimated wasted SSP visits per season | 15-25% of total visits (hypothesis - needs validation) |
| Cost per SSP visit | $50-100 NZD (travel + collection + lab processing) |
| Total visits per season | ~10,000+ (estimated from 100+ tests/day x 60 days) |
| Potential savings (15% reduction in wasted visits) | $75-150K NZD/season |
| Build cost | $50-75K NZD |
| Payback period | < 1 season (if hypothesis holds) |

## Prerequisites (Gates Before Build)

### Gate 1: Data Quality Confirmation

Questions for Zespri data team (already drafted):
1. How many seasons of DM data per block?
2. Sampling frequency (weekly/fortnightly/patchy)?
3. Are clearance dates reliable as ground truth (lag from admin/lab turnaround)?
4. Sparse/dodgy blocks or regions to exclude?
5. Storage quirks (nulls, corrections, duplicates, method changes across seasons)?

**Kill condition:** < 2 seasons of consistent data per block, or sampling too sparse for time-series modeling.

### Gate 2: Backtest Accuracy

- Run model on historical data (train on seasons 1-N, predict season N+1)
- Target: predict clearance window within +/-3 days at 10-day horizon
- Dead cost if fails: ~$5K NZD (data analysis + model development time)

**Kill condition:** Accuracy worse than +/-3 days. No escalation - walk away.

### Gate 3: Science Team Endorsement

- Present methodology to Science Team
- Explicit framing: "scheduling advisory, not clearance prediction"
- Science Team must approve the language used in any grower-facing output

**Kill condition:** Science Team vetoes. No escalation possible.

## Requirements

### Functional

1. **Block Maturity Trajectory**
   - For each block: current DM reading + predicted DM progression over next 14 days
   - Confidence interval shown (not a single point estimate)
   - Updated after each new DM reading

2. **Predicted Clearance Window**
   - Per block: "Expected to reach clearance threshold between [date] and [date]"
   - Based on: historical DM trajectory for this block/variety/region + current season readings + weather
   - Clearly labeled as ESTIMATE with confidence level

3. **Scheduling Recommendations**
   - "These 50 blocks are predicted to reach threshold in the next 5 days - prioritize SSP visits"
   - "These 200 blocks are 10+ days away - deprioritize"
   - Ops team uses this to allocate SSP work orders

4. **Model Performance Dashboard (internal)**
   - Predicted vs actual clearance dates (running accuracy)
   - Model confidence calibration (are 80% confidence intervals actually right 80% of the time?)
   - Blocks where model is consistently wrong (flag for investigation)

5. **Grower Advisory (optional, depends on legal approval)**
   - "Your block [X] is tracking toward clearance around [date range]"
   - Heavy disclaimers: "This is an estimate based on historical patterns. Actual clearance requires lab testing."

### Non-Functional

- Predictions update daily (overnight batch, not real-time)
- Model retrains weekly with new data
- Explainable model (feature importance visible to Science Team)
- No dependency on external APIs for core predictions (weather is enhancement, not requirement)

## Technical Design

### Architecture

```
+---------------------------------------------------+
|  MCS Database (existing)                          |
|  Historical DM readings per block/variety/season   |
|  Clearance dates (ground truth)                    |
+----------------------------+----------------------+
                             |
                    Nightly data extract
                             |
                             v
+---------------------------------------------------+
|  Prediction Service (NEW)                         |
|  Python | Azure Function (timer-triggered)         |
|                                                   |
|  1. Extract latest DM readings                     |
|  2. Run model per block                            |
|  3. Generate predictions                           |
|  4. Write to [dbo].[BlockPrediction] table         |
+---------------------------------------------------+
                             |
                             v
+---------------------------------------------------+
|  [dbo].[BlockPrediction]                          |
|                                                   |
|  BlockId INT                                       |
|  PredictionDate DATE                               |
|  PredictedClearanceStart DATE                      |
|  PredictedClearanceEnd DATE                        |
|  ConfidenceLevel DECIMAL (0-1)                     |
|  ModelVersion NVARCHAR(50)                         |
|  Features NVARCHAR(MAX) -- JSON of input features  |
|  CreatedDate DATETIME2                             |
+---------------------------------------------------+
                             |
                             v
+---------------------------------------------------+
|  MCS UI (existing) - New "Scheduling" tab         |
|  Shows predictions to Zespri Ops team              |
|  Sortable by predicted clearance date              |
|  Filterable by region, variety, confidence          |
+---------------------------------------------------+
```

### Model Approach

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Algorithm | Gradient Boosting (LightGBM) | Explainable, handles tabular data well, fast training |
| Features | Historical DM trajectory, variety, region, GDD (growing degree days), days since flowering, previous season clearance date | All available in MCS |
| Target | Days until clearance threshold reached | Regression problem |
| Training | Leave-one-season-out cross-validation | Prevents data leakage |
| Retraining | Weekly (incorporates new readings) | Predictions improve as season progresses |
| Fallback | If model confidence < 50%, show "insufficient data" instead of prediction | Prevents misleading low-confidence predictions |

### Weather Enhancement (Phase 2, optional)

- Integrate NIWA weather API (temperature, rainfall, GDD)
- Adds ~5-10% accuracy improvement based on literature
- Not required for MVP - historical patterns alone may achieve +/-3 days

## Cost Estimate

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Data extraction + exploration | Pull historical DM data, assess quality, feature engineering | 1 week | $12K |
| Model development + backtest | Train model, cross-validate, measure accuracy | 1.5 weeks | $18K |
| Prediction service | Azure Function, nightly batch, write to DB | 1 week | $12K |
| UI integration | Scheduling tab in MCS, ops dashboard | 1 week | $12K |
| Grower advisory (if legal approves) | Notification integration, disclaimer language | 0.5 weeks | $6K |
| Testing + Science Team review | Validate predictions, present methodology | 0.5 weeks | $6K |
| **Total** | | **5.5 weeks** | **$66K** |

### Dead Cost (if gates fail)

| Gate | Dead Cost |
|------|-----------|
| Data quality fails | $0 (question costs nothing to ask) |
| Backtest fails | ~$5K (1.5 weeks of data + model work) |
| Science Team vetoes | ~$5K (same - work already done) |

## Validation & Testing

### Acceptance Criteria

- [ ] Backtest accuracy: +/-3 days at 10-day horizon (median absolute error)
- [ ] Predictions generated nightly for all active blocks
- [ ] Confidence intervals are calibrated (80% CI contains actual 80% of the time)
- [ ] Ops team can sort/filter blocks by predicted clearance date
- [ ] Model feature importance is visible and explainable
- [ ] Science Team has reviewed and approved methodology
- [ ] Predictions clearly labeled as estimates (not guarantees)

### How to Validate

1. **Backtest (pre-build gate):** Train on seasons 1-N, predict season N+1. Measure MAE.
2. **Shadow mode (first 2 weeks of season):** Run predictions alongside normal operations. Don't act on them. Compare predicted vs actual.
3. **Pilot (next 2 weeks):** Use predictions to schedule 50 blocks. Measure: did wasted visits decrease?
4. **Full deployment:** If pilot succeeds, expand to all blocks.

### Kill Conditions

- Data quality insufficient (< 2 seasons, too sparse)
- Backtest accuracy > +/-3 days (model doesn't work)
- Science Team vetoes (no escalation)
- Legal blocks grower-facing predictions AND ops team doesn't value internal-only tool
- ROI unclear (wasted visit rate is actually low)

## Stakeholder Sign-off Required

- [ ] Zespri Data Team - data quality confirmation
- [ ] Zespri Science Team - methodology approval
- [ ] Zespri Ops - confirms scheduling value
- [ ] Zespri Legal - approves grower-facing language (if applicable)
- [ ] Zespri Finance - budget approval

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data too sparse for modeling | Medium | Fatal | Gate 1 answers this before any spend |
| Model accuracy insufficient | Medium | Fatal | Gate 2 ($5K dead cost, acceptable) |
| Science Team rejects | Medium | Fatal | Frame as scheduling, not clearance. Involve early. |
| Growers treat estimates as guarantees | Medium | High | Aggressive disclaimers. Confidence intervals. Terms of use. |
| Model degrades in unusual seasons | Low | Medium | Weekly retraining. Confidence drops trigger "insufficient data" fallback. |
| Weather data improves accuracy but adds API dependency | Low | Low | Weather is Phase 2 enhancement, not core requirement. |
