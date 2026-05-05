---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Phase 4: Pull Request Creation

When ready to create a PR:

## Use @github-agent

**@github-agent** handles all GitHub operations:
- Creates pull requests with standardized descriptions
- Manages branches
- Provides consistent PR format
- Handles GitHub API interactions

## Example

```
User: "Create a PR for the journey list feature"

1. @github-agent - Create the pull request
```

## Why Use @github-agent

- Ensures consistent PR descriptions across the team
- Handles GitHub API complexity
- Provides proper formatting and structure
- Reduces manual PR creation work

---

## Post-PR Retro

**Runs automatically after every PR creation.** This is the learning loop that makes skills improve with use.

### Skip Conditions

Skip the retro entirely if ANY of these are true:
- PR was created via the **bug fix workflow**
- PR touched **≤3 files**
- The **planning phase was skipped** (no design doc or plan exists for this work)

If skipped, state: "Retro skipped — [reason]." and stop here.

### Step 1: Evaluate Three Interfaces

Compare what was planned vs what happened at each handoff:

**Interface 1 — Ticket → Brainstorm/Design:**
- Did the ticket give enough context?
- Did brainstorming ask the right questions or miss something important?
- Did the architect/dark-architect debate surface the real risks?

**Interface 2 — Design → Plan:**
- Did the plan match what was actually needed?
- Were file lists accurate?
- Were dependencies identified correctly?

**Interface 3 — Plan → Implementation:**
- Did the code match the plan?
- What changed during implementation and why?
- Did verification catch real issues or was it clean?

For each interface, produce one of:
- **No finding** — handoff was clean, nothing to record
- **Finding** — a specific, actionable pattern worth recording

### Step 2: Append Findings to Guides

For each finding, determine the target guide:
- Interface 1 findings → `guides/agent-workflow/planning-design.md`
- Interface 2 findings → `guides/agent-workflow/planning-design.md`
- Interface 3 findings → the implementation guide that was used (`frontend-implementation.md`, `backend-implementation.md`, or `proto-implementation.md`)

**Before appending, read the target guide and find the `## Learned Patterns` section.**

#### If the finding already exists (duplicate):
Increment the frequency tag. Example: `(2x)` becomes `(3x)`.

#### If the finding is new:
Append it with `(1x)` tag. Format:
```
- [Specific actionable pattern] (1x)
```

#### If the section has 10 entries (cap reached):
**Consolidate before appending:**
1. Merge duplicate or overlapping patterns into single entries (sum their counts)
2. Any pattern that is `(3x)` or higher — promote it into the guide’s main rules section, then remove from Learned Patterns
3. Any pattern still at `(1x)` and the metadata shows `pr-count-since` ≥ 10 — prune it (one-off, didn’t recur)
4. Update the metadata comment: `last-consolidated: [today’s date]`, reset `pr-count-since: 0`
5. Now append the new finding

#### After every append (whether or not consolidation happened):
Increment `pr-count-since` in the metadata comment by 1.

### Step 3: Report

State what was recorded:
```
Retro complete:
- Interface 1: [finding or "clean"]
- Interface 2: [finding or "clean"]
- Interface 3: [finding or "clean"]
- Appended to: [skill file(s) modified, or "none"]
```
