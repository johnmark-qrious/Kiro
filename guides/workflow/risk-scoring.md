---
inclusion: manual
---

# Risk Scoring

Every completed task or PR gets a risk tag. This determines review depth.

## Scoring Criteria

| Factor | Low (1) | Medium (2) | High (3) |
|--------|---------|------------|----------|
| Files changed | 1-3 | 4-10 | 11+ |
| Domains touched | 1 | 2 | 3+ or cross-repo |
| Sensitivity | Config, copy, styles | Business logic, data display | Auth, payments, data mutations, infra |
| Novelty | Existing pattern | Minor variation | New pattern, new dependency, new service |
| Reversibility | Easy rollback | Needs migration | Data loss risk, breaking change |

**Score = highest factor wins** (not average). One "High" factor = High risk overall.

## Review Depth by Risk

**Low risk (all factors score 1):**
- Fast-track eligible
- Present as: "Low risk - [1-line summary]. Fast track?"
- User can approve with a glance, no detailed review needed
- QA agent does a spot check (not full review)
- Examples: env var addition, copy change, adding a field to existing table, config tweak

**Medium risk (any factor scores 2, none score 3):**
- Standard review
- Present work normally, user reviews
- QA agent does full code review
- Examples: new component following existing pattern, adding a new route, refactoring a module

**High risk (any factor scores 3):**
- Full ceremony
- QA + tester both review
- Explicitly flag what makes it high risk
- User must review in detail
- Examples: new auth flow, database migration, new service integration, infra changes

## Presentation Format

When presenting completed work, tag it:

```
**Risk: Low** — config change, 1 file, existing pattern
[summary of change]
Fast track?
```

```
**Risk: High** — new gRPC service integration, touches auth interceptor, 3 repos
[detailed summary]
[QA findings]
```
