---
inclusion: manual
---

# Session Continuity

## On Session Start

1. Search knowledge base for `session/` — find recent session notes
2. Present the most recent notes so the user knows you remember
3. Ask if they want to continue or start something new

## Autosave Triggers

Do NOT wait for the user to say "save". Index to knowledge immediately after:

- A decision is made
- A file is created or modified
- A new task or direction is agreed on
- A key insight or "aha" moment during training/learning
- Roughly every 10 minutes of active work
- When a subtask completes

Use `knowledge add` with name format: `session/{topic-slug}/{YYYY-MM-DD}`

If the session entry already exists for today's topic, update it (add, not replace — append new transcript lines).

## Entry Format

```
# Session: {Topic}
Date: {YYYY-MM-DD}
Repo: {path if applicable}
Type: {coding | training | exploration | planning}

## Status
{where we got to}

## Next Steps
{what's left to do}

## Key Decisions
{anything agreed on}

## Learnings (for training sessions)
{concepts explained, code relationships discovered, mental models built}
{what the user understood vs still fuzzy}

## Transcript (condensed, key moments only)
- {HH:MM} [user] {summary}
- {HH:MM} [kiro] {summary of response/action}
```

## On Disconnect Recovery

For same-session recovery (crash, disconnect, relogin), use the built-in session management first:
- `kiro-cli chat --resume` — resumes the most recent session with full message history
- `kiro-cli chat --resume-picker` — pick from a list of previous sessions

The knowledge base is for cross-session long-term memory (days/weeks later, different topics). `--resume` handles the immediate "goldfish" problem.

When user says anything like "we were just talking", "you forgot", "goldfish":
1. Search knowledge for session notes
2. Present findings
3. Resume

## Cost Control

Only save on meaningful moments, not every message. Target 3-5 saves per session.

## Cost Tracking

Track resource usage per feature/session. Report on request or at feature completion.

### What to Track

- **Sessions used**: how many chat sessions contributed to this feature
- **Phases**: time/effort split (design vs implementation vs review vs rework)
- **Rework rate**: how many tasks needed fixes after QA or evaluator feedback
- **Sub-agents spawned**: count and purpose
- **AFK batches**: tasks attempted vs completed

### When to Report

- At feature completion (before PR)
- When user asks "how much did this cost?"
- In AFK batch summaries (estimated cost before starting, actual after)

### Report Format

```
## Cost Report: [Feature Name]

| Metric | Value |
|--------|-------|
| Sessions | 3 |
| Sub-agents spawned | 8 (2 architect, 3 frontend, 2 QA, 1 tester) |
| Tasks completed | 7/7 |
| Rework cycles | 2 (Task 3: QA found missing error state, Task 5: evaluator caught broken nav) |
| Phase split | Design 20% / Implementation 55% / Review 15% / Rework 10% |
| AFK batches | 1 (tasks 4-6, all passed) |

### Observations
- Task 3 rework was preventable: AC didn't specify error state (now fixed in AC rules)
- Most time spent in implementation (expected for 7-task feature)
```

### What This Enables

- Spot features that cost disproportionately (vague specs = expensive rework)
- Compare AFK vs attended execution efficiency
- Identify which phases eat the most budget
- Justify harness improvements with data

## Storage

`knowledge add` — vector-indexed (semantic search). Retrievable by topic, date, or any concept in the notes.

## Specs — Source of Truth

All specs live in the global `.kiro` folder, NOT in individual repos:

```
/mnt/c/Users/T828819/.kiro/specs/{feature-branch-name}/
├── README.md          ← index (PBI link, quick reference)
├── requirements.md    ← design, requirements, dependencies, ADRs
├── tasks.md           ← task breakdown with file lists
├── battle-plan.md     ← execution strategy (branches, PRs, phases)
├── ui-design.md       ← visual design reference (if applicable)
└── *.png              ← screenshots (if applicable)
```

**Naming convention:** `specs/{branch-name}/` — use the base feature branch name (e.g., `admin-billing-ui`, not the full `feature/admin-billing-ui`).

**Why global:** Specs span multiple repos. Putting them in one repo makes them invisible from others. The global folder is accessible from any session (IDE or CLI).

**Do NOT** put specs in repo-level `.kiro/specs/` folders. If they already exist there, they are stale copies — the global folder is the source of truth.
