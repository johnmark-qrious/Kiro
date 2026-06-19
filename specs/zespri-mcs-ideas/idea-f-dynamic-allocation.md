---
status: draft
priority: 6
wave: 4
cooperation_probability: 55%
estimate: 6-8 weeks / $75-100K NZD
gate: SSP contract flexibility must be confirmed
---

# Idea F: Dynamic SSP Allocation

## Executive Summary

An optimization engine that suggests SSP reallocation during peak harvest based on workload, proximity, turnaround times, and predicted clearance windows. Reduces bottlenecks by directing sampling capacity where it's needed most.

**Constraint:** SSP contracts may not allow mid-season reallocation. This feature's scope depends entirely on contractual flexibility. If contracts are rigid, this becomes a "next-season planning tool" only.

## Problem Statement

- SSP allocation is set at season start and rarely adjusted
- During peak harvest, some regions have backlogs while others have idle capacity
- Bottlenecks delay clearance by days (growers lose optimal harvest timing)
- No real-time visibility into where capacity is needed vs available
- Manual reallocation requires phone calls and negotiation mid-crisis

## Business Case

| Metric | Value |
|--------|-------|
| Peak season duration | ~3-4 weeks of intense activity |
| Estimated bottleneck cost | 2-5 days delayed clearance per affected block |
| Blocks affected by bottlenecks | Unknown (hypothesis: 10-20% during peak) |
| Revenue impact of delayed clearance | Fruit quality degrades = lower grade = lower bonus |
| Build cost | $75-100K NZD |
| Potential value | Faster clearance = higher fruit quality = higher grower returns |

## Prerequisites (Gates Before Build)

### Gate 1: Contract Flexibility

Ask Zespri Procurement:
- Do SSP contracts allow mid-season reallocation?
- What are the constraints (minimum volumes, geographic limits, notice periods)?
- Is there a mechanism for "bonus work" (extra allocation above contract minimum)?

| Answer | Scope |
|--------|-------|
| Contracts allow reallocation with notice | Full real-time optimization |
| Contracts have bonus work mechanism | Optimization for surplus capacity only |
| Contracts are rigid | Pivot to next-season planning tool only |

**Kill condition:** Contracts are completely rigid AND Zespri won't fund a planning-only tool.

### Gate 2: Idea D Delivered First

Performance Analytics (Idea D) provides the data foundation for dynamic allocation. Without visibility into current performance, optimization has no inputs.

### Gate 3: SSP Willingness

At least 3 SSPs must be willing to participate in a pilot. If all refuse, the feature has no users.

## Requirements

### Functional (Full Scope - if contracts allow)

1. **Real-Time Pipeline Visibility**
   - Map showing: samples waiting at each stage, by region
   - Bottleneck detection: regions where backlog > 24 hours
   - Capacity map: which SSPs have available capacity today

2. **Optimization Engine**
   - Input: current backlog, SSP locations, SSP capacity, travel times, predicted clearance windows (from Idea C)
   - Output: suggested reallocation moves ("SSP-A should take 10 samples from Region X")
   - Constraints: minimum volume guarantees, maximum travel distance, SSP preferences
   - Runs every 4 hours during peak harvest

3. **Suggestion Dashboard (Zespri Ops)**
   - Shows optimization suggestions with rationale
   - One-click approve/reject per suggestion
   - Approved suggestions generate work orders for SSPs
   - Track: suggestions made vs accepted vs rejected (measures trust)

4. **SSP Notification**
   - "New work available in [Region]: 10 samples, estimated 4 hours, bonus rate applies"
   - SSP accepts or declines
   - Declined work goes to next-best SSP

5. **Incentive Layer**
   - SSPs who accept reallocation get priority for bonus work
   - Performance bonus for accepting surge requests
   - Transparent: SSPs can see the incentive structure

### Functional (Reduced Scope - if contracts are rigid)

1. **Season Planning Recommendations**
   - Based on last season's bottleneck data: "Region X needs 20% more SSP capacity next season"
   - Allocation simulation: "If we move SSP-A from Region Y to Region X, predicted bottleneck reduction is Z%"
   - Presented to Zespri Procurement for next-season contract negotiations

2. **Bottleneck Prediction**
   - Based on predicted clearance windows (Idea C): "Week 3 will have 40% more samples than Week 2 in Region X"
   - Early warning: "Current allocation will create a bottleneck in Region X in 5 days"

## Technical Design

### Architecture (Full Scope)

```
+---------------------------------------------------+
|  MCS Database (existing)                          |
|  Current sample states, SSP assignments, regions   |
+----------------------------+----------------------+
                             |
                    Data feed (every 4 hours)
                             |
                             v
+---------------------------------------------------+
|  Allocation Optimizer (NEW)                       |
|  Python | Azure Function (timer-triggered)         |
|                                                   |
|  1. Load current pipeline state                    |
|  2. Load SSP capacity + constraints                |
|  3. Run constraint optimization (OR-Tools)         |
|  4. Generate suggestions                           |
|  5. Write to [dbo].[AllocationSuggestion]         |
+---------------------------------------------------+
                             |
                             v
+---------------------------------------------------+
|  Ops Dashboard (NEW tab in MCS)                   |
|  - Pipeline map with bottlenecks                   |
|  - Optimization suggestions                        |
|  - Approve/reject workflow                         |
|  - SSP notification trigger                        |
+---------------------------------------------------+
```

### Optimization Model

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Solver | Google OR-Tools (CP-SAT) | Free, fast, handles constraints well |
| Objective | Minimize max backlog across all regions | Balances load rather than optimizing one region |
| Constraints | Min volume guarantees, max travel distance, SSP working hours, region certifications | Respects contracts |
| Frequency | Every 4 hours during peak | Frequent enough to catch emerging bottlenecks |
| Fallback | If no improvement possible, suggest nothing | Don't create noise |

## Cost Estimate

### Full Scope (contracts allow reallocation)

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Contract analysis | Review SSP contracts, define constraints | 1 week | $12K |
| Pipeline visibility | Real-time map of sample states by region | 1 week | $12K |
| Optimization engine | OR-Tools solver with constraints | 2 weeks | $25K |
| Ops dashboard | Suggestion review, approve/reject workflow | 1 week | $12K |
| SSP notification + acceptance | Mobile-friendly notification, accept/decline | 1 week | $12K |
| Incentive layer | Bonus tracking, transparency dashboard | 0.5 weeks | $6K |
| Pilot + testing | Run with 3 SSPs in 1 region | 1 week | $12K |
| **Total** | | **7.5 weeks** | **$91K** |

### Reduced Scope (contracts rigid - planning only)

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Historical bottleneck analysis | Identify patterns from last 3 seasons | 1 week | $12K |
| Planning simulation | "What if" allocation scenarios | 1.5 weeks | $18K |
| Bottleneck prediction | Early warning based on Idea C predictions | 1 week | $12K |
| Dashboard | Planning recommendations for procurement | 0.5 weeks | $6K |
| **Total** | | **4 weeks** | **$48K** |

## Validation & Testing

### Acceptance Criteria (Full Scope)

- [ ] Optimization runs within 5 minutes for full NZ region set
- [ ] Suggestions respect all contract constraints (min volumes, max distance)
- [ ] SSPs can accept/decline suggestions via mobile notification
- [ ] Bottleneck detection fires when any region exceeds 24h backlog
- [ ] Ops team can approve/reject suggestions in < 30 seconds
- [ ] Accepted suggestions generate correct work orders

### How to Validate

1. **Simulation:** Run optimizer on last season's data. Would suggestions have reduced bottlenecks?
2. **Pilot:** 1 region, 3 SSPs, 2 weeks during peak. Measure: backlog reduction vs control region.
3. **SSP feedback:** After pilot, survey participating SSPs. Would they continue?

### Kill Conditions

- Contracts don't allow mid-season reallocation AND Zespri won't fund planning-only tool
- All SSPs refuse to participate in pilot
- Optimization produces no meaningful improvement over current allocation
- Zespri Procurement says "we handle this manually and it's fine"

## Stakeholder Sign-off Required

- [ ] Zespri Procurement - contract flexibility confirmation
- [ ] Zespri Ops - confirms bottleneck problem exists
- [ ] SSP representatives (3+) - willing to pilot
- [ ] Zespri Finance - budget approval
- [ ] Zespri Legal - confirms no contractual breach

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Contracts don't allow reallocation | High | Scope reduction | Pivot to planning-only tool |
| SSPs resist collectively | Medium | Fatal | Incentive layer + voluntary opt-in only |
| Optimization doesn't improve on manual | Medium | Fatal | Simulation on historical data before build |
| Political sensitivity (moving work between providers) | High | High | Zespri Ops makes final call. System suggests, humans decide. |
| Idea C (predictions) not available | Medium | Scope reduction | Can work without predictions, just less effective |
