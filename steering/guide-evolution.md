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
