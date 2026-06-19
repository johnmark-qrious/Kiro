---
status: draft
priority: 8
wave: 4
cooperation_probability: 40%
estimate: 6-8 weeks / $75-100K NZD
gate: Idea C must succeed first (shared data gate + backtest)
---

# Idea H: Predictive Maturity Model

## Executive Summary

A full machine learning model that predicts per-block maturity progression and optimal harvest timing. Evolution of Idea C (Scheduling Intelligence) - uses the same data foundation but produces richer, grower-facing predictions with confidence intervals.

**This idea lives or dies with Idea C.** If C's backtest fails, H is dead. If C succeeds, H is the natural "what's next." Don't pursue H independently.

## Problem Statement

- Growers have no advance visibility into when their fruit will be ready
- Harvest crew scheduling is reactive (wait for clearance, then scramble)
- Packhouse capacity planning is guesswork during peak
- Logistics teams can't pre-position resources without clearance predictions
- The entire supply chain operates reactively when it could operate predictively

## Relationship to Idea C

| Aspect | Idea C (Scheduling Intelligence) | Idea H (Predictive Maturity Model) |
|--------|----------------------------------|-------------------------------------|
| Audience | Zespri Ops (internal) | Growers + Ops + Packhouses |
| Output | "Schedule SSP visits here" | "Your block will reach clearance around [date range]" |
| Complexity | Simple heuristic / light model | Full ML with confidence intervals |
| Legal risk | Low (internal scheduling) | High (grower-facing predictions) |
| Prerequisite | Data quality gate | Idea C success + legal approval |
| Value | Operational efficiency | Supply chain transformation |

## Business Case

| Metric | Value |
|--------|-------|
| Growers who could benefit | 2,800+ NZ growers |
| Harvest crew booking lead time needed | 3-7 days |
| Current advance notice of clearance | 0 days (reactive) |
| Value of 5-day advance notice | Better crew scheduling, less overtime, less fruit quality loss |
| Packhouse capacity utilization improvement | 10-20% (hypothesis) |
| Build cost | $75-100K NZD (incremental over Idea C) |

## Prerequisites (Gates Before Build)

### Gate 1: Idea C Succeeds

- Data quality confirmed
- Backtest achieves +/-3 days accuracy
- Science Team approves methodology
- Scheduling intelligence is live and working

**Kill condition:** Idea C fails at any gate.

### Gate 2: Legal Approval for Grower-Facing Predictions

Zespri Legal must approve:
- Language used ("estimated window" not "predicted date")
- Disclaimer framework
- Liability limitation (growers can't claim damages based on predictions)
- Terms of use for prediction feature

**Kill condition:** Legal blocks grower-facing predictions entirely (no escalation).

### Gate 3: Grower Demand Validation

- Survey 50 growers: "Would advance notice of clearance timing (with +/-3 day accuracy) be useful for your harvest planning?"
- Threshold: >70% say yes

**Kill condition:** Growers don't value advance notice (unlikely but possible).

## Requirements

### Functional

1. **Per-Block Maturity Trajectory**
   - Visual: DM progression curve with prediction envelope
   - Shows: current DM, predicted trajectory, clearance threshold line
   - Updates after each new reading (trajectory narrows as more data arrives)

2. **Predicted Clearance Window**
   - Per block: "Expected clearance: May 15-18 (80% confidence)"
   - Confidence interval widens for blocks with less data
   - Clearly labeled as estimate with disclaimer

3. **Harvest Planning Calendar**
   - Grower view: "Your blocks predicted to clear this week / next week / 2+ weeks"
   - Packhouse view: "Expected volume arriving this week by variety"
   - Ops view: "Regional clearance wave prediction"

4. **Model Explainability**
   - For each prediction: "Based on: current DM trajectory (40%), historical pattern for this block (30%), regional average (20%), weather (10%)"
   - Science Team can inspect any prediction's reasoning

5. **Accuracy Tracking**
   - Running comparison: predicted vs actual clearance dates
   - Per-block accuracy history (some blocks are more predictable than others)
   - Seasonal model performance report

6. **Notification System**
   - Grower: "Your block [X] is approaching clearance. Estimated window: [dates]. Consider booking harvest crew."
   - Packhouse: "Expected volume increase in [region] starting [date]."
   - Ops: "Model confidence dropping for [region] - unusual season pattern detected."

### Non-Functional

- Predictions update daily (overnight batch)
- Model retrains weekly with new season data
- Explainable model (no black boxes)
- Graceful degradation: if model confidence < 50%, show "insufficient data" not a bad prediction
- All predictions archived for accuracy analysis

## Technical Design

### Architecture (Extends Idea C)

```
+---------------------------------------------------+
|  Idea C Infrastructure (already built)            |
|  - Data pipeline                                   |
|  - LightGBM model                                  |
|  - BlockPrediction table                           |
|  - Ops dashboard                                   |
+----------------------------+----------------------+
                             |
                    Extended with:
                             |
                             v
+---------------------------------------------------+
|  Enhanced Prediction Service                      |
|                                                   |
|  Additions over Idea C:                            |
|  - Confidence interval calculation                 |
|  - Feature importance per prediction               |
|  - Grower-facing output formatting                 |
|  - Packhouse volume aggregation                    |
|  - Notification triggers                           |
+---------------------------------------------------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
+-------------+  +-----------+  +-----------+
| Grower      |  | Packhouse |  | Ops       |
| Portal      |  | Dashboard |  | Dashboard |
| (Idea A)    |  | (new)     |  | (Idea C)  |
+-------------+  +-----------+  +-----------+
```

### Model Enhancements Over Idea C

| Enhancement | Purpose | Complexity |
|-------------|---------|------------|
| Quantile regression | Produce confidence intervals (not just point estimates) | Medium |
| Per-block calibration | Adjust for blocks that are consistently early/late | Low |
| Weather integration | NIWA API for temperature, rainfall, GDD | Medium |
| Ensemble | Multiple models, weighted by recent accuracy | Medium |
| Anomaly detection | Flag blocks deviating from prediction (trigger re-sample) | Low |

### Confidence Interval Approach

```python
# Quantile regression produces prediction intervals
model_low = LGBMRegressor(objective='quantile', alpha=0.1)   # 10th percentile
model_mid = LGBMRegressor(objective='quantile', alpha=0.5)   # median
model_high = LGBMRegressor(objective='quantile', alpha=0.9)  # 90th percentile

# Output: "Clearance expected between [low] and [high] (80% confidence)"
```

## Cost Estimate (Incremental Over Idea C)

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Confidence intervals | Quantile regression, calibration | 1 week | $12K |
| Feature importance per prediction | SHAP values or similar | 3 days | $5K |
| Grower-facing output | Integration with Portal (Idea A), disclaimers | 1 week | $12K |
| Packhouse volume aggregation | Regional volume predictions | 3 days | $5K |
| Harvest planning calendar | UI for growers, packhouses, ops | 1 week | $12K |
| Notification system | Triggers, templates, delivery | 4 days | $6K |
| Weather integration (NIWA API) | Data pipeline, feature engineering | 4 days | $6K |
| Legal review + disclaimer framework | Work with Zespri Legal | 2 days | $3K |
| Grower validation | Survey + beta testing with 50 growers | 3 days | $5K |
| Accuracy tracking + reporting | Running comparison dashboard | 3 days | $5K |
| **Total (incremental)** | | **6 weeks** | **$71K** |

**Total cost including Idea C foundation:** $66K (C) + $71K (H) = **$137K**

## Validation & Testing

### Acceptance Criteria

- [ ] Confidence intervals are calibrated (80% CI contains actual 80% of the time)
- [ ] Feature importance visible for every prediction
- [ ] Grower-facing output includes clear disclaimers
- [ ] Predictions degrade gracefully (low confidence = "insufficient data")
- [ ] Packhouse volume predictions within +/-20% of actual
- [ ] Notifications fire 5+ days before predicted clearance
- [ ] Legal-approved disclaimer language on all grower-facing outputs
- [ ] Accuracy tracking shows model performance over time

### How to Validate

1. **Idea C must be live and working** (prerequisite)
2. **Legal framework:** Get Zespri Legal sign-off on disclaimer language before any grower-facing work
3. **Grower survey:** Validate demand with 50 growers before building grower-facing features
4. **Beta:** 50 growers receive predictions for 1 season. Measure: did they find it useful? Any complaints?
5. **Accuracy audit:** End-of-season report comparing all predictions to actuals

### Kill Conditions

- Idea C fails (data quality, accuracy, or Science Team veto)
- Legal blocks grower-facing predictions entirely
- Growers don't value advance notice (<70% interest in survey)
- Zespri says "Idea C is enough, we don't need grower-facing predictions"
- Model accuracy degrades when extended to confidence intervals

## Stakeholder Sign-off Required

- [ ] All Idea C stakeholders (prerequisite)
- [ ] Zespri Legal - grower-facing prediction language approved
- [ ] Zespri Grower Relations - confirms grower demand
- [ ] Packhouse representatives - confirms volume prediction value
- [ ] Zespri Finance - budget for incremental build

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Idea C fails (kills H automatically) | Medium | Fatal | Accept. H is conditional on C. |
| Legal blocks grower-facing predictions | Medium | Fatal | Offer ops-internal only (but value drops significantly) |
| Growers misinterpret predictions as guarantees | Medium | High | Aggressive disclaimers, confidence intervals, terms of use |
| Model accuracy varies by region/variety | Medium | Medium | Per-block calibration. Show confidence. Hide low-confidence predictions. |
| Weather API dependency | Low | Low | Weather is enhancement. Core model works without it. |
| Zespri says "C is enough" | High | Scope kill | Accept gracefully. C captured most of the value already. |
