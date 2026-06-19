---
inclusion: manual
---

# AFK Mode (Unattended Execution)

For pre-approved task lists where the design is locked and tasks have testable AC, the user can authorize batch execution without per-task checkpoints.

## Activation

User says something like: "run tasks 3-6 AFK" or "execute the next 4 tasks, I'll review when done."

**Proactive suggestion:** After a task completes, if the next 2+ tasks in sequence ALL meet the prerequisites below, suggest AFK:

> "Tasks X-Z are all low/medium risk with AC, no design decisions needed. Want me to run them AFK?"

Only suggest once per sequence. If the user declines, don't ask again for the same batch.

## Prerequisites (ALL must be true)

1. Design is approved (user explicitly said "approved" or "looks good")
2. Tasks have AC sections (binary pass/fail criteria exist)
3. All tasks score Low or Medium risk (no High-risk tasks in AFK batch)
4. No tasks require design decisions (pure implementation, no open questions)
5. No tasks touch auth, payments, or infrastructure

## Execution Protocol

For each task in the batch:
1. Fresh sub-agent context (same as normal sub-agent delegation)
2. Implement the task
3. Run Playwright evaluator if UI task (verify AC items)
4. Run build/typecheck/lint
5. If all pass: commit with conventional commit message, move to next task
6. If any fail: stop the batch, report what failed and where

**Context flush rule:** Each task in the batch is a clean slate. Do NOT carry assumptions, variable names, approach decisions, or "what worked for the previous task" into the next one. Re-read the task's AC fresh. If the previous task's approach seems relevant, verify it applies — don't assume.

## What AFK mode does NOT do

- Does not push to remote (commits stay local until user reviews)
- Does not skip QA entirely (spot-check runs on the batch after completion)
- Does not make design decisions (if ambiguity is found, batch stops)
- Does not proceed past a failing task (no "skip and continue")

## After Batch Completes

Present a summary:

```
## AFK Batch Complete: Tasks 3-6

| Task | Status | Commits | Risk |
|------|--------|---------|------|
| 3. Billing table component | ✅ Done | abc1234 | Low |
| 4. Empty state handling | ✅ Done | def5678 | Low |
| 5. Error boundary | ✅ Done | ghi9012 | Low |
| 6. Loading skeleton | ❌ Stopped | — | Low |

### Task 6 Failure
Playwright evaluator found: skeleton component not visible during fetch.
Root cause: Suspense boundary wraps wrong component.

Awaiting orders, Archangel.
```

## Guardrails

- Maximum 6 tasks per AFK batch (prevents runaway execution)
- If a task modifies more than 10 files, stop and ask (scope creep signal)
- If a task introduces a new dependency not in the design, stop and ask
- Total token budget per batch: report estimated cost before starting

## When to Refuse AFK

Refuse (explain why) if:
- Any task in the batch is High risk
- Tasks have open questions or "TBD" items
- Tasks lack AC sections
- The batch includes cross-repo work (coordination needs human judgment)
- Design hasn't been explicitly approved
