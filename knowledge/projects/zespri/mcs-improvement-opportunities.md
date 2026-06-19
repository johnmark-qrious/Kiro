---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-27T11:14:00+12:00
lastPublished:
---

# Zespri MCS — Improvement & AI Opportunities

## System Improvement Opportunities

### Immediate Value (Low Risk, High Impact)

1. **CI Pipeline Modernization** — No evidence of CI, only CD. Add automated API tests on every PR, lint/type-check gates, DB migration validation. 109 tickets shipped in FY26 with manual QA gates — doesn't scale.

2. **Next.js 14 → 15 Upgrade** — App Service migration removed the serverless blocker. Path is clear. Security patches, React 19 support, performance.

3. **Observability Beyond Error Emails** — Current: hourly Logic App error emails (reactive). Need: Application Insights, structured logging, sample throughput dashboards, state machine anomaly alerting. Critical for harvest season peaks.

### Medium-Term Value

4. **Calc Engine Rework** — Acknowledged tech debt (Benet's notes): should check inheritance first, then sample clearance. Incorrect order = incorrect payments.

5. **Admin Configuration UI** — Sizeband/allocation tables currently managed via DB edits or CSV. Proper admin UI reduces error risk and developer dependency.

6. **eAPI Consolidation** — Two hosting models (Function Apps + App Service) = double operational overhead. Plan versioning strategy and migration path with deprecation notices.

### Strategic Value

7. **Real-time State Tracking Dashboard** — Show where every sample is in the pipeline, bottlenecks, SSP/TSP performance. Visibility = money during harvest.

8. **Data Masking Automation** — DB refreshes need masking for non-prod (MCS26-35/48). If not fully automated, it's a compliance risk.

## AI Solutions

### 1. Predictive Maturity Clearance
- **Problem:** Growers wait reactively for test results
- **Solution:** Model trained on historical DM readings + weather + orchard characteristics to predict when fruit will reach maturity thresholds
- **Impact:** Advance notice for harvest crew scheduling. Years of data already in MCS.
- **Effort:** Medium (data science needed)
- **Differentiator:** Transforms Spark's offering — "we tell you when fruit *will be* ready"

### 2. Anomaly Detection on Test Results
- **Problem:** 100+ tests/day, bad data (lab errors, compromised samples) can slip through
- **Solution:** Flag statistically anomalous results in real-time — outlier DM readings, unusual patterns for variety/region/season
- **Impact:** Catches errors before they propagate to SAP payments
- **Effort:** Low-Medium (classic anomaly detection on structured data)
- **Quick win:** ✅

### 3. Intelligent Sample Allocation
- **Problem:** Manual SSP/TSP allocation, uneven workload during peak season
- **Solution:** Dynamic optimization based on workload, proximity, turnaround times, priority
- **Impact:** Faster sample-to-result cycle = earlier clearance = more grower revenue
- **Effort:** Medium (optimization with constraints)

### 4. AI-Powered Support / Knowledge Assistant
- **Problem:** 5,000 users, support spikes during harvest, tribal knowledge in Confluence
- **Solution:** RAG chatbot trained on MCS KB, role-based rules, troubleshooting flows, state machine logic
- **Impact:** Deflects Tier 1 queries, instant answers for growers/packhouse users
- **Effort:** Low (standard RAG, content already exists)
- **Quick win:** ✅

### 5. Calc Engine Rule Suggestion
- **Problem:** Clearance criteria change each season, currently manual configuration
- **Solution:** Analyze historical clearance outcomes vs market quality to suggest optimal thresholds
- **Impact:** Data-driven criteria setting, direct revenue impact
- **Effort:** High (needs market quality feedback data, may not be in MCS)

### 6. Document/CSV Validation
- **Problem:** Bulk CSV uploads can have errors causing downstream issues
- **Solution:** Pre-validation layer detecting typos, duplicates, geographic inconsistencies, with natural language explanations
- **Impact:** Reduces data quality defects
- **Effort:** Low-Medium
- **Quick win:** ✅

## Deathmatch Survivors (May 2026)

Ideas validated through adversarial review. Both carry mandatory gates before build.

### 7. Pre-submission Export Readiness Checking (India)
- **Problem:** India FTA removes 33% tariff, creating new export volume. India has specific DPPQS/FSSAI phytosanitary requirements. Compliance team may be bottlenecked preparing MPI submissions for a market they haven't served at scale.
- **Solution:** Extend existing Traceability feature with configurable compliance checklists. Decision-support tool: "Does this consignment meet India requirements BEFORE we submit to MPI?" Spark owns platform, Zespri owns regulatory content (CMS pattern).
- **Impact:** Reduces rework on MPI submissions, accelerates time-to-export for India market
- **Effort:** Low (1 week add-on to Traceability feature, IF base feature is built)
- **Gate:** Discovery sprint (2 weeks). Measure mean-time-from-harvest-to-MPI-submission. If <48hrs already, kill. If >1 week with compliance as bottleneck, build.
- **Status:** AWAITING VALIDATION
- **Source:** Corporate intel (CEO Jason Te Brake, NZ Herald May 2026) + deathmatch 2026-05-27

### 8. Harvest Window Forecasting (Per-Block Clearance Prediction)
- **Problem:** Nobody gives individual growers a per-block prediction of when their fruit will clear. Zespri ops/logistics need per-block harvest timing for packhouse scheduling, cool-store allocation, shipping slot planning.
- **Solution:** Statistical curve-fitting model (logistic growth, quantile regression) on historical DM trajectories per block/variety/region. Predicts clearance date from partial-season readings. Runs as scheduled batch job inside MCS, updates as new readings arrive.
- **Impact:** Transforms MCS from compliance/recording tool into predictive tool. Grower-facing visibility + ops-facing logistics planning.
- **Effort:** Medium (statistical model, not ML platform. No GPU, no drift detection.)
- **Gate:** Backtest on 2 seasons of historical DM data. Must achieve ±3 days accuracy at 10-day horizon per-block. 4-week timebox, ~$5K dead cost if fails.
- **Status:** AWAITING VALIDATION
- **Customer:** Zespri ops/logistics (primary), growers (secondary)
- **Source:** Corporate intel (220.9M trays record harvest) + deathmatch 2026-05-27

### Killed Ideas (May 2026 Deathmatch)

| Idea | Verdict | Reason |
|------|---------|--------|
| International Grower Visibility | DEAD | Rejected Multi-Country scope in disguise. Data doesn't exist in MCS. Spark has no authority. |
| Yield Forecasting (original) | DEAD | MCS has maturity data, not yield data. Wrong premise. Pivoted to Harvest Window above. |
| ServiceNow Integration | DEAD | Already separate. Ugly incident tool. No value integrating into MCS. |

## Priority Matrix

| # | Solution | Effort | Impact | Quick Win |
|---|----------|--------|--------|-----------|
| 1 | Anomaly Detection | Low | High (prevents payment errors) | ✅ |
| 2 | Support Knowledge Assistant | Low | Medium (reduces support load) | ✅ |
| 3 | CSV Validation | Low-Med | Medium (data quality) | ✅ |
| 4 | Predictive Maturity | Medium | Very High (business transformation) | ❌ |
| 5 | Intelligent Allocation | Medium | High (operational efficiency) | ❌ |
| 6 | Calc Engine Rules | High | High (revenue optimization) | ❌ |
| 7 | India Export Readiness | Low | Medium (new market enablement) | ⏳ Gate |
| 8 | Harvest Window Forecasting | Medium | High (predictive differentiation) | ⏳ Gate |
