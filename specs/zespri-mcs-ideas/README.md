---
status: draft
created: 2026-05-31
project: zespri-mcs
type: proposal
---

# Zespri MCS - Improvement Ideas Master Index

## Overview

8 validated improvement ideas for the Zespri Maturity Clearance System, stress-tested through wargame analysis (multi-party incentive mapping, cooperative path design, adversarial attack, and escalation planning).

**Total portfolio value:** $350-550K NZD across all ideas
**Recommended first investment:** $100-135K NZD (Wave 1: Portal + Audit Trail)
**Strategic goal:** Position Spark as Zespri's innovation partner, not just maintenance vendor

## Execution Waves

| Wave | Ideas | Timeline | Investment | Cooperation % | Gate |
|------|-------|----------|-----------|:---:|------|
| **1** | A + B (bundled) | 6 weeks | $100-135K | 90% / 85% | None - propose immediately |
| **2** | C + E (parallel investigation) | 5-6 weeks | $50-75K + $25-35K | 70% / 65% | Data quality + error rate baseline |
| **3** | D (after Wave 1 delivers) | 2 weeks | $25-35K | 60% | Provider co-design workshop |
| **4** | F, G, H (conditional) | 4-8 weeks each | $50-100K each | 55% / 45% / 40% | Contract flexibility, ZAG trials, Idea C success |

## Idea Summary Table

| # | Idea | Spec File | Estimate | Priority | Key Risk |
|---|------|-----------|----------|:---:|----------|
| A | [Grower Self-Service Portal](idea-a-grower-self-service-portal.md) | Complete | 6 weeks / $75-100K | 1 | Zespri uses another vendor |
| B | [Immutable Audit Trail](idea-b-immutable-audit-trail.md) | Complete | 2-3 weeks / $25-35K | 2 | Death by indifference (bundle with A) |
| C | [Scheduling Intelligence](idea-c-scheduling-intelligence.md) | Complete | 4-6 weeks / $50-75K | 3 | Data quality + Science Team veto |
| D | [SSP/TSP Performance Analytics](idea-d-performance-analytics.md) | Complete | 2 weeks / $25-35K | 4 | Provider resistance if not co-designed |
| E | [Anomaly Detection](idea-e-anomaly-detection.md) | Complete | 2-3 weeks / $25-35K | 5 | No baseline error data = no business case |
| F | [Dynamic SSP Allocation](idea-f-dynamic-allocation.md) | Complete | 6-8 weeks / $75-100K | 6 | Contractual rigidity |
| G | [NIR Advisory Data](idea-g-nir-advisory-data.md) | Complete | 4 weeks / $50-75K | 7 | Science Team + Finance double-block |
| H | [Predictive Maturity Model](idea-h-predictive-maturity-model.md) | Complete | 6-8 weeks / $75-100K | 8 | Depends on Idea C success + legal |

## Dependency Map

```
Wave 1 (immediate):
  A (Portal) ─────────────────────────────────> standalone
  B (Audit Trail) ────────────────────────────> bundle with A (+3 days)

Wave 2 (data gates):
  C (Scheduling) ─────────────────────────────> needs: DM data quality
  E (Anomaly Detection) ──────────────────────> needs: error rate baseline

Wave 3 (trust earned):
  D (Performance Analytics) ──────────────────> needs: Wave 1 delivered + provider buy-in

Wave 4 (conditional):
  F (Dynamic Allocation) ─────────────────────> needs: D delivered + contract flexibility
  G (NIR Advisory) ───────────────────────────> needs: ZAG trial data gap confirmed
  H (Predictive Model) ───────────────────────> needs: C succeeded + legal approval

  C ──────> H (H is evolution of C)
  D ──────> F (F needs D's data foundation)
  A ──────> H (H displays in Portal)
```

## Party Alignment Summary

| Party | Aligned With | Conflicted With |
|-------|-------------|-----------------|
| Zespri (client) | All ideas (in principle) | Budget constraints, competing priorities |
| Science Team | B, D, E | C (cautious), G (cautious), H (cautious) |
| SSPs | A, C (better scheduling) | D (being measured), F (reallocation) |
| TSPs | A, B, C | D (being measured), G (existential threat long-term) |
| Growers | A (strong), C, H | None (pure beneficiaries) |
| MPI / Regulators | B (strong) | None |
| Spark (us) | All (revenue) | Risk of over-promising |

## Immediate Next Actions

1. **Propose Wave 1 to Zespri Digital Ops** - Portal + Audit Trail bundled
2. **Send data quality question to Zespri data team** - unlocks/kills Ideas C and H
3. **Ask Zespri: "How many test results corrected per season?"** - unlocks/kills Idea E
4. **Research India/EU compliance requirements** - strengthens Idea B business case

## Walk-Away Thresholds

| Signal | Action |
|--------|--------|
| Zespri explicitly chooses another vendor for innovation | Accept. Focus on maintenance + data investigation (Wave 2). |
| Science Team vetoes all prediction/ML work | Kill C, G, H. Focus on A, B, D, E. |
| Data quality gate fails | Kill C and H permanently. |
| All providers refuse co-design | Kill D and F. |
| Zespri says "MCS is fine as-is" | Deliver Wave 1 (portal). Use as proof of value. Revisit in 6 months. |

## Meta-Strategy

> Prevent Zespri from viewing Spark as "maintenance only" while Accenture/others get the innovation work.

The SAP claims project (Accenture, $70M problem solved) is the warning shot. Wave 1 is our proof point: "We build new things, not just fix old things." Everything after is earned through delivery.

## Cost Summary

| Scenario | Investment | Ideas Delivered |
|----------|-----------|-----------------|
| Minimum (Wave 1 only) | $100-135K | A + B |
| Moderate (Waves 1-3) | $200-280K | A + B + C + D + E |
| Maximum (all waves) | $400-550K | All 8 ideas |
| Dead cost (if all gates fail) | $5-10K | Data analysis only |
