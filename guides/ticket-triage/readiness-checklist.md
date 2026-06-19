---
lastVerified:
lastUsedInTask:
---

# Ticket Readiness Checklist

## Blocker Checks (all ticket types)

| Check | How | Blocked If |
|-------|-----|------------|
| Predecessor links | Fetch relations, check linked items with predecessor type | Any predecessor state != Done/Closed |
| Parent state | Fetch parent work item | Parent is New, Proposed, or Removed |
| Item state | Check `System.State` | State is Blocked or Removed |
| Tags | Check `System.Tags` | Contains "blocked", "dependency", "waiting" |
| Open dependency PRs | Search GitHub for open PRs linked to predecessor items | Merge-blocking PRs still open |

## Completeness by Type

### UI / Frontend
- [ ] Design reference (Figma link, mockup, or clear layout description)
- [ ] Acceptance criteria defined
- [ ] Target app/page/component identified
- [ ] Responsive behavior noted (if applicable)
- [ ] Error/empty/loading states described

### Backend / API
- [ ] Input/output contract defined (proto reference or payload shape)
- [ ] Acceptance criteria defined
- [ ] Error handling expectations (what errors, what responses)
- [ ] Auth/permission requirements noted
- [ ] Database/migration impact noted (if applicable)

### Proto / gRPC
- [ ] Service and method names defined
- [ ] Request/response message fields and types specified
- [ ] Validation rules noted (required fields, constraints)
- [ ] Breaking vs non-breaking change identified
- [ ] Consumer impact listed (which repos need regen)

### Bug
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Environment (browser, OS, API version, etc.)
- [ ] Severity/priority clear
- [ ] Screenshots or logs (if applicable)

## Logical Consistency (all ticket types with AC)

Check AC items against each other and against the described behavior:

- [ ] No contradictions between AC items (e.g., "show toast on error" vs "redirect on error")
- [ ] State transitions are complete (what triggers each state, what exits it)
- [ ] Boundary conditions addressed (zero, one, exactly-at-threshold, over-threshold)
- [ ] Cross-field/cross-AC dependencies are explicit (if A then B, but what about un-A?)
- [ ] Implicit assumptions stated (auth required? specific role? feature flag? data pre-exists?)
- [ ] Error paths don't conflict with happy paths (same trigger, different outcomes)

**Flag as "Missing Information" if:** 2+ AC items could be interpreted as contradictory, OR a described workflow has an obvious unaddressed branch (e.g., "save" is defined but "cancel mid-save" is not).

## Codebase Readiness (optional, when relevant)

- [ ] Target branch exists and is up to date
- [ ] No conflicting open PRs in the same area
- [ ] Dependent PRs (if any) are merged or close to merge
- [ ] Required proto packages are published (if consuming new protos)
