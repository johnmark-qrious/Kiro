---
inclusion: manual
---

# Notion Knowledge Base Sync

Agents have access to a Notion Engineering Decisions database for persistent cross-session knowledge.

## Write Triggers

- **Post-Push Retrospective**: After completing the retrospective (per `git-add-commit-push.md`), use the Branch-First Lookup Strategy (Req 14) to find or create the Feature_Page. Append retrospective findings to the relevant sections. If no page exists, create one with Status "In Progress".
- **PR Merge**: For worktree features, merge status is discovered automatically during the dependency check reconciliation (see `parallel-worktree-strategy.md` Dependency Check step 3). For non-worktree features, when the user reports a PR merge, verify via GitHub MCP `get_pull_request`, then update the Feature_Page Status to "Completed" and add the PR link. If no page exists, offer to create one.
- **Codebase Discovery**: When adding a discovery to `.kiro/knowledge/`, also append it to the relevant Feature_Page's Gotchas Discovered section in Notion. If the discovery is standalone (not tied to a feature), create a new page with Status "Completed".
- **Spec Tracking**: When a spec's `requirements.md` is created, create a Notion page with the feature name (or PBI name if available), repo, spec type, and PBI fields. When `design.md` or `tasks.md` are created, update the page with summaries. As tasks complete, update the Files Changed section.

## Automatic Status Transitions (Kanban Flow)

The Notion Feature_Page Status property tracks the lifecycle of each feature. Status updates are on-demand (when the user asks to sync), not automatic at each transition. Available statuses:

| Trigger | Status | When |
|---------|--------|------|
| `requirements.md` created | **Spec** | Spec work has started |
| `tasks.md` created and approved | **Todo** | Spec complete, ready to code |
| First `git push` on any sub-PR branch | **In Progress** | Coding has started |
| PR created via GitHub (any sub-PR or main PR) | **In Review** | Code submitted for review |
| All sub-PRs merged into feature branch | **Merged** | Feature code complete |
| Feature branch merged into release branch | **Released** | Shipped |
| User explicitly abandons | **Abandoned** | Work stopped |

Rules:
- Status only moves forward (Spec → Todo → In Progress → In Review → Merged → Released). Never move backward unless the user explicitly asks.
- For worktree features: "In Review" means at least one sub-PR has a PR open. "Merged" means ALL sub-PRs are merged into the feature branch.
- The agent performing the action (push, PR creation, merge) is responsible for updating the status. Don't defer to another session.
- If the current status is already ahead of the trigger (e.g., already "In Review" and another push happens), don't downgrade.

## Read Triggers

- **Starting Domain Work**: Before beginning tasks in a domain, query the Engineering Decisions database filtered by that domain. Read the most recent page (max 5 results) and summarize prior decisions, trade-offs, and gotchas.
- **Designing New Feature**: When starting a new feature design, search Notion by feature name. Read up to 3 related pages and present relevant prior decisions to the user.

## Lean Access Rules

- NEVER read all pages at session start
- ALWAYS filter queries by feature name or domain — no unfiltered queries
- Read the database ID from `.kiro/knowledge/notion-database-id.md` — don't search for the database
- Use `notionPageId` from `.config.kiro` when available — skip search entirely
- Limit to 5 results for domain queries, 3 pages for feature design searches
- Only query when a specific trigger fires
