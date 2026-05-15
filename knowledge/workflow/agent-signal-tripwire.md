---
sync: draft
lastLocalEdit: 2026-05-14T09:46:00+12:00
---

# Agent Communication - Signal Tripwire Design

> Tournament-validated (DA → A → DA triple pass). Approved for build.

## Problem

Parallel agents can't communicate mid-flight. If Agent A discovers something critical, Agent B doesn't know until both finish.

## Solution: Gated Signal File (Not a Blackboard)

```
.kiro/signal.json          → Critical discovery signal
.kiro/gated-actions.json   → Which actions trigger a signal check
```

## How It Works

1. Agent discovers something CRITICAL (contract break, security issue)
2. Agent writes to `.kiro/signal.json`
3. Other agents read signal.json ONLY before executing a gated action
4. If signal has content → HALT at safe point
5. Human reviews and clears the signal

## signal.json Format

```json
{
  "status": "critical",
  "reason": "API returns items nested under .data.items, not .items directly",
  "remove-when": "All agents updated with correct contract",
  "created": "2026-05-14T09:30:00+12:00",
  "author": "agent-frontend"
}
```

Empty or missing file = all clear.

## gated-actions.json Format

```json
{
  "schema": 1,
  "gates": ["write", "shell", "subagent"]
}
```

Agents check signal ONLY before these actions. Not on every tool call.

## 6 Conditions (DA-Approved)

1. **Signal file location & format** - `.kiro/signal.json`, structured JSON, no auto-deletion ever
2. **Gated actions** - binary lookup against `gated-actions.json` (schema-versioned, fail-closed on unknown schema)
3. **HALT behavior** - stop at SAFE POINT: no mid-write files, all files parse, clean git state, no child processes. Write HALTED.md explaining why.
4. **Stale signal warning** - informational ">24h old" warning once per session, does not change behavior
5. **Signal file absence** - missing/unparseable signal = clear. Missing gated-actions = hardcoded defaults. Unparseable gated-actions = fail-closed.
6. **No implicit behavior** - no polling, no background reads. Signal only read when a gated action is about to execute.

## What This Is NOT

- Not a blackboard (no multi-message history)
- Not agent-to-agent DMs (one-way signal)
- Not polling (read only at gate points)
- Not autonomous (human decides action)
- Not a communication channel (it's a tripwire)

## When to Write a Signal

ONLY for:
- Contract/API shape discovered to be different than assumed
- Security issue found in shared code
- Dependency discovered missing/broken that affects other agents
- Schema/type mismatch that would invalidate parallel work

NOT for:
- Progress updates
- "Nice to know" discoveries
- Style preferences
- Non-blocking findings

## Implementation Effort

~2-3 hours:
- Create signal.json and gated-actions.json templates
- Add "check signal before gated actions" instruction to agent prompts
- Add "write signal for CRITICAL discoveries" instruction
- Define HALT behavior in agent guides

## Tournament History

| Round | What Happened |
|-------|---------------|
| Round 1 | Full blackboard MCP killed (over-engineered) |
| Round 2 | Tripwire survived (minimal, near-zero cost) |
| Round 3 | DA accepted with conditions |
| Gladiator pushback | "Read at end" too late → "read before expensive action" |
| DA → A → DA | Refined to gated-actions.json + safe-point halt + fail-closed semantics |
