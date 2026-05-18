# Autonomous Agentic Development Pipeline — Design Document

**Version:** 2.0
**Date:** 2026-05-18
**Status:** Proposal (Updated post-deathmatch)
**Author:** Product Engineering

> **Implementation Decision (ADR-011):** After adversarial tournament between Full Custom (Pilot+Daytona) and Native GitHub (Copilot Coding Agent), the winner is **Hybrid B+: GitHub Copilot native as primary, with full custom as escape hatch.** See Section 3 for details. Original custom design retained in Appendix for reference.

---

## 1. Problem Statement

### The Bottleneck Has Shifted

AI coding tools have dramatically increased code generation speed, but enterprise delivery metrics remain flat. Industry data (DORA-aligned, Faros 2025 report) shows:

- **PR volume up 98%** — engineers produce more code than ever
- **Review time up 91%** — validation can't keep pace with generation
- **PR size up 154%** — larger changes are harder to review
- **Bug rates up 9%** — speed without verification degrades quality
- **Deployment frequency flat** — the pipeline is clogged at review, not at coding

The bottleneck is no longer "writing code." It is **validating, reviewing, and shipping code safely.**

### Our Specific Pain Points

Based on Sprint 42-44 audit (147 PBIs):

- Average PR review turnaround: **6.2 hours**
- 29% of PBIs are routine, single-repo, well-defined tasks (CRUD, bug fixes with clear repro, test additions)
- Engineers spend ~18% of time on code review
- Context switching between "deep work" and "review someone's PR" fragments focus
- Routine implementation work displaces time for architecture, design, and complex problem-solving

### What We're Solving

Automate the routine 29% of work (implementation + initial review) so engineers can focus on the 71% that requires human judgment: architecture, design, cross-repo coordination, ambiguous requirements, and complex debugging.

---

## 2. Solution Overview — Hybrid B+ (Recommended)

### Primary Implementation: GitHub Copilot Native

```
ADO PBI tagged "agent" → Power Automate → GitHub Issue created
                                              ↓
                         GitHub Copilot Coding Agent (native)
                         ├── Runs in isolated git worktree
                         ├── Implements feature/fix
                         ├── Opens PR
                         └── Agent Merge handles CI failures + review comments (max 2 cycles)
                                              ↓
                         CI Pipeline (existing)
                         ├── Build + type check + lint
                         ├── Tests
                         └── Playwright (video: 'on') → artifact attached to PR
                                              ↓
                         CodeRabbit (automated review) + Human Merge Gate
                                              ↓
                         Skill Evolution (copilot-instructions.md updated weekly)
```

### Why Native Over Custom

| Factor | Native (Hybrid B+) | Custom (Pilot+Daytona) |
|---|---|---|
| Time to production | 1-2 weeks | 4-6 weeks |
| Monthly cost | ~$200 | ~$1,300 |
| Components to maintain | 2 custom | 6 custom |
| Setup cost | ~$5,000 (engineer time) | ~$114,000 |
| Fix loop | Native (Agent Merge) | Custom Azure Function |
| Sandbox isolation | Native (Copilot worktrees) | Custom (Daytona config) |
| Vendor dependency | GitHub (already committed) | Pilot + Daytona + Anthropic |

### Escape Hatch

If GitHub Copilot proves insufficient (quality ceiling, cross-repo needs, control requirements), the full custom pipeline (Section 3 - Appendix) is pre-designed and ready to build. Decision gate: only build custom if native fails on a specific, measured task class.

### Core Principles (Unchanged)

1. **Two human gates only**: Tag PBI as eligible (intent) + approve merge (quality)
2. **Fail safe**: Agent Merge retries max 2 cycles, then stops
3. **Skill evolution**: copilot-instructions.md + CodeRabbit rules improve over time
4. **Incremental rollout**: Start with 2-3 engineers, expand based on data
5. **Explicit gardening**: 2-4 hrs/week maintaining instructions (on sprint board)

### Components (Hybrid B+)

| Component | Implementation | Custom? |
|---|---|---|
| Ticket sync (ADO → GitHub) | Power Automate flow | Minimal (1-2 hours config) |
| Engineer Agent | GitHub Copilot Coding Agent | Native (free) |
| Sandbox/isolation | Copilot's isolated worktrees | Native |
| Fix loop | Agent Merge | Native |
| CI quality gates | Existing workflows + Playwright video | Existing + 1 hour config |
| Code review | CodeRabbit + Copilot review | Config only ($15/seat) |
| Human merge gate | GitHub branch protection | Existing |
| Skill evolution | copilot-instructions.md per repo | Custom (30 min/repo setup, 2-4 hrs/week ongoing) |
| Orchestrator (complexity routing) | Engineer judgment + PBI tagging | Human process (no code) |

### Phased Rollout (Hybrid B+)

**Phase 1 (Weeks 1-4): Foundation**
- `copilot-instructions.md` per repo (30 min each)
- Power Automate: ADO PBI tagged "agent" → GitHub Issue
- Playwright video added to CI
- CodeRabbit configured
- 2-3 engineers pilot
- Exit: >60% tasks produce mergeable PRs

**Phase 2 (Weeks 5-12): Expand**
- Full team
- Quality ratchet: weekly instruction updates from CodeRabbit findings
- Event-driven cross-repo: proto merge → triggers downstream Copilot
- Measure: rejection rate, time-to-merge, human edit time

**Phase 3 (Weeks 13+): Evaluate**
- Adopt GitHub multi-repo features as they ship
- If quality plateaus → evaluate custom agent for specific task types
- Only build custom if measured failure on specific task class

### Cost Model (Hybrid B+)

| Item | Monthly |
|---|---|
| GitHub Copilot (existing subscription) | $0 incremental |
| Power Automate (M365 included) | $0 |
| CodeRabbit (15 seats) | $225 |
| Agent gardening (2-4 hrs/week × $90/hr) | $720-1,440 |
| **Total** | **$945-1,665/month** |

**ROI**: 132 tasks/month automated × 2.5 hrs saved × $90/hr = $29,700 value vs ~$1,300 cost = **22:1 return**

---

## 3. Detailed Component Design (Original Custom — Retained as Appendix/Escape Hatch)

> **Note:** The following sections describe the full custom pipeline (Pilot + Daytona). This is retained as the escape hatch if the native GitHub approach proves insufficient. It has been validated via adversarial tournament (all risks mitigated). Build this only if Hybrid B+ fails on measured criteria.

### 3a. Teams Bot (Conversation Capture)

**Responsibility:** Provide an interface for engineers to signal "this should be a ticket" from within Teams.

**How it works:**
- Engineers use `/ticket` slash command or `@PipelineBot` mention in a thread
- Bot reads the surrounding thread (up to 50 messages) for context
- Passes thread content to the Ticket Agent for PBI drafting

**Inputs:** Teams thread content, requester identity
**Outputs:** Triggers Ticket Agent with conversation context

**Technology:** Azure Bot Framework SDK (or AWS Lambda + Teams webhook)
**Justification:** Native Teams integration, supports adaptive cards for approval flow

**Failure modes:**
- Bot offline → messages queue in Teams, processed when back
- Thread too long → truncated to 50 messages with warning

**Configuration:**
- `MAX_THREAD_MESSAGES`: 50 (default)
- `CHANNELS_MONITORED`: list of channel IDs (not all channels)

**Important:** Phase 1 uses explicit `/ticket` command only. No passive conversation monitoring. Zero false positives.

---

### 3b. Ticket Agent (PBI Creation)

**Responsibility:** Transform unstructured conversation into a structured Azure DevOps PBI with acceptance criteria.

**How it works:**
1. Receives conversation context from Teams Bot
2. LLM extracts: title, description, acceptance criteria, affected repo, estimated complexity
3. Drafts PBI and posts an Adaptive Card back to Teams for confirmation
4. Human reviews the card (sees title, AC, repo, complexity estimate)
5. Human reacts 👍 to confirm, ✏️ to edit, or 👎 to dismiss
6. On confirmation → PBI created in Azure DevOps with status "Ready"

**Inputs:** Conversation text, requester identity
**Outputs:** Azure DevOps PBI (or dismissal)

**Technology:** Azure Function (TypeScript) + Anthropic Claude API + Azure DevOps REST API
**Justification:** Serverless (pay per invocation), native ADO integration

**Failure modes:**
- LLM produces bad AC → human edits before confirming (the gate works)
- ADO API down → retry with exponential backoff (3 attempts, then alert)
- Human never responds → card expires after 24 hours, reminder at 4 hours

**Configuration:**
- `PBI_EXPIRY_HOURS`: 24
- `REMINDER_HOURS`: 4
- `DEFAULT_WORK_ITEM_TYPE`: "Product Backlog Item"

**Skill evolution trigger:** If human edits the PBI before confirming, the edit is recorded. After 2 occurrences of the same type of edit, the Ticket Agent's skill file is updated.

---

### 3c. Orchestrator (Classification + Routing)

**Responsibility:** Classify ticket complexity and route to the appropriate agent path.

**How it works:**
1. Triggered by ADO webhook when PBI status changes to "Ready"
2. Reads PBI content (title, description, AC, affected repo)
3. Classifies complexity using:
   - **Static signals:** file count estimate, repo affected, keywords
   - **Sensitivity manifest:** high-risk files (auth/*, payments/*, migrations/*) always uplift
   - **Git hotspot data:** files changed in >50% of recent PRs get uplifted
4. Routes based on classification:

| Classification | Route | Criteria |
|---|---|---|
| Bug / Small | Direct to Engineer Agent | ≤3 files, existing pattern, no sensitive files |
| Medium | Architect Agent → spec → Engineer Agent | 4-10 files, or touches sensitive area |
| Large / Risky | Architect + adversarial review → task split | 11+ files, new pattern, cross-cutting |
| Out of scope | Tag as "manual" in ADO, notify human | Multi-repo, architectural, ambiguous |

**Inputs:** ADO PBI (title, description, AC, repo)
**Outputs:** Task assignment to Engineer Agent (or Architect Agent, or "manual" tag)

**Technology:** Azure Function (TypeScript) + sensitivity manifest (JSON config file)
**Justification:** Deterministic routing with LLM as tiebreaker only. Fails safe (uplifts, never downgrades).

**Failure modes:**
- Misclassification (too low) → Review Agent or human catches at merge gate
- Misclassification (too high) → wastes architect time but safe
- ADO webhook missed → polling fallback every 5 minutes

**Configuration:**
- `SENSITIVITY_MANIFEST_PATH`: JSON file mapping file patterns to risk levels
- `HOTSPOT_THRESHOLD`: 50% (files in >50% of recent PRs = high risk)
- `DEFAULT_CLASSIFICATION`: "medium" (when uncertain, uplift)


---

### 3d. Architect Agent (For Medium/Large Tasks)

**Responsibility:** Produce a brief implementation spec before the Engineer Agent starts work. For large tasks, run adversarial challenge to validate the approach.

**How it works:**
- Medium tasks: Architect Agent reads PBI + relevant source files → produces a 1-page spec (component structure, data flow, key decisions) → passes to Engineer Agent
- Large tasks: Architect Agent produces spec → Dark Architect challenges it (3 rounds) → hardened spec → task split into sub-PBIs → each sub-PBI enters pipeline independently

**Inputs:** PBI content, relevant source files (auto-discovered via codebase search)
**Outputs:** Implementation spec (markdown) attached to PBI, or sub-PBIs created

**Technology:** Same LLM (Claude) with architect-specific system prompt
**Justification:** Prevents Engineer Agent from making wrong structural decisions on complex tasks

**Failure modes:**
- Spec is wrong → Engineer Agent will fail tests, escalate, human reviews
- Over-splitting → more small PRs (safe, just slower)
- Under-splitting → Engineer Agent hits retry cap, escalates

---

### 3e. Engineer Agent (Implementation in Sandbox)

**Responsibility:** Take a PBI (with optional spec) and produce a working implementation with passing tests and video proof.

**How it works:**
1. Sandbox spawns (see 3f)
2. Agent reads: PBI acceptance criteria + spec (if attached) + skill file
3. Creates feature branch: `agent/<pbi-id>-<slug>`
4. Implements the feature/fix
5. Runs verification gauntlet:
   - Build (compile/transpile)
   - Type check (strict mode)
   - Lint (Biome/Ruff)
   - Unit + integration tests
   - Playwright tests with video recording
6. If any step fails → reads error → fixes → re-runs (max 2 retries per step)
7. If still failing after 2 retries → pushes partial work as draft PR → escalates to human
8. If all pass → squashes to single commit → pushes → opens PR with video attached

**Inputs:** PBI (title, AC, repo), implementation spec (optional), skill file
**Outputs:** Git branch pushed, PR opened with video artifact, or escalation

**Technology:** Pilot (quantflow.studio) or Claude Code running in Daytona/E2B sandbox
**Justification:** Pilot has 82% completion rate on Terminal-Bench, built-in quality gates, ADO integration

**Failure modes:**
- Agent can't complete task → escalates after 2 retries (safe)
- Agent produces wrong implementation → caught by tests/Playwright/review/human
- Sandbox crashes → task re-queued automatically (idempotent)
- LLM rate limited → exponential backoff via proxy

**Configuration:**
- `MAX_RETRIES_PER_STEP`: 2
- `MAX_TOTAL_TOKENS`: 200K input, 50K output per task
- `BRANCH_PREFIX`: "agent/"
- `COMMIT_FORMAT`: "feat(<pbi-id>): <description>"

---

### 3f. Sandbox Environment (Isolation)

**Responsibility:** Provide a secure, ephemeral execution environment where the agent can work freely without risk to production systems.

**How it works:**
- Each task gets a fresh container/microVM
- Pre-loaded with: repo clone, dependencies (cached), build tools, Playwright browsers
- Network: NO outbound internet. Only:
  - Unix domain socket to LLM proxy (host-side, schema-validated)
  - Git push to designated branch only (via git proxy)
- Filesystem: read-only mounts for skill files + repo. Writable workspace.
- Lifetime: max 30 minutes. Hard-killed after timeout.
- On completion: container destroyed. Nothing persists except the git branch.

**Security guarantees:**
| Constraint | Implementation |
|---|---|
| No internet | No network interfaces except loopback |
| No production access | No credentials mounted, no connection strings |
| No secrets exposure | .env files excluded from mounts |
| Branch-locked git push | Host-side git proxy allows push only to `agent/<task-id>` branch |
| Time-bounded | 30-minute hard timeout, container killed |
| Ephemeral | Container destroyed after task, no state leaks |

**Technology:** Daytona (primary) or E2B (alternative)
**Justification:** Daytona: <90ms cold start (pre-warmed pool), Docker isolation, $200 free tier. E2B: Firecracker microVMs for stronger isolation if needed.

**LLM communication (critical detail):**
```
Agent (sandbox) → Unix socket → LLM Proxy (host-side) → Anthropic API
```
- Proxy validates request schema (only completion requests allowed)
- Proxy enforces token budget per task
- Proxy rate-limits (30 req/min)
- Agent cannot use the proxy for data exfiltration (schema-locked)

**Failure modes:**
- Sandbox fails to start → retry once, then mark task as "infra-failure" and re-queue
- Timeout hit → partial work committed, draft PR opened, escalated
- LLM proxy down → task paused, retried when proxy recovers

---

### 3g. Playwright Video Proof

**Responsibility:** Record browser-based tests as video evidence that the feature works. Attached to PR for human reviewer.

**How it works:**
- Playwright config in sandbox includes: `video: 'on'`, `trace: 'on'`
- Tests run against the dev server (started inside sandbox)
- On pass: video files (.webm) saved to artifacts directory
- On PR creation: videos uploaded as PR attachments or linked from artifact storage

**Important distinction:**
- The **gate** is test PASS/FAIL (binary, automated)
- The **video** is evidence for the human reviewer (supplementary, not a gate)
- If tests pass but video looks wrong → human catches at merge gate

**Technology:** Playwright (built-in video recording, no additional tooling)
**Justification:** Already in our test stack. Native video support. Trace viewer for debugging.

**Configuration:**
- `VIDEO_MODE`: "on" (always record) or "retain-on-failure" (save space)
- `VIDEO_SIZE`: { width: 1280, height: 720 }
- `TRACE_MODE`: "on" (full trace for debugging)

---

### 3h. Review Agent (Automated Code Review)

**Responsibility:** Review the PR diff against codebase patterns, security rules, and learned anti-patterns before human sees it.

**How it works:**
1. Triggered by GitHub webhook (PR opened by agent)
2. Reads: PR diff, changed files in full, skill file (review-agent.md)
3. Checks against:
   - Codebase patterns (does it match existing style in that area?)
   - Security rules (auth checks, input validation, no secrets in code)
   - Performance patterns (N+1 queries, unnecessary re-renders)
   - Test coverage (new code has corresponding tests?)
   - Learned anti-patterns from skill file
4. Outputs: APPROVE or REQUEST_CHANGES with specific line comments

**Inputs:** PR diff, full file context, review skill file
**Outputs:** GitHub review (approve or request changes with comments)

**Technology:** Azure Function + Claude API + GitHub API (or CodeRabbit as alternative/complement)
**Justification:** Custom review agent uses our skill file (team-specific patterns). CodeRabbit adds a second opinion.

**Failure modes:**
- Review Agent misses something → human catches at merge gate
- Review Agent is too strict (false positives) → engineer agent wastes retries → skill file adjusted
- Review Agent approves bad code → human is the final gate (this is why human gate exists)

**Configuration:**
- `AUTO_APPROVE_THRESHOLD`: never (always requires human final approval)
- `MAX_COMMENTS_PER_REVIEW`: 10 (prioritize most important issues)
- `REVIEW_TIMEOUT`: 5 minutes (if review takes longer, flag for investigation)

---

### 3i. Fix Loop (Engineer ↔ Reviewer Cycle)

**Responsibility:** When Review Agent requests changes, route feedback back to Engineer Agent for fixing.

**How it works:**
1. Review Agent posts REQUEST_CHANGES on PR
2. Fix Loop controller reads the review comments
3. Spawns new sandbox with: original branch + review comments as context
4. Engineer Agent reads comments, applies fixes, pushes to same branch
5. Review Agent re-reviews
6. Max 2 fix cycles. If still failing → escalate to human

**Cycle tracking:**
```
Cycle 1: Engineer implements → Review requests changes → Engineer fixes
Cycle 2: Review re-reviews → still has issues → Engineer fixes again
Cycle 3: DOES NOT HAPPEN → escalate to human with full context
```

**Inputs:** PR review comments, original branch
**Outputs:** Updated PR (fixed) or escalation

**Escalation includes:**
- Link to PR with all review comments visible
- Summary: "Review Agent flagged X, Y, Z. Agent attempted fixes but couldn't resolve Z."
- ADO PBI tagged "needs-human"
- Teams notification to the original requester

---

### 3j. Human Merge Gate

**Responsibility:** Final human approval before code reaches main branch.

**What the human sees:**
```
PR: feat(ADO-1234): add connector detail page

✅ CI passing (build + tests + lint)
✅ Review Agent: approved
✅ Playwright: 3/3 tests passing
🎬 Video: connector-detail-happy-path.webm (18s)

Acceptance Criteria (from PBI):
☑ Detail page loads from connector list
☑ Shows config, run history, health status
☑ Error state for not-found

Diff: +142 / -3 lines across 4 files
```

**Human decision time:** 2-5 minutes (not 30+ minutes of full review)

**What the human checks:**
- Does this match what we asked for? (intent, not implementation)
- Does the video show the right behavior?
- Any red flags in the diff? (the mechanical stuff is already verified)

**Anti-fatigue measures:**
- Max 3 agent PRs per reviewer per day (excess queues)
- Quarterly seeded defects (canary PRs) test reviewer attention
- Reviewer approval rate >98% over 2 weeks triggers awareness notification
- Mandatory checklist generated from AC (reviewer checks each item)

**Technology:** GitHub branch protection (require 1 approval) + PR template
**Justification:** Platform-enforced. Cannot be bypassed even if process breaks down.

---

### 3k. Skill Evolution Engine

**Responsibility:** Agents improve over time by learning from task outcomes.

**How it works:**

**After every task:**
- Record: task type, approach taken, outcome (first-try / retries / escalated), human changes at merge
- If human edited PBI → Ticket Agent skill file updated (occurrence +1)
- If Review Agent missed something human caught → Review Agent skill file updated
- If Engineer needed retries → pattern recorded in Engineer skill file

**Promotion rule (2-occurrence):**
- First time a pattern is seen → recorded as observation
- Second time same pattern → promoted to permanent rule in skill file
- Pattern must have succeeded in ≥3 tasks with no production incidents within 30 days

**Demotion triggers:**
- Production incident traced to a skill pattern → immediate demotion
- Human overrides a skill-based decision 3+ times → flagged for review
- Pattern unused for 90 days → candidate for removal

**Weekly dreaming cycle (automated, Sunday night):**
- Scan all task outcomes from the week
- Cluster by failure type
- Propose new rules for recurring failures
- Propose removing rules that never triggered
- Output: summary for Monday morning human review (5-10 minutes)

**Quarterly skill audit (human-led, 2 hours):**
- Review full active skill set against architectural intent
- Kill skills that codify patterns the team is moving away from
- Prevents skill library from drifting toward the codebase's past

**Skill file structure (per agent):**
```
pipeline-skills/
├── ticket-agent.md       ← How to parse conversations into good PBIs
├── orchestrator-agent.md ← How to classify and route tickets
├── engineer-agent.md     ← Implementation patterns per repo
├── review-agent.md       ← What to check, what to flag, what to pass
└── evolution-log.md      ← Change history with timestamps and triggers
```

**Technology:** Markdown files in a git repo (versioned, auditable, human-readable)
**Justification:** Simple, transparent, version-controlled. No database needed. Humans can read and edit directly.


---

## 4. Security Model

### 4.1 Defense in Depth

```
Layer 1: Sandbox isolation (no internet, no production, ephemeral)
Layer 2: Credential scoping (per-task tokens, branch-locked, 1-hour lifetime)
Layer 3: Output inspection (Review Agent scans for secrets, anomalies)
Layer 4: Human gate (all PRs require human approval)
Layer 5: Audit trail (every action logged with task ID, timestamp, actor)
```

### 4.2 Sandbox Network Security

| What | Allowed | Blocked |
|---|---|---|
| LLM API calls | Via host-side proxy only (schema-validated) | Direct internet access |
| Git push | To assigned branch only (via git proxy) | Push to main, other branches, other repos |
| Package install | From pre-cached image + internal registry | External package registries |
| File access | Workspace directory only | Host filesystem, other sandboxes |
| Secrets | None mounted | .env, credentials, keys |

### 4.3 Credential Management

- **GitHub tokens:** Fine-grained PATs created per-task via GitHub App installation. Scope: single repo, `contents:write` + `pull_requests:write`. Lifetime: 1 hour. Revoked after task completes.
- **LLM API key:** Held by host-side proxy only. Never enters sandbox.
- **ADO token:** Held by orchestrator function only. Never enters sandbox.
- **No static credentials:** Everything is short-lived and auto-rotated.

### 4.4 Prompt Injection Defense

**Acknowledged reality:** PBI content IS the instruction to the agent. We cannot "sanitize" it without breaking functionality.

**Defense model assumes agent CAN be compromised:**
1. Compromised agent in sandbox → can't reach internet, can't read secrets, can't push to unauthorized branches
2. Compromised agent pushes bad code → Review Agent flags anomalies, human reviews before merge
3. Worst case: bad PR gets created → human rejects it. No production impact.

**Residual risk:** Agent could encode sensitive data in commit messages or PR descriptions. Mitigated by Review Agent scanning + human review. Accepted as low-probability, low-impact.

### 4.5 Data Sent to LLM

| Sent | Not Sent |
|---|---|
| PBI acceptance criteria | .env files |
| Relevant source files (max 50 per request) | Credentials / secrets |
| Skill library patterns | Full repository |
| Test output on failure | Production data |
| Error messages | Customer PII |

**Token budget as exposure limiter:** 200K input tokens per task ≈ 800KB of source code. A small fraction of any repo.

**LLM provider requirement:** Zero-retention agreement (data not used for training, not stored beyond request processing). Contractual control backed by SOC 2 Type II certification.

### 4.6 Audit Trail

Every action is logged:
- Who requested the ticket (Teams user ID)
- Who confirmed the PBI (approver ID)
- What the agent did (full task log with timestamps)
- What was pushed (commit SHA, branch, files changed)
- Who reviewed (Review Agent findings + human approver)
- Outcome (merged / rejected / escalated)

Stored in: Azure Table Storage / DynamoDB (immutable, 1-year retention).

---

## 5. Team Structure

### 5.1 Before (Current State)

10-20 engineers spending their time:
- ~40% writing implementation code
- ~18% reviewing PRs
- ~15% in meetings / coordination
- ~12% debugging
- ~10% design / architecture
- ~5% DevOps / tooling

### 5.2 After (Steady State, Phase 3)

Same 10-20 engineers spending their time:
- ~5% writing routine code (agents handle 29% of PBIs)
- ~10% reviewing agent PRs (3 min each, max 3/day)
- ~15% in meetings / coordination (unchanged)
- ~15% debugging complex issues + agent escalations
- ~25% design / architecture / spec writing (the highest-leverage work)
- ~15% complex implementation (the 71% agents can't do)
- ~10% system improvement (skill files, pipeline tuning, architecture decisions)
- ~5% DevOps / tooling (unchanged)

### 5.3 New Responsibilities

| Role | New Responsibility | Time Investment |
|---|---|---|
| All engineers | Review agent PRs (2-5 min each, max 3/day) | ~30 min/day |
| All engineers | Write better specs/ACs (feeds agent quality) | Part of existing design work |
| 2 engineers (rotating) | Pipeline on-call (monitor health, handle infra issues) | 1 week rotation |
| Tech lead | Quarterly skill audit | 2 hours/quarter |
| All engineers | Weekly skill review (Monday morning) | 5-10 min/week |

### 5.4 What Engineers Stop Doing

- Writing CRUD endpoints by hand
- Writing boilerplate tests for well-defined behavior
- Fixing lint errors and formatting issues
- Implementing tickets with clear, unambiguous acceptance criteria
- Routine bug fixes with obvious reproduction steps

### 5.5 Cell Structure (Phase 2+)

Teams organize into cells aligned to repositories:

| Cell | Repo | Humans | Agents |
|---|---|---|---|
| Frontend | Ubiquity-WebApps | 4-6 | 12-18 |
| Backend | QT-Ubi-UbiquityBackend | 3-5 | 9-15 |
| Connectors | Ubiquity-Connectors-Prefect | 2-3 | 6-9 |
| Platform | ubiquity-protos + platform-api | 2-3 | 6-9 |

Each cell operates independently. Cross-cell coordination happens through typed contracts (proto definitions, versioned packages).

---

## 6. Phased Rollout Plan

### Phase 1a: Review Agent Only (Weeks 1-4)

**What:** Deploy Review Agent against human-written PRs. Advisory only (posts comments, doesn't block).

**Entry criteria:**
- LLM provider contract signed (zero-retention)
- Azure Function infrastructure provisioned
- GitHub App created with appropriate permissions
- Review Agent skill file seeded with existing team conventions

**Exit criteria (go/no-go for Phase 1b):**
- Review Agent suggestions accepted >70% of the time
- No false-positive rate >30%
- Team feedback: "helpful" not "annoying"
- Cost validated: <$100/month

**Success metrics:**
- Review suggestion acceptance rate
- Time-to-first-review reduction
- Engineer satisfaction survey

**Risk:** Zero. Advisory only. Worst case: unhelpful comments that get ignored.
**Cost:** ~$50-100/month (LLM API for review only)
**Team effort:** 1 engineer, 2 days setup + 2 weeks tuning

---

### Phase 1b: Single-Repo Pilot (Weeks 5-10)

**What:** Full pipeline on ONE repo (recommend: Connectors, smallest + most isolated). 2-3 engineers participate. Only bug/small tasks routed to agents.

**Entry criteria:**
- Phase 1a exit criteria met
- Sandbox infrastructure provisioned (Daytona account + config)
- Teams bot deployed (slash command only)
- Orchestrator function deployed
- Engineer Agent configured for target repo
- Skill files seeded

**Exit criteria (go/no-go for Phase 2):**
- Agent task completion rate >60% (without human intervention)
- Average task time <2 hours (ticket to PR)
- Human merge rejection rate <20%
- No production incidents caused by agent code
- Cost per task validated

**Success metrics:**
- Task completion rate (target: >60%)
- Time from PBI to PR opened
- Human intervention rate
- Cost per completed task

**Risk:** Low. Single repo, small task scope, full human review.
**Cost:** ~$500-1000/month (LLM + sandbox compute)
**Team effort:** 1-2 engineers, 4 weeks build + 2 weeks validation

---

### Phase 2: Multi-Repo Expansion (Weeks 11-20)

**What:** Expand to all repos. Enable medium-complexity routing (architect agent). Full team participates.

**Entry criteria:**
- Phase 1b exit criteria met
- Skill files validated across repos
- Sensitivity manifest created for all repos
- Team trained on new workflow (reviewing agent PRs, writing good ACs)

**Exit criteria (go/no-go for Phase 3):**
- Agent handles >30% of eligible PBIs successfully
- Deployment frequency increased (measurable)
- Team reports net positive experience
- ROI tracking shows positive trajectory

**Success metrics:**
- % of PBIs handled autonomously
- Deployment frequency (before/after)
- Engineer time allocation shift (measured via survey)
- Skill library growth rate

**Risk:** Medium. More repos, more complexity. Mitigated by gradual expansion (one repo at a time).
**Cost:** ~$2,000-4,000/month
**Team effort:** 0.5 FTE ongoing maintenance (distributed via rotation)

---

### Phase 3: Steady State (Week 21+)

**What:** Full pipeline operational. Skill evolution running. Continuous improvement.

**Ongoing activities:**
- Weekly skill review (5-10 min Monday morning)
- Quarterly skill audit (2 hours)
- Quarterly chaos drills (test rollback triggers)
- Monthly cost review
- Pipeline on-call rotation (1 week per engineer)

**Rollback triggers (automated):**
1. Agent PR rejection rate >30% over 24 hours → pause pipeline, alert team
2. Human merge-time change requests >3 per day → reduce autonomy tier
3. Daily LLM spend >2x rolling 7-day average → throttle to 50% capacity

---

## 7. Cost Model

### 7.1 Monthly Operating Costs (Steady State, 15 Engineers)

| Item | Calculation | Monthly Cost |
|---|---|---|
| LLM API (Claude) | ~220 tasks/mo × 250K tokens avg × $3/MTok | $690 |
| Sandbox compute (Daytona) | ~220 tasks × 20 min avg × $0.14/vCPU-hr × 2 vCPU | $340 |
| CodeRabbit (review complement) | 15 seats × $15 | $225 |
| Azure Functions (orchestrator) | ~1000 invocations/mo | $50 |
| Artifact storage (videos) | ~50GB/mo | $25 |
| **Total operating** | | **$1,330/month** |

### 7.2 Setup Costs (One-Time)

| Item | Effort | Cost (at $90/hr loaded) |
|---|---|---|
| Phase 1a: Review Agent | 1 engineer × 2 weeks | $7,200 |
| Phase 1b: Full pipeline (1 repo) | 2 engineers × 4 weeks | $57,600 |
| Phase 2: Multi-repo expansion | 1 engineer × 6 weeks | $43,200 |
| Infrastructure provisioning | 1 engineer × 1 week | $3,600 |
| Team training | All engineers × 2 hours | $2,700 |
| **Total setup** | | **$114,300** |

### 7.3 Ongoing Maintenance

| Item | Effort | Monthly Cost |
|---|---|---|
| Pipeline on-call (0.25 FTE distributed) | ~40 hrs/mo | $3,600 |
| Skill file maintenance | ~8 hrs/mo (all engineers) | $720 |
| Quarterly audit (amortized) | ~2 hrs/quarter | $45 |
| **Total maintenance** | | **$4,365/month** |

### 7.4 ROI Calculation (Conservative)

**Monthly value delivered:**
- 220 tasks/mo × 60% completion rate = 132 tasks automated
- 132 tasks × 2.5 hours average (human implementation time saved) = 330 hours
- 330 hours × $90/hr = **$29,700/month saved**

**Monthly total cost:** $1,330 (operating) + $4,365 (maintenance) = **$5,695/month**

**Net monthly value:** $29,700 - $5,695 = **$24,005/month**

**Payback period:** $114,300 ÷ $24,005 = **4.8 months**

**Annual ROI (Year 2):** ($24,005 × 12) ÷ $114,300 = **252%**

### 7.5 Sensitivity Analysis

| Scenario | Tasks Automated | Payback | Annual ROI |
|---|---|---|---|
| Optimistic (75% completion) | 165/mo | 3.6 months | 380% |
| **Conservative (60% completion)** | **132/mo** | **4.8 months** | **252%** |
| Pessimistic (40% completion) | 88/mo | 8.2 months | 100% |
| Worst case (25% completion) | 55/mo | 16 months | 35% |

Even worst case is ROI-positive within 16 months.


---

## 8. Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Residual Risk | Owner |
|---|---|---|---|---|---|---|
| R1 | Agent produces subtly wrong code that passes all gates | Medium | High | Behavioral Playwright tests + human merge review + skill evolution catches repeats | First occurrence of a novel subtle bug may ship (same as human engineers) | Tech Lead |
| R2 | LLM provider changes pricing/terms | Medium | Medium | Provider-agnostic interface + Azure OpenAI as pre-built fallback + budget alerts | 30-day migration effort if provider switch needed | Platform Engineer |
| R3 | Human reviewers rubber-stamp agent PRs | High | High | Max 3 agent PRs/day per reviewer + canary PRs + mandatory AC checklist + approval rate monitoring | Cultural risk remains (humans trust automation over time) | Engineering Manager |
| R4 | Skill library drifts toward bad patterns | Medium | Medium | 2-occurrence rule + 30-day incident check + quarterly audit against architectural intent + immediate demotion on incident | Slow drift between audits possible | Tech Lead |
| R5 | Sandbox escape (agent accesses unauthorized resources) | Very Low | Critical | No network + branch-locked git proxy + ephemeral containers + no secrets mounted | Theoretical zero-day in container runtime | Platform Engineer |
| R6 | Pipeline infrastructure fails silently | Medium | Medium | Daily 9am synthetic PBI health check + webhook monitoring + alerting on queue depth | Brief window between failure and detection (max 15 min with health checks) | On-call rotation |
| R7 | Team resistance to new workflow | Medium | Medium | Phase 1a is zero-risk (advisory only) + explicit exit ramps + team involved in skill file creation | Some engineers may never adopt | Engineering Manager |
| R8 | Cost exceeds projections | Low | Low | Per-task budget caps + daily spend monitoring + 2x threshold auto-throttle | Throttling reduces throughput temporarily | Platform Engineer |
| R9 | Cross-repo task incorrectly classified as single-repo | Medium | Medium | Sensitivity manifest + git hotspot data + default-to-uplift policy | Caught at test/review stage if misclassified | Orchestrator config owner |
| R10 | LLM quality degrades on model update | Low | High | Validation suite (50 reference tasks) run before promoting new model + canary deployment (10% traffic) + automatic fallback | 1-2 week detection window for subtle degradation | Platform Engineer |

---

## 9. Success Metrics & KPIs

### Primary Metrics (Report Monthly)

| Metric | Target (Phase 2) | Target (Phase 3) | How Measured |
|---|---|---|---|
| Agent task completion rate | >50% | >65% | Tasks completed without human intervention / total tasks attempted |
| Time: PBI to PR opened | <4 hours | <2 hours | Timestamp diff (ADO PBI "Ready" → GitHub PR opened) |
| Human merge rejection rate | <25% | <15% | PRs rejected at human gate / total agent PRs |
| Deployment frequency | +25% vs baseline | +50% vs baseline | Deploys per week (measured from CI/CD) |
| Engineer time on routine work | -20% | -35% | Quarterly time allocation survey |

### Secondary Metrics (Report Quarterly)

| Metric | Target | How Measured |
|---|---|---|
| Skill library growth | 5-10 new patterns/quarter | Count of promoted skill entries |
| Escalation resolution time | <1 hour | Time from escalation to human completing the task |
| Pipeline uptime | >99% | Health check pass rate |
| Cost per automated task | <$5 | Total monthly cost / tasks completed |
| Production incidents from agent code | 0 | Incident post-mortems traced to agent PRs |

### Evaluation Cadence

- **Weekly:** Task completion rate, cost, escalation count (automated dashboard)
- **Monthly:** Full metrics review, trend analysis, skill file proposals
- **Quarterly:** ROI validation, skill audit, chaos drill, team satisfaction survey

### Kill Criteria (When to Stop)

- Phase 1a: Review Agent suggestions rejected >30% → pause, retune or abandon
- Phase 1b: Completion rate <40% after 4 weeks → re-evaluate approach
- Phase 2: Production incident caused by agent code → immediate pause, post-mortem
- Any phase: Team satisfaction drops below "neutral" → pause, address concerns

---

## 10. Decision Log

| # | Decision | Alternatives Considered | Why This Choice |
|---|---|---|---|
| ADR-001 | Cell-based team structure (Phase 2) | Command hierarchy, Swarm, Assembly Line, Arena | Validated via adversarial tournament. Cells map to existing repo boundaries. Scales naturally. Resilient (one cell failing doesn't break others). |
| ADR-002 | Command structure as Phase 1 on-ramp | Jump straight to cells | Team needs to learn what works before distributing control. Single orchestrator builds institutional knowledge. |
| ADR-003 | Human merge gate (never auto-merge) | Full autonomy for low-risk PRs | Human attention is the load-bearing safety wall. Removing it requires re-evaluating the entire security model. Stripe keeps human review at 1,300 PRs/week. |
| ADR-004 | 2-retry cap then escalate | Unlimited retries, 1 retry, 3 retries | Stripe data: diminishing returns after 2 attempts with same model. 3rd retry succeeds <15% of the time. Cost of escalation ($45) vs cost of 3rd retry ($3) + low success rate. |
| ADR-005 | Pilot as engineer agent runtime | Devin, Codex, custom Claude Code wrapper, AWS Q | Pilot: open source, self-hosted, #1 Terminal-Bench (82%), has ADO integration, built-in self-improvement. Devin: $500/mo/seat, black box. Codex: no ADO. AWS Q: no ADO, weaker at general dev. |
| ADR-006 | Claude as LLM provider | GPT-4o, Gemini, open-source models | Best coding performance (benchmarks), zero-retention available, Pilot native support. Fallback to Azure OpenAI pre-built but dormant. |
| ADR-007 | Daytona for sandbox | E2B, Docker self-hosted, GitHub Actions | <90ms cold start (pre-warmed), Docker-based (familiar), $200 free tier, good docs. E2B is alternative if stronger isolation needed. |
| ADR-008 | Slash command (not passive monitoring) for Teams | Auto-detect conversations, emoji reactions | Zero false positives. Passive monitoring creates noise and trust issues. Explicit intent is clearer. |
| ADR-009 | Single-repo scope only | Cross-repo autonomous coordination | Sprint audit: 59% of PBIs are single-repo. Cross-repo coordination is the hardest unsolved problem in multi-agent systems. Scope to what works. |
| ADR-010 | Incremental rollout (1a → 1b → 2 → 3) | Big bang deployment | Each phase has explicit exit criteria. Phase 1a is zero-risk. Builds confidence incrementally. Allows course correction. |
| ADR-011 | Hybrid B+ (GitHub native primary, custom escape hatch) | Pure custom (Pilot+Daytona) or pure native | Validated via deathmatch tournament. Native wins on cost ($200 vs $1,300/mo), time (1-2 vs 4-6 weeks), maintenance (2 vs 6 components). Custom retained as escape hatch if native fails on measured criteria. Assumptions: GitHub continues agent investment, team ≤20, 70%+ tasks single-repo. |

---

## 11. Dependencies & Prerequisites

### Must Have Before Phase 1a

| Dependency | Status | Owner | Action |
|---|---|---|---|
| LLM provider contract (zero-retention) | Not started | Legal + Platform | Initiate Anthropic enterprise agreement |
| Azure Function infrastructure | Exists (shared) | Platform | Provision dedicated function app |
| GitHub App (for PR creation + review) | Not started | Platform | Create app with scoped permissions |
| Team buy-in (at least 2-3 volunteers for pilot) | In progress | Engineering Manager | Present this proposal, get volunteers |

### Must Have Before Phase 1b

| Dependency | Status | Owner | Action |
|---|---|---|---|
| Daytona account + sandbox configuration | Not started | Platform | Sign up, configure base image |
| Teams bot registration | Not started | Platform | Register bot in Azure AD |
| Pilot installation + configuration | Not started | Platform | Deploy, configure for target repo |
| Sensitivity manifest (target repo) | Not started | Tech Lead | Map high-risk files/directories |
| Initial skill files (seeded from existing conventions) | Not started | All engineers | Extract patterns from existing guides/linting rules |
| Playwright tests exist for target repo | Partial | Frontend team | Ensure baseline test coverage for key flows |

### Nice to Have (Not Blocking)

| Dependency | Benefit | When Needed |
|---|---|---|
| CodeRabbit subscription | Second review opinion | Phase 2 |
| Azure Monitor integration | Alert-triggered triage (future) | Phase 3+ |
| Cost monitoring dashboard | Real-time spend visibility | Phase 1b |

---

## 12. Frequently Asked Questions

**Q: Why not just buy Copilot Workspace / Devin?**
No commercial tool integrates with Azure DevOps PBIs as the source of truth, runs in our security boundary, learns our specific patterns, or handles the full PBI-to-PR lifecycle. We evaluated five tools (Section 3.8 in full doc). We still use Copilot for interactive coding - the pipeline handles autonomous work. They're complementary.

**Q: The ROI numbers seem optimistic.**
The primary model is conservative: 60% completion rate, 330 hours/month saved, 4.8-month payback. Even worst case (25% completion, 16-month payback) is positive. We present four scenarios so the team can pick the one they believe. Phase 1b will generate real data to validate.

**Q: Who maintains this when the builders move on?**
CODEOWNERS requires 2+ engineers per component. Sprint pairing sessions ensure ≥4 engineers have hands-on experience by Phase 3. Standard tech stack (TypeScript, Docker, GitHub Actions) - no exotic knowledge required. 0.5 FTE maintenance distributed via on-call rotation.

**Q: What about the 71% of work this doesn't handle?**
Removing routine work creates uninterrupted blocks for complex work. The Review Agent improves ALL PRs (not just agent PRs). The skill library helps onboarding. Better specs (required for agents) help humans too. The investment serves the full team.

**Q: What if the agents produce bad code that reaches production?**
Same risk as a human engineer. The gauntlet (compiler → types → tests → Playwright → Review Agent → human review) is MORE verification than most human PRs get today. If a bug passes all of these, it would have passed human review too. Skill evolution means the same bug type is caught next time.

**Q: Is this going to replace engineers?**
No. It changes what they do. Engineers shift from typing code to designing systems, writing specs, reviewing agent output, and handling the hard problems. Same team, different work, more output. See Section 5 for detailed before/after.

---

## 13. Glossary

| Term | Definition |
|---|---|
| PBI | Product Backlog Item - a work item in Azure DevOps |
| Sandbox | Isolated container where agents run. No internet, no production access, destroyed after each task. |
| Skill file | A markdown file containing learned patterns that an agent reads before every task. Grows over time. |
| Cell | A self-contained team unit (2-5 humans + agents) that owns one area of the codebase. |
| Worktree | A git feature allowing multiple working copies of a repo on different branches simultaneously. |
| Ephemeral | Temporary. Created for one task, destroyed after. No state persists between tasks. |
| Canary PR | A deliberately flawed PR planted to test whether human reviewers are paying attention. |
| Sensitivity manifest | A configuration file mapping file paths to risk levels (e.g., auth/* = always high risk). |
| Hotspot | A file that appears in many recent PRs, indicating high coupling or frequent change. |
| Token budget | Maximum amount of LLM input/output allowed per task. Prevents cost spirals. |
| Chain-contract CI | Integration tests that verify multi-repo changes work together before any individual PR merges. |
| Dreaming cycle | Automated weekly process where agents review their own outcomes and propose skill improvements. |
| Fix loop | The cycle where Review Agent requests changes and Engineer Agent applies them (max 2 cycles). |
| Escalation | When an agent can't complete a task after retries, it hands off to a human with full context. |
| Rollback trigger | Automated condition that pauses the pipeline when quality degrades (error rate, cost, rejection rate). |

---

## Appendix: Build vs. Buy Analysis

| Tool | Monthly Cost (15 users) | Why It Doesn't Fit Our Context |
|---|---|---|
| GitHub Copilot Workspace | $585/mo | No ADO PBI integration, no custom test suites in isolation, no skill learning |
| Devin (Cognition) | ~$3,000/mo | Black-box environment, can't run in our network for gRPC, vendor lock-in |
| Factory (Code) | $2,500+/mo | Enterprise waitlist, no .NET support, no self-hosted option |
| Cursor/Windsurf | $300/mo | Developer-in-the-loop only, no autonomous pipeline, no PBI workflow |
| AWS Q Developer | $285/mo | No ADO integration, no Teams integration, weaker at general dev vs AWS-specific |

**What we DO buy:** GitHub Copilot individual licenses ($19/user) remain active for interactive coding. Pipeline handles autonomous work. Complementary, not competing.


---

## 14. External References & Prior Art

### Production Implementations

| Reference | URL | Relevance |
|---|---|---|
| Stripe Minions (1,300 PRs/week) | https://jangwook.net/en/blog/en/stripe-minions-autonomous-coding-agents-1300-prs/ | Closest production precedent. Slack → sandboxed VM → PR → human review. Blueprint architecture. |
| Pilot (quantflow.studio) | https://pilot.quantflow.studio/ | Open-source ticket-to-PR pipeline. #1 Terminal-Bench (82%). ADO + Jira + GitHub integration. Self-improvement built in. |
| AWS Sample Autonomous Cloud Coding Agents | https://github.com/aws-samples/sample-autonomous-cloud-coding-agents | AWS reference architecture. CDK + Lambda orchestrator + AgentCore MicroVMs. Open source. |
| OpenAI Codex App (multi-agent) | https://openai.com/index/introducing-the-codex-app/ | Cloud agent command center. Parallel task execution. Sandboxed VMs. |
| Greptile "Rise of the Overnight Agents" | https://www.greptile.com/blog/rise-of-the-overnight-agents | Industry trend report: ticket-to-PR with zero human intervention becoming standard. |

### Research & Data

| Reference | URL | Relevance |
|---|---|---|
| DORA Metrics + AI Impact (Faros) | https://www.faros.ai/blog/key-takeaways-from-the-dora-report-2025 | PR volume +98%, review time +91%, deployment frequency flat. The data behind our problem statement. |
| Multi-Agent Failure Rates (Augment Code) | https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them | 41-86% failure rate without coordination. 79% of breakdowns from spec ambiguity + unstructured coordination. |
| Agent Fleet Concurrency (TianPan.co) | https://tianpan.co/blog/2026-04-22-agent-fleet-concurrency-coordination | Thundering herd, AIMD rate limiting, work stealing patterns for agent fleets. |
| Agentic Deadlock (TianPan.co) | https://tianpan.co/blog/2026-04-12-agentic-deadlock-when-ai-agents-wait-for-each-other-forever | 37% of multi-agent failures are coordination breakdowns. |
| Enterprise Agentic Workflows (Augment Code) | https://www.augmentcode.com/guides/how-do-enterprise-teams-build-agentic-workflows | 5-phase approach: context, spec-driven planning, orchestration, quality gates, adoption. |
| Optimizing Software Factories (Tom Tunguz) | https://tomtunguz.com/optimizing-software-factories/ | 50/50 AI/labor ratio analysis. Run at 70-90% utilization. Resilience vs throughput tradeoffs. |
| LLMs Struggle with Coordination (arXiv) | https://arxiv.org/html/2602.13255 | Convergent reasoning: agents independently arrive at identical strategies causing deadlock. |

### Self-Improving Agents

| Reference | URL | Relevance |
|---|---|---|
| Anthropic "Dreaming" for Claude Agents | https://claude.com/blog/new-in-claude-managed-agents | Agents self-improve between sessions. Harvey saw 6x task completion improvement. |
| Letta (stateful agents with memory) | https://github.com/letta-ai/letta | Platform for agents that learn and self-improve over time. |
| Darwin Gödel Machine (arXiv) | https://arxiv.org/abs/2505.22954 | Self-improving agents that rewrite their own code, validated on coding benchmarks. |
| Self-Improving Agent Pipeline (FutureAGI) | https://futureagi.substack.com/p/how-to-build-a-self-improving-ai | Step-by-step guide: catch failures → rewrite prompts → validate improvement. |

### Sandbox & Compute

| Reference | URL | Relevance |
|---|---|---|
| Daytona (sandbox platform) | https://www.daytona.io/pricing | <90ms cold starts, Docker isolation, $200 free compute. |
| E2B (Firecracker microVMs) | https://e2b.dev | 150ms cold starts, strongest isolation, AI-first SDK. |
| AI Sandbox Benchmark 2026 | https://www.superagent.sh/blog/ai-code-sandbox-benchmark-2026 | Modal vs E2B vs Daytona comparison with pricing. |
| Running Codex Safely (OpenAI) | https://openai.com/index/running-codex-safely/ | Sandbox design, approval policies, network isolation patterns. |

### Tooling

| Reference | URL | Relevance |
|---|---|---|
| Playwright Video Recording | https://playwright.dev/docs/videos | Native video capture config for test evidence. |
| Playwright v1.60 Evidence APIs | https://medium.com/@antongulin/playwright-v1-60-turns-test-failures-into-evidence-b4fb96b63c51 | Trace + HAR + ARIA snapshots for debugging agent output. |
| Azure Boards in Teams | https://docs.microsoft.com/azure/devops/boards/integrations/boards-teams | Native ADO + Teams integration for work item creation. |
| Teams Workflow Bot | https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/workflow-bot-in-teams | Building workflow bots that create ADO work items from Teams. |
| CodeRabbit (AI code review) | https://coderabbit.ai | Automated PR review bot. $15/seat. |

### Architecture Patterns

| Reference | URL | Relevance |
|---|---|---|
| AI Agent Orchestration Patterns (Azure) | https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns | Microsoft's official patterns for multi-agent systems. |
| Multi-Agent Orchestration Patterns | https://genmind.ch/posts/Multi-Agent-Orchestration-Patterns-Building-Collaborative-AI-Teams/ | 5+ specialist agents in parallel, work stealing, coordination. |
| 5 Design Patterns for Enterprise Scaling | https://paulserban.eu/blog/post/multi-agent-orchestration-5-design-patterns-for-enterprise-scaling/ | Hierarchical decomposition, consensus-based decisions, coordination protocols. |
| Agent Fleet Management (AIMagicX) | https://www.aimagicx.com/blog/managing-ai-agent-fleets-operations-playbook-2026 | 40% of enterprises running 10+ agents. 3.2x more incidents with fleets. Ops playbook. |
