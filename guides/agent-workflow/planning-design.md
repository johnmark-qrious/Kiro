---
lastVerified:
lastUsedInTask:
---

# Planning & Design Workflow

## When This Guide Applies
- Requirements gathering and documentation
- Feature design and architecture decisions
- Spec creation (requirements.md, design.md)
- Technical design reviews

## Workflow

### Pre-Planning: Health Check Nudge

Before starting any planning work, read `/mnt/c/Users/T828819/.kiro/knowledge/last-health-check.md`.
- If the last health check was **10+ PRs ago** or **30+ days ago**, nudge: “It’s been a while since the last health check. Want to run it before we design on top of the current codebase?”
- Do NOT block planning. Just mention it once and proceed.

---

### Step 0: Ticket Readiness Check (MANDATORY — before any design work)

When the user provides a ticket link or work item ID:

1. Fetch the work item via `wit_get_work_item` with `expand: relations`
2. Analyze for blockers:
   - **Predecessor links** — work items that must complete first (state != Done/Closed)
   - **Parent state** — is the parent PBI in New/Proposed/Removed?
   - **Related/dependency items** — any linked items tagged or stated as blocking?
   - **Item state** — is the item itself Blocked or Removed?
   - **Tags** — any "blocked", "dependency", "waiting" tags?
3. For each blocker found, report:
   - What: title + ID of the blocking item
   - Why: the relationship (predecessor, parent not approved, etc.)
   - Who: assigned to
   - What's needed: what must happen to unblock
4. Verdict:
   - ✅ **Ready** — no blockers, proceed to @architect
   - ⚠️ **Partially ready** — some work can start (specify what), but full implementation is blocked (specify why). Ask user: "Want to proceed with the unblocked scope, or wait?"
   - 🛑 **Blocked** — cannot meaningfully start. Present the blocker summary and STOP. Do not proceed to @architect.

Only proceed past this step on ✅ or user-approved ⚠️.

---

1. **@architect** produces the document (requirements, design, or both)
2. **Figma Structural Diff (when Figma link exists)**  before finalizing the design, use the Figma MCP to fetch the relevant screens and compare the layout structure (sections, field groupings, field order) against the current code. Flag any fields that moved between sections, sections that were added/removed, or layout changes not mentioned in the ticket. These become separate tasks in the implementation plan. If no Figma link is provided, skip this step.
3. **Acceptance Criteria Validation (MANDATORY)** — before proceeding, cross-check the produced document against the ticket's acceptance criteria:
   - Extract every acceptance criterion from the PBI/ticket (fetched in Step 0)
   - For each AC, verify it is explicitly addressed in the requirements or design doc
   - Produce a coverage matrix:
     ```
     | # | Acceptance Criterion | Covered In | Status |
     |---|---------------------|------------|--------|
     | 1 | Users can filter by date range | Requirements §3.2 | ✅ Covered |
     | 2 | Export includes all columns | Not addressed | ❌ Gap |
     ```
   - If ANY gaps exist: @architect must revise the document to address them before continuing
   - Only proceed when all ACs show ✅ Covered
4. **Dependency impact analysis (MANDATORY)** — before finalizing design, identify which repos/components are affected. Read `/mnt/c/Users/T828819/.kiro/steering/ubiquity-architecture.md` for the dependency graph, then:
   - List all repos that consume or are consumed by the components being changed
   - For each downstream consumer: what breaks, what needs regeneration
   - Include cross-repo impact in the design doc so tasks account for it
   - If the feature touches protos: explicitly plan regeneration steps for WebApps and Backend
5. **@dark-architect debate (3 rounds)** — the design goes through adversarial review:
   - **Round 1**: @dark-architect critiques the design — structural flaws, wrong trade-offs, missed alternatives, scalability/failure risks
   - **Round 2**: @architect responds to the critique. @dark-architect accepts strong rebuttals, pushes back on weak ones, raises any new concerns
   - **Round 3**: @dark-architect produces a final assessment — resolved concerns and open design risks. The design goes to the user after this round regardless of outcome
6. Present the design + debate outcome to the user for review
   - If there are **Open Design Risks** from the debate, present them clearly so the user can make the call
7. Iterate based on user feedback
8. Only proceed to the next phase when the user approves
9. **Task breakdown (delegate to @taskmaster)** — once the user approves the design, spawn @taskmaster to decompose the design into executable tasks (`tasks.md`). The architect does NOT do task breakdown directly.

## Rules

- Always use @architect for planning and design work
- Never skip user review between phases (requirements → design → tasks)
- When Azure DevOps PBI links are provided, fetch them via `wit_get_work_item` with `expand: relations` before starting
- Include PBI acceptance criteria and testing criteria as inputs to the requirements doc
- If a dependency PBI exists, document it and plan for phased implementation where possible

## Notion Sync

Notion sync happens once at the end of the planning session (or at PR creation), not after every document.
The knowledge base frontmatter `sync: draft` tracks what needs publishing. Run `sync check` when ready.

## Don't Do This

- **Don't skip @architect for planning/design work.** This was already caught and documented — don't regress.
- **Don't skip the readiness check.** When a ticket is provided, Step 0 MUST run before @architect starts. A blocked ticket should not produce a design doc.

## Learned Patterns
<!-- cap: 10 | last-consolidated: never | pr-count-since: 0 -->

- Figma designs may include layout restructuring beyond the ticket scope  check Figma for structural diffs during design phase, not during implementation (1x)
