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

## Storage

`knowledge add` — vector-indexed (semantic search). Retrievable by topic, date, or any concept in the notes.
