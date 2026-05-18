# Benchmark: {skill-name} — Iteration {N}

Date: {date}
Skill version: iteration-{N}

## Results

| Eval ID | Prompt Summary | With Skill | Baseline | Delta |
|---------|---------------|-----------|----------|-------|
| 1 | {summary} | {pass}/{total} | {pass}/{total} | +{N} |

## Aggregate

- **With skill pass rate:** {X}%
- **Baseline pass rate:** {Y}%
- **Improvement:** +{Z}%

## Observations

- {Non-discriminating assertions (always pass regardless of skill)}
- {High-variance evals (flaky results)}
- {Assertions that regressed from previous iteration}

## Decision

- [ ] Iterate further (pass rate < target or user has feedback)
- [ ] Ship it (pass rate meets target, user approves)
- [ ] Abandon (skill doesn't measurably improve output)
