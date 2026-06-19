# Proposal: Autonomous Agentic Development Pipeline

## Executive Summary

We propose an AI-powered development pipeline where human engineers focus on design, architecture, and decision-making while AI agents handle implementation, testing, and code review autonomously. The system takes work items from Azure DevOps and turns them into shipped code with video proof of working features - requiring only a brief human approval before merge.

**Primary approach:** GitHub Copilot Coding Agent (native, already included in our GitHub subscription) handles autonomous implementation. No custom infrastructure required for the core loop.

This approach is already proven at scale: Stripe ships 1,300+ pull requests per week using a similar system. GitHub's own Copilot Coding Agent achieves autonomous issue-to-PR with built-in fix loops.

**Expected outcome**: Same team of 10-20 engineers producing 3-5x the output, with engineers shifting from writing code to designing systems and reviewing agent work.

**Cost**: ~$945-1,665/month including agent gardening (vs $5,695/month for full custom alternative)
**Time to production**: 1-2 weeks (vs 4-6 weeks for full custom)
**Custom components to build**: 2 (vs 6 for full custom)

---

## The Problem

AI coding tools have increased code generation speed, but delivery metrics remain flat:

- **PR volume up 98%** but deployment frequency flat
- **Review time up 91%** - validation can't keep pace
- **PR size up 154%** - larger changes harder to review
- Our sprint audit (147 PBIs): 29% are routine, single-repo, well-defined tasks

The bottleneck is validating and shipping code, not writing it.

---

## The Solution

### How It Works

```
1. ENGINEER TAGS PBI          In Azure DevOps, tag a PBI as "agent-eligible"

2. AUTO-SYNC                  Power Automate creates a GitHub Issue with the
                              PBI's title, description, and acceptance criteria

3. COPILOT PICKS IT UP        GitHub Copilot Coding Agent implements in an
                              isolated git worktree automatically

4. CI RUNS                    Tests + Playwright (video recorded) + lint + types

5. AGENT MERGE                If CI fails or review comments posted, Copilot
                              fixes automatically (up to 2 cycles)

6. HUMAN REVIEWS              Engineer watches video, glances at diff (3-5 min),
                              merges or requests changes

7. SKILL EVOLUTION            Update copilot-instructions.md when patterns emerge
                              (2-4 hrs/week "agent gardening")
```

### What Engineers See

- Tag a PBI → come back to a ready PR with video proof
- Review takes 3-5 minutes (not 30+ minutes of full review)
- Agent handles: routine bugs, CRUD, test additions, dependency updates
- Humans handle: architecture, design, complex debugging, cross-repo coordination

---

## Why This Is Safe

| Safety Layer | What It Prevents |
|---|---|
| Engineer tags PBI deliberately | Only intended work enters the pipeline |
| Isolated git worktree | Agent can't affect main or other branches |
| CI gates (tests, lint, types) | Broken code can't reach PR stage |
| Playwright video proof | Human verifies visually in 30 seconds |
| Agent Merge (max 2 fix cycles) | Prevents infinite loops |
| Human approval required (branch protection) | Nothing merges without a human decision |
| copilot-instructions.md | Agent follows team conventions |

---

## Cost

| Item | Monthly Cost |
|---|---|
| GitHub Copilot (already subscribed) | $0 incremental |
| Power Automate (ADO → GitHub sync) | Included in M365 |
| CodeRabbit (optional, enhanced review) | $225 (15 seats × $15) |
| Agent gardening (2-4 hrs/week × $90/hr) | $720-1,440 |
| **Total** | **~$945-1,665/month** |

### Compared To
- Full custom pipeline (Pilot + Daytona): $1,300/month + $114k setup
- 20 engineers at $80/hr: $256,000/month
- If agents handle 20 hrs/week of routine work per team: $32,000/month displaced
- **ROI: Immediate (near-zero incremental cost)**

---

## Phased Rollout

### Phase 1: Configure & Pilot (Weeks 1-4)
- Add `copilot-instructions.md` to each repo (30 min per repo)
- Set up Power Automate: ADO PBI tagged "agent" → GitHub Issue
- Add Playwright video recording to CI
- 2-3 engineers pilot with routine tasks
- **Exit criteria:** >60% of assigned tasks produce PRs merged with ≤5 minutes of human edits; median review time ≤8 minutes

### Phase 2: Expand & Measure (Weeks 5-12)
- Full team uses the pipeline for eligible tasks
- CodeRabbit added for enhanced review
- Quality ratchet: weekly review of findings → update instructions
- Event-driven cross-repo: proto merge → triggers downstream Copilot
- **Exit criteria:** measurable deployment frequency increase

### Phase 3: Optimize (Weeks 13+)
- Evaluate GitHub's multi-repo agent features as they ship
- If quality plateaus → evaluate custom agent for specific failing task types
- Only build custom infrastructure if native tooling fails on measured task class

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Agent builds wrong thing | PBI has clear AC + human reviews before merge |
| Quality degrades over time | 2-4 hrs/week "agent gardening" (update instructions) |
| Copilot can't handle complex tasks | Don't assign complex tasks. Humans handle the hard 71%. |
| GitHub changes pricing/features | Escape hatch: fall back to custom pipeline (Pilot + Daytona) |
| Nobody maintains the instructions | Put "agent gardening" on the sprint board. Explicit allocation. |

---

## What This Does NOT Handle (Future Phases)

- Cross-repository orchestration (human-led for now)
- Incident triage and auto-remediation
- Support ticket automation
- Teams conversation → ticket (currently: engineer creates issue manually or via Power Automate tag)

---

## Companies Already Doing This

| Company | Scale | Approach |
|---|---|---|
| Stripe | 1,300 PRs/week | Slack → sandboxed VM → PR → human review |
| GitHub (internal) | Copilot Coding Agent | Issue → autonomous PR → Agent Merge |
| Pilot users | 5-30 devs | Ticket → autonomous implementation → PR |

---

## Decision Requested

Approve Phase 1 (2 weeks, 2-3 engineers, configure existing tooling). Zero infrastructure cost. Reversible in 5 minutes (remove the copilot-instructions.md files).

---

## Alternative: Full Custom Pipeline

If the native GitHub approach proves insufficient (quality ceiling, lack of control, cross-repo needs), we have a fully designed custom alternative ready:

- Pilot (open-source) + Daytona (sandbox) + custom orchestrator
- Full control over agent behavior, skill files, model choice
- Cost: ~$1,300/month + $114k setup
- Timeline: 4-6 weeks
- Detailed design available in `design.md`

This is the escape hatch, not the starting point.
