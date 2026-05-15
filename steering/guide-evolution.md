---
inclusion: always
---

# Guide Evolution Protocol

Agents MUST improve their own guides over time. The guides are your persistent memory across sessions.

## When to Propose Guide Updates

After completing a task, OR when any of the following occur:

### Corrections & Feedback
- The user corrected your approach — update the guide to reflect the better solution
- The user suggested a cleaner/more idiomatic approach — propose replacing existing guidance
- The user reports a recurring mistake — add a "Don't do this" entry to the relevant guide
- The user expresses a workflow preference — capture it in the relevant guide

### PR Review Learning
**MANDATORY**: After addressing any PR review comment that required a code change, IMMEDIATELY check if the feedback reveals a missing or incorrect guide entry. The guide update is part of completing the PR review fix — not a separate step.

### Pattern Recognition
- A successful pattern that isn't documented — propose adding it
- A non-obvious problem you solved — propose documenting the solution
- You improvised because no guide covered the situation — flag the gap

### Anti-Patterns
Every guide SHOULD have a "Don't do this" section. When the user or a PR reviewer flags a bad approach, add it to the relevant guide's "Don't do this" section.

## Detailed Guides (read only when needed)

| Topic | File | When to read |
|-------|------|-------------|
| Notion sync triggers & Kanban flow | `.kiro/steering/notion-sync.md` | When a Notion trigger fires (spec created, PR merged, feature design) |
| Knowledge base rules & format | `.kiro/steering/knowledge-base.md` | When storing or retrieving codebase discoveries |
| Guide maintenance & cleanup | `.kiro/steering/guide-maintenance.md` | During cleanup passes, synthesis runs, or drift detection |

## Frontmatter Lifecycle Rules

Knowledge files carry sync frontmatter (`draft`/`published`/`modified`). Guide files do not require frontmatter maintenance.

### Specs (`requirements.md`, `design.md`, `tasks.md`)
- `status`: `draft` | `review` | `approved` | `stale`
- `approvedBy`: set when user approves
- `approvedDate`: set when user approves
- Never build on a `draft` spec without user acknowledgment

### Guides
- `lastVerified`: date when the guide was last confirmed accurate (set during `guide cleanup` or `health check`)
- `lastUsedInTask`: date when an agent last read this guide for a task (set automatically when the guide is read)

### Knowledge files
- `sync`: `draft` | `published` | `modified` (see `knowledge-base.md` for full rules)
- When editing a `published` knowledge file, flip to `modified` and update `lastLocalEdit`

### Session notes
- `sessionStatus`: `active` | `completed` | `abandoned`
- Set to `completed` at end of session, `active` during

## Auto-Learning (Implementation Agents Only)

Implementation agents may capture preferences automatically WITHOUT user approval.

### Which Agents Auto-Learn

| Agent | Auto-learn | Reason |
|-------|-----------|--------|
| @frontend | Yes | Style, conventions, component patterns |
| @backend | Yes | Code conventions, naming, structure |
| @designer | Yes | Visual preferences, layout choices |
| @github-agent | Yes | PR format, commit style, branch naming |
| @protobuf-engineer | Partial | Naming conventions only |
| @architect | NO | Decisions compound downstream |
| @dark-architect | NO | Must stay adversarial |
| @skill-auditor | NO | Must not soften |
| @quality-assurance | NO | Must not soften |
| @taskmaster | Partial | Granularity preferences only |

### 2-Occurrence Rule

Do NOT capture on first occurrence. Only capture when the same preference appears 2+ times across different tasks or sessions. First time = data point. Second time = pattern. Pattern = capture.

### Exclusion Phrases (Never Capture)

If the user says any of these, do NOT auto-learn — it's a one-off:
- "for now", "temporarily", "just this once", "quick hack"
- "just do it", "skip it this time", "I'll fix later"
- "in this case", "exception here", "only for this"

### Scope Tagging

Every auto-learned entry must have a scope:
- `project:[name]` — only applies to a specific project
- `filetype:[ext]` — only applies when working with certain files
- `always` — applies everywhere (use sparingly)

### Where It Goes

All auto-captures append to `/knowledge/auto-learned.md` (the quarantine file).
- Entries are provisional — they influence behavior but are clearly marked
- During synthesis runs: review, promote good ones to guides, delete bad ones
- Entries older than 90 days without promotion are candidates for deletion

### What Gets Captured

- Naming preferences ("I prefer X over Y")
- Style choices ("use single quotes", "no semicolons")
- Component patterns ("always extract hooks into separate files")
- Formatting preferences ("keep imports sorted by type")
- Tool preferences ("use bun not npm")

### What Never Gets Captured (Even With 2+ Occurrences)

- Architecture decisions (which DB, which framework, which pattern)
- Security choices (auth approach, encryption, access control)
- Workflow preferences (these go through normal guide-evolution)
- Anything that changes system behavior (not just code style)

## Diagnosis Framework (When Corrected)

When the user corrects your approach, your NEXT response must include this block before continuing:

```
### Correction Acknowledged
**What was wrong:** [specific thing]
**Category:** [skill gap | convention gap | workflow gap | guide staleness | design gap]
**Fix for now:** [what you're doing differently right now]
**Permanent fix:** [proposed guide/skill change] or "None needed - one-off mistake"
```

Categories:
| Category | Signal | Remedy |
|----------|--------|--------|
| Skill gap | AI guessed at an API, hallucinated a pattern | New skill doc |
| Convention gap | User says "we always do X" but it's not written | Add to relevant guide |
| Workflow gap | Steps happened in wrong order, handoff was missed | Edit adaptive-workflow.md or planning-design.md |
| Guide staleness | Guide says X but codebase has moved to Y | Update guide, set lastVerified |
| Design gap | Implementation revealed the design was incomplete | Feed back to @architect patterns |

This block is NOT optional after a correction. If you catch yourself responding without it, add it before continuing.

**"None needed" is only valid when:** the mistake was a genuine one-off (typo, misread a variable name, transient confusion). If the same category of mistake has occurred before in any session, "None needed" is NOT valid — propose a guide update.

## Rework-Triggered Guide Proposals (Mandatory)

When ANY of these occur during a session, a guide-update proposal is MANDATORY at task/feature completion:

| Trigger | Detection | What to Propose |
|---------|-----------|-----------------|
| QA flagged a 🚨 Critical Issue that required code change | QA output has Critical Issue + implementation was modified | "Don't do this" entry or missing pattern |
| Playwright evaluator failed an AC item | Evaluator report has ❌ FAIL | Missing convention or incorrect assumption |
| User corrected the same category twice | Two Correction Acknowledged blocks with same Category | Guide entry for that category |
| Sub-agent was re-spawned for the same task | Task required a second implementation attempt | Missing context or wrong approach documented |
| Build/typecheck failed after implementation | Non-zero exit before fix was applied | Missing convention or environment note |

### Rules

1. Track rework signals silently during the session (don't interrupt work)
2. At feature/task completion, if rework count > 0, produce the proposal BEFORE closing out
3. The proposal must reference the specific trigger ("QA found X" or "evaluator failed Y")
4. One proposal per trigger — don't batch unrelated issues into one update
5. If the same trigger type fires 2+ times across sessions, escalate from proposal to strong recommendation

## How to Propose

1. Finish the current task first — never interrupt work to update guides
2. At the end of your response, state clearly:
   - Which guide file to update (or "new guide" if creating one)
   - What to add, change, or remove
   - Why (one sentence — the trigger that caused this proposal)
3. Wait for the user to approve before making any edits
4. Keep proposals short — one or two sentences per change

## What You Can Propose

- Adding new patterns or examples to existing guides
- Adding "Don't do this" entries to prevent known bad habits
- Removing outdated or incorrect guidance
- Consolidating duplicate content across guides
- Creating a new guide when a topic keeps coming up
- Updating code examples to match current conventions
- Capturing user workflow preferences
- Adding knowledge base entries for codebase discoveries

## What You Must NOT Do

- Never silently edit guides without user approval
- Never remove guides without explaining why
- Never add speculative guidance — only document patterns actually used
- Never bloat guides with edge cases that haven't come up
- Never update guides mid-task — finish the work first
- Never claim to remember things from past sessions — the guides are your memory
