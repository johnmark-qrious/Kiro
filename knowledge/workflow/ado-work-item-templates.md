---
sync: draft
lastLocalEdit: 2026-05-18T11:34:00+12:00
---

# Azure DevOps Work Item Templates

Templates for writing Epics, PBIs (Product Backlog Items), and Tasks in Ubiquity's Azure DevOps instance. Designed for a small team (6-12 devs) working across multiple repos (WebApps, Backend, Protos, Connectors, Platform API).

## Hierarchy

```
Epic (2-6 months, strategic goal)
  └── PBI / Feature (1 sprint, user-facing value)
        └── Task (hours-days, developer work)
```

---

## Epic Template

**Use for:** Strategic initiatives spanning multiple sprints and potentially multiple repos. Examples: "Connector Management V2", "Admin Billing Module", "Journey Builder MVP".

### Title Format
`[Domain] Short outcome statement`

Example: `[Connectors] Self-service connector management for account admins`

### Description

```markdown
## Business Goal
What business outcome does this achieve? One paragraph max.

## Success Metrics
- [ ] Metric 1 (measurable, time-bound)
- [ ] Metric 2

## Scope
### In Scope
- Capability 1
- Capability 2

### Out of Scope
- Thing we're explicitly NOT doing (and why)

## Repos Affected
- [ ] Ubiquity-WebApps (which app: database / journey-builder / admin)
- [ ] QT-Ubi-UbiquityBackend
- [ ] ubiquity-protos
- [ ] Ubiquity-Connectors-Prefect
- [ ] ubiquity-platform-api

## Dependencies
- External: (third-party APIs, infrastructure, other teams)
- Internal: (other epics or features that must land first)

## Rough Timeline
- Design: [dates]
- Implementation: [dates]
- Target release: [date]
```

### Checklist Before Creating
- Can you explain the "why" in one sentence?
- Is the scope achievable in 2-6 months?
- Have you identified which repos are touched?
- Are dependencies called out?

---

## PBI (Product Backlog Item) Template

**Use for:** A single piece of user-facing value completable within one sprint. Maps to a Feature in Azure Boards if using Scrum process. This is the primary planning unit.

### Title Format
`As a [role], [capability] — [short context]`

or for technical PBIs:

`[Domain] [Action] [Target]`

Examples:
- `As an admin, view automation run history — connector list page`
- `[Billing] Display monthly invoice breakdown per connector`
- `[Connectors] Automation card with status and toggle`

### Description

```markdown
## User Story
As a [specific role],
I want [capability — what they need to do],
so that [benefit — why it matters to them].

## Context
One paragraph of background. Link to design, Figma, or related PBIs.
Why now? What triggered this work?

## Acceptance Criteria

### AC1: [Short name]
- Given [precondition]
- When [action]
- Then [expected result]

### AC2: [Short name]
- Given [precondition]
- When [action]
- Then [expected result]

### AC3: [Short name]
- Given [precondition]
- When [action]
- Then [expected result]

## Edge Cases / Error States
- What happens when [X fails]?
- What happens with [empty state]?
- What happens with [large dataset]?

## Design Reference
[Link to Figma / screenshot / prototype URL]

## Technical Notes (optional)
- API endpoint: [if known]
- Proto service: [if gRPC]
- Existing patterns to follow: [link to similar implementation]

## Out of Scope
- [Thing that looks related but isn't part of this PBI]
```

### Quality Checklist (INVEST)

| Criteria | Question |
|----------|----------|
| Independent | Can this be built without waiting on another PBI? |
| Negotiable | Is the "how" open for discussion? |
| Estimable | Does the team have enough info to estimate? |
| Small | Completable in one sprint (1-5 dev days)? |
| Testable | Can every AC be verified with a test? |

### AC Rules
- 3-7 acceptance criteria per PBI
- Each AC must be independently testable
- No implementation details in AC (no "use a modal", "call endpoint X")
- Include at least one error/edge case AC
- If you have 10+ AC, split the PBI

### Splitting Strategies (when PBI is too big)

| Strategy | Example |
|----------|---------|
| By workflow step | "Add connector" vs "Configure connector" vs "Test connector" |
| By user type | "Admin views billing" vs "Super admin exports billing" |
| By happy path vs error | "Successful import" vs "Failed import with retry" |
| By data type | "Import contacts" vs "Import transactional" |
| By repo boundary | "Proto contract" vs "Backend implementation" vs "Frontend UI" |

---

## Task Template

**Use for:** Developer-scoped work that implements part of a PBI. Should be completable in hours to 1-2 days. Each task should produce a reviewable unit of work (ideally maps to a commit or small PR).

### Title Format
`[verb] [what] [where]`

Examples:
- `Add AutomationCard component with status display`
- `Create GetBillingReport gRPC endpoint`
- `Add automation.proto message definitions`
- `Write unit tests for ConnectionRow toggle behavior`

### Description

```markdown
## What
One sentence: what this task produces.

## Files
- `path/to/file1.tsx` — [what changes]
- `path/to/file2.ts` — [what changes]

## Acceptance Criteria
- [ ] [Specific, testable outcome 1]
- [ ] [Specific, testable outcome 2]
- [ ] [Specific, testable outcome 3]
- [ ] Tests pass (unit / integration as appropriate)
- [ ] Lint clean

## Implementation Notes (optional)
- Follow pattern in [existing file]
- Use [specific library/approach]
- Watch out for [known gotcha]

## Blocked By
- [Task ID] (if sequential dependency)
```

### Task Rules
- Every task MUST have testable AC (even if it's just "lint passes, tests pass")
- Tasks should be 2-8 hours of work. If bigger, split.
- Include file paths when known — helps with PR scoping
- Don't create tasks for things that don't produce real output (no "research" tasks without a deliverable)
- 2-4 tasks per PBI is the sweet spot. More than 6 means the PBI is too big.

---

## Anti-Patterns (Don't Do This)

| Bad | Why | Fix |
|-----|-----|-----|
| "As a user, I want a dashboard" | No specific role, no benefit, no scope | Name the role, state the benefit, add AC |
| "Implement billing" | Epic disguised as PBI | Split into sprint-sized PBIs |
| "Research X" | No deliverable | "Spike: produce decision doc for X (timebox: 4h)" |
| "As a developer, I want to refactor Y" | Technical task, not user value | Either frame as user benefit or track as tech debt task |
| AC: "Use a modal with 400px width" | Implementation detail in AC | Describe the behavior, link to design for visuals |
| 15 acceptance criteria | PBI is too big | Split by workflow step or happy/error path |
| Task: "Coding" | Too vague | Name the specific output and files |
| PBI with no error state AC | Incomplete spec | Always include at least one failure scenario |

---

## Ubiquity-Specific Conventions

### Cross-Repo PBIs
When a feature spans repos, create one PBI per repo with clear dependency links:
1. Proto PBI (lands first) — defines the contract
2. Backend PBI (depends on proto) — implements the service
3. Frontend PBI (depends on proto, optionally backend) — builds the UI

Link them with Predecessor/Successor in ADO.

### Proto-Touching PBIs
Must include in AC:
- `buf breaking` passes against main
- At least one downstream consumer compiles with the new contract
- Generated packages version-bumped

### Frontend PBIs
Should reference:
- Which app (database / admin / journey-builder)
- Design link (Figma or prototype URL)
- Which existing patterns to follow (link to similar component)

### Backend PBIs
Should reference:
- Which domain (system / list / mail / billing etc.)
- Whether it's gRPC, REST v1, or REST v2
- Test coverage expectations (NUnit)

---

## Quick Reference: Good PBI Example

**Title:** As an account admin, view automation run status — connector list page

**Description:**

> ## User Story
> As an account admin,
> I want to see the last run status and time for each automation in my connector list,
> so that I can quickly identify failed imports without opening each automation individually.
>
> ## Context
> Part of Connector Management V2 epic. The connector list page (PR #201) shows connections
> but currently has no automation visibility. This adds the AutomationCard component inside
> expanded connection rows.
>
> ## Acceptance Criteria
>
> ### AC1: Status display
> - Given an automation has run at least once
> - When I expand the parent connection row
> - Then I see the automation's last run status (Completed/Failed) and relative timestamp
>
> ### AC2: Active toggle
> - Given I am viewing an automation card
> - When I click the active/paused toggle
> - Then the automation's active state updates locally (optimistic UI)
> - And the toggle does not collapse/expand the parent row
>
> ### AC3: Empty state
> - Given a connection has no automations
> - When I expand the connection row
> - Then I see "No Automations" text and an "Add Automation" button
>
> ### AC4: Error state
> - Given the parent connection has status "error"
> - When I view the connection row
> - Then automation cards are not rendered (connection-level error takes priority)
>
> ## Design Reference
> [Figma link]
>
> ## Out of Scope
> - Automation CRUD (separate PBI)
> - Real-time status updates via WebSocket (future)
