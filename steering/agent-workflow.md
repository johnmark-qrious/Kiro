---
inclusion: always
---

# Agent Workflow Guide

This document defines when and how to use specialized agents in your development workflow.

## Available Agents

- **@architect**: Web application architecture and system design
- **@dark-architect**: Adversarial architect — devil's advocate for design reviews
- **@backend**: C#/.NET 8 backend development, gRPC endpoints, NUnit testing, XML config (QT-Ubi-UbiquityBackend)
- **@github-agent**: GitHub operations and PR creation
- **@frontend**: TypeScript/Next.js/React development, Biome compliance, and formatting
- **@quality-assurance**: Critical code review and edge case analysis
- **@tester**: High-value test writing focused on critical paths, negative scenarios, and property-based testing
- **@protobuf-engineer**: Proto schema design, buf tooling, codegen, breaking change detection
- **@ticket-triage**: Ticket readiness gatekeeper
- **@pr-reviewer**: Pull request code review via GitHub MCP tools — blocker analysis, completeness checks, dependency verification

## Workflow Guides (Table of Contents)

MANDATORY: Do NOT read these guides upfront. Only read the ONE guide that matches the current task.

### Any Ticket Readiness Check (before planning)
**Read** (only when needed): `.kiro/guides/ticket-triage/readiness-checklist.md`
Agents: @ticket-triage → verdict → proceed or stop

### Any Bug Fix
**Skip:** planning-design.md, @architect, @dark-architect, worktree evaluation
**Agents:** @backend or @frontend (based on domain) → @quality-assurance (spot check) → @github-agent (PR)

**Flow:**
1. Fetch the ticket (ADO/GitHub). Read the bug description and repro steps.
2. Find the code. Reproduce the issue or confirm root cause from reading.
3. @backend or @frontend: fix it. Minimal change, no refactoring unless directly related.
4. Run tests. Show output. If no existing test covers the bug, write one.
5. @quality-assurance: quick spot check (not a full design review). Focus on: does the fix address root cause, any regressions, edge cases.
6. @github-agent: create PR.
7. Notion sync: once, after PR is created (not mid-flow).

**When to use:** Ticket type is Bug, or user says "bug fix", "quick fix", "just fix it", or the task is clearly a defect correction (not a feature addition or refactor).

**When NOT to use:** If the "bug fix" requires changing interfaces, adding new components, or touching 5+ files across domains — that's a feature disguised as a bug. Use the full planning workflow instead.

### Any Requirements, Planning & Design
**Triggers:** User says "plan", "design", "let's think about", "requirements", "spec", "how should we build", provides a ticket/PBI for a new feature, or asks for architecture decisions. If the task is NOT a bug fix and involves new behavior, new components, or interface changes — this is a planning task.
**Read** (only when needed): `.kiro/guides/agent-workflow/planning-design.md`
Agents: @architect → @dark-architect (3-round debate) → present to user → iterate if needed

### Any Frontend Implementation or Task runs
**Read** (only when needed): `.kiro/guides/agent-workflow/frontend-implementation.md`
Agents: @frontend → @quality-assurance → @frontend

### Any Backend or C# Implementation or Task runs
**Read** (only when needed): `.kiro/guides/agent-workflow/backend-implementation.md`
Agents: @backend → @quality-assurance → @backend

### Any Testing
**Read** (only when needed): `.kiro/guides/agent-workflow/testing.md`
Agents: @tester → @quality-assurance → @tester

### Any Pull Request Creation
**Read** (only when needed): `.kiro/guides/agent-workflow/pr-creation.md`
Agents: @github-agent

### Any Proto/gRPC Schema Work
**Read** (only when needed): `.kiro/guides/agent-workflow/proto-implementation.md`
Agents: @protobuf-engineer → @quality-assurance → fix if needed

### Post-PR Retro (MANDATORY after PR creation)
**Read** (only when needed): `.kiro/guides/agent-workflow/pr-creation.md` (retro section)
**Skip when:** Bug fix workflow, or PR touched ≤3 files, or planning phase was skipped.
**Trigger:** Runs automatically as the final step of PR creation.

### Any Pull Request Review
**Read** (only when needed): `.kiro/guides/pr-reviewer/github-review-workflow.md`
Agents: @pr-reviewer \u2192 present findings \u2192 user approves \u2192 post review

### After Design Phase (Large Features) — MANDATORY CHECKPOINT
**MUST evaluate** after tasks.md is created: `.kiro/guides/workflow/parallel-worktree-strategy.md`
When: After design.md and tasks.md are complete — ALWAYS evaluate the condition below before proceeding to task execution.
Condition: Does the feature have 5+ tasks touching different files/domains?
- If YES → Read the guide and produce a worktree-plan.md. Present the plan to the user before executing any tasks.
- If NO → Note in your response: "Worktree strategy evaluated — not applicable (reason)." Then proceed normally.
Purpose: Decompose tasks into parallel worktrees with foundation/parallel/integration phases.

## Pre-Task Checks

### Azure DevOps Work Items
When the user provides Azure DevOps PBI links or work item IDs, ALWAYS attempt to fetch them via `mcp_azure_devops_wit_get_work_item` before asking the user to paste details manually. Use `expand: relations` to get the full picture including dependencies and child items.

## Quick Reference

| Task | Agent Order |
|------|-------------|
| Bug Fix | @backend/@frontend → @quality-assurance (spot check) → @github-agent |
| Ticket Triage | @ticket-triage → verdict → proceed or stop |
| Planning | @architect → @dark-architect (3-round debate) → present to user |
| Frontend Code | @frontend → @quality-assurance → fix if needed |
| Backend Code | @backend → @quality-assurance → fix if needed |
| Writing Tests | @tester → @quality-assurance → refine if needed |
| Proto/gRPC | @protobuf-engineer → @quality-assurance → fix if needed |
| Create PR | @github-agent |
| Post-PR Retro | automatic (after PR creation, skip if bug fix or ≤3 files) |
| Review PR | @pr-reviewer \u2192 present findings \u2192 user approves |

## Don't Do This

- **Don't skip the workflow guide lookup.** Before starting ANY task, match it to a Workflow Guide section above and read the corresponding .md file. If the guide file doesn't exist, flag it to the user  don't silently proceed without it.
- **Don't do planning/design work without @architect.** Requirements docs, design docs, and spec reviews MUST go through @architect. Never produce these directly.
- **Don't ask the user to paste info that MCP tools can fetch.** Azure DevOps PBIs, GitHub PRs, Notion pages  always try the tool first.
- **Don't apologize for missing a workflow step without adding a guard.** If you catch yourself skipping a steering rule, add an anti-pattern entry or knowledge base note so it doesn't repeat.
- **Don't skip QA review in batch/run-all-tasks mode.** The `@quality-assurance` step applies per-task, not per-session. Even when executing multiple tasks sequentially, each `@backend` or `@frontend` subagent output must go through `@quality-assurance` before marking the task complete.
- **Don't only check the workspace `.kiro/` for guides.** Guides and steering files live at three levels: `~/.kiro/` (user-level/global), `<main-worktree>/.kiro/`, and `<current-workspace>/.kiro/`. Always check `~/.kiro/` first for user-level guides before concluding a guide doesn't exist.