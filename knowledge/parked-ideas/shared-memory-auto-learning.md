# Parked Idea: Shared Auto-Learning Memory Store

## Problem
User works across multiple Kiro IDE instances + CLI simultaneously. Learnings from one instance don't propagate to others. Context gets repeated.

## Current State
- Shared `~/.kiro/` folder already exists (all instances read from it)
- Knowledge base is indexed and searchable
- Guide evolution is approval-gated (manual)
- No automatic fact capture across sessions

## Proposed Solution (Lightweight)
Append-only fact log at `~/.kiro/knowledge/facts.md` — after completing a task, agents write a one-line fact. All instances read from the same file. No daemon, no custom runtime.

## Proposed Solution (Full — OpenClaw-inspired)
1. Post-session memory writer — extract facts from transcripts via LLM
2. Memory daemon — background process indexing session files
3. Auto-inject relevant memories into prompts

## Risks of Full Approach
- Memory pollution (wrong facts accumulate silently)
- Context bloat (too many memories eat tokens)
- Stale memories (outdated facts mislead agents)
- Kiro CLI updates could break custom integrations
- Significant build effort (months, not days)

## OpenClaw Reference
MIT-licensed, open source. Memory module could potentially be extracted and adapted. Their system works because they control the runtime — we don't.

## Decision
Parked. Revisit when cross-session context loss becomes a measurable time sink. Lightweight approach (shared fact log) is the pragmatic first step if pursued.
