---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

Set up Notion as a persistent engineering knowledge base for the Ubiquity platform. Notion stores feature history, engineering decisions, trade-offs, and gotchas — one page per feature — so agents and humans can search prior decisions before starting new work. The Notion MCP is already enabled. Notion is currently empty (zero pages, zero databases). This spec covers creating the database structure in Notion, defining agent write triggers (when to create/update Notion pages), agent read triggers (when to search Notion), worktree integration (sub-PR status tracking), and keeping Notion access lean (search-only, no bulk reads).

## Glossary

- **Notion_MCP**: The Model Context Protocol integration that provides tools for searching, creating, querying, and updating Notion pages and databases from within the agent environment.
- **Engineering_Decisions_Database**: A Notion database that stores one page per feature or task, with structured properties (repo, domain, branch name, status, date, PR links) and rich page content (what was built, why, trade-offs, gotchas, decisions).
- **Agent**: A Kiro agent session executing tasks in the Ubiquity workspace, guided by steering files and guides.
- **Feature_Page**: A single Notion page within the Engineering_Decisions_Database representing one feature or task.
- **Post_Push_Retrospective**: The self-assessment step defined in `git-add-commit-push.md` that runs after every `git push`.
- **Guide_Evolution_Protocol**: The process defined in `guide-evolution.md` governing how agents propose updates to steering files, guides, and knowledge entries.
- **Knowledge_Base**: The local `.kiro/knowledge/` folder containing codebase discovery notes with a table-of-contents index in `README.md`.
- **Worktree_Plan**: The parallel worktree decomposition document produced by the parallel-worktree-strategy for large features.
- **Domain**: A functional area of the Ubiquity platform (e.g., `add-connector`, `connector-list`, `accounts`, `journey-builder`).
- **Spec_Type**: The classification of a spec as defined in the `.config.kiro` file's `specType` field. Valid values: feature, task, bugfix, refactor.
- **Spec_Files**: The set of markdown documents produced by a spec workflow, located in `.kiro/specs/{feature-name}/`. Includes `requirements.md`, `design.md`, `tasks.md`, and `.config.kiro`.
- **Worktree_Instance**: A single Kiro agent session running inside a git worktree directory (e.g., `../Ubiquity-WebApps-pr2`). The instance self-identifies by reading its branch name and workspace folder name.
- **Parent_Branch**: The integration branch that all sub-PR branches merge into. Derived by stripping the `-prN` suffix from the current branch name (e.g., `feature/connector-redesign` is the parent of `feature/connector-redesign-pr2`).
- **Sub-PR_Identifier**: The `-prN` suffix portion of a worktree branch name (e.g., `pr1`, `pr2`), used to look up assigned tasks in the Feature_Page's "Sub-PR Status" section.
- **Branch-First_Lookup_Strategy**: The multi-step process for locating an existing Feature_Page: first check `.config.kiro` for a `notionPageId` (direct lookup, no search needed), then query the Engineering_Decisions_Database by Branch AND Repo, then by PBI_ID, then fall back to a name-based search via `post_search`. A new page is created only when all searches return no results. Defined in Requirement 14.
- **PBI**: A Product Backlog Item in Azure DevOps, identified by a numeric ID (e.g., 1234) and a human-readable name (e.g., "Add searchbar to connector list"). Used to track planned work across repos.
- **PBI_ID**: The unique numeric identifier of an Azure DevOps PBI, stored as a rich_text property on the Feature_Page and in `.config.kiro` for cross-repo traceability.
- **PBI_Link**: A URL pointing to the Azure DevOps work item page for a PBI (e.g., `https://dev.azure.com/org/project/_workitems/edit/1234`).
- **Worktree_Config**: The `.kiro/specs/{feature-name}/.config.kiro` JSON file that stores all metadata a worktree agent instance needs to operate independently — including `notionPageId`, PBI info, branch, assigned tasks, and dependencies.

## Requirements

### Requirement 1: Create Engineering Decisions Database in Notion

**User Story:** As an engineer, I want a structured Notion database for engineering decisions, so that feature history is organized and searchable by repo, domain, and status.

#### Acceptance Criteria

1. WHEN the Agent initializes the knowledge base for the first time, THE Agent SHALL create an Engineering_Decisions_Database in Notion using the Notion_MCP `create_a_data_source` tool with the title "Engineering Decisions".
2. THE Engineering_Decisions_Database SHALL include the following properties: Title (title, the feature/task name), Repo (select, one of: Ubiquity-WebApps, QT-Ubi-UbiquityBackend, ubiquity-protos, Ubiquity-Connectors-Prefect, Ubiquity-Diagram), Type (select, one of: feature, task, bugfix, refactor), Domain (rich_text, the functional area such as add-connector or journey-builder), Branch (rich_text, the branch name), Status (select, one of: In Progress, Completed, Abandoned), Date (date, when work started), PR_Links (url, link to the primary pull request), PBI_ID (rich_text, the Azure DevOps PBI identifier such as "1234" or "PBI-1234"), and PBI_Link (url, link to the Azure DevOps work item page).
3. WHEN the Agent creates a Feature_Page, THE Agent SHALL populate the page content body with sections: What We Built, Why This Approach, Trade-offs, Gotchas Discovered, and Decisions Made.
4. THE Agent SHALL store the Engineering_Decisions_Database ID in `.kiro/knowledge/notion-database-id.md` so that future sessions can retrieve the database ID without searching Notion.

### Requirement 2: Agent Write Trigger — Post-Push Retrospective

**User Story:** As an engineer, I want the agent to automatically record engineering decisions in Notion after each push, so that knowledge is captured while context is fresh.

#### Acceptance Criteria

1. WHEN the Agent completes a Post_Push_Retrospective, THE Agent SHALL locate an existing Feature_Page using the Branch-First Lookup Strategy defined in Requirement 14.
2. WHEN a matching Feature_Page exists, THE Agent SHALL update the Feature_Page content with new retrospective findings (appending to the relevant sections: What We Built, Trade-offs, Gotchas Discovered, Decisions Made).
3. WHEN no matching Feature_Page exists, THE Agent SHALL create a new Feature_Page in the Engineering_Decisions_Database with the current feature name, repo, domain, branch name, status set to "In Progress", current date, and retrospective content.
4. THE Agent SHALL update the Feature_Page Status property to reflect the current state of work (In Progress while actively developing).

### Requirement 3: Agent Write Trigger — PR Merge Completion

**User Story:** As an engineer, I want the Notion page updated when a PR is merged, so that the knowledge base reflects completed work.

#### Acceptance Criteria

1. WHEN the user informs the Agent that a pull request has been merged (e.g., "the connector-activity-log PR was merged", "I just merged PR #42"), THE Agent SHALL verify the merge by calling the GitHub MCP `get_pull_request` tool to confirm the pull request's merged status before updating Notion.
2. WHEN the Agent confirms via GitHub MCP `get_pull_request` that a user-reported pull request is merged, THE Agent SHALL update the corresponding Feature_Page Status property to "Completed".
3. WHEN the Agent confirms via GitHub MCP `get_pull_request` that a user-reported pull request is merged, THE Agent SHALL update the Feature_Page PR_Links property with the merged pull request URL.
4. WHEN the Agent confirms via GitHub MCP `get_pull_request` that a user-reported pull request is merged, THE Agent SHALL append a completion summary to the Feature_Page content noting the merge date and any final observations.
5. WHEN the Agent starts a new session on a feature that has an existing Feature_Page with Status "In Progress", THE Agent SHALL call the GitHub MCP `list_pull_requests` or `get_pull_request` tool to check whether any associated pull request has been merged since the last session (opportunistic sync).
6. WHEN the opportunistic sync in acceptance criterion 5 discovers a pull request that has been merged, THE Agent SHALL update the Feature_Page Status property to "Completed", set the PR_Links property to the merged pull request URL, and append a completion summary noting the merge date.
7. IF the Agent cannot find a matching Feature_Page for a merged pull request, THEN THE Agent SHALL inform the user that no corresponding Notion page was found and offer to create one.
8. THE Agent SHALL use the GitHub MCP tools (`get_pull_request`, `list_pull_requests`) as the sole mechanism for verifying pull request merge status — the Agent has no webhook or event listener and relies on explicit user notification or proactive GitHub MCP queries.

### Requirement 4: Agent Write Trigger — Codebase Discovery Sync

**User Story:** As an engineer, I want codebase discoveries written to both the local knowledge base and Notion, so that knowledge is available in both systems.

#### Acceptance Criteria

1. WHEN the Agent discovers a non-obvious codebase fact during a task, THE Agent SHALL propose adding the discovery to both `.kiro/knowledge/` (as a local markdown file with index entry) AND the relevant Feature_Page in the Engineering_Decisions_Database.
2. WHEN the discovery relates to an existing feature, THE Agent SHALL append the discovery to the Gotchas Discovered section of the corresponding Feature_Page.
3. WHEN the discovery does not relate to any specific feature, THE Agent SHALL create a new Feature_Page with the title matching the discovery topic, Repo set to the relevant repository, Domain set to the relevant domain, and Status set to "Completed".

### Requirement 5: Agent Read Trigger — Pre-Work Domain Search

**User Story:** As an engineer, I want the agent to check Notion for prior decisions before starting work in a domain, so that past mistakes and patterns inform new work.

#### Acceptance Criteria

1. WHEN the Agent begins work on a task in a specific Domain, THE Agent SHALL query the Engineering_Decisions_Database using the Notion_MCP `query_data_source` tool, filtering by the Domain property matching the current domain.
2. WHEN the query returns matching Feature_Pages, THE Agent SHALL read the page content of the most recent matching Feature_Page (sorted by Date descending) and summarize relevant prior decisions, trade-offs, and gotchas for the current task.
3. WHEN the query returns no matching Feature_Pages, THE Agent SHALL proceed without Notion context and note that no prior domain history was found.
4. THE Agent SHALL limit the query to a maximum of 5 results to avoid excessive context loading.

### Requirement 6: Agent Read Trigger — Feature Design Search

**User Story:** As an engineer, I want the agent to search Notion for related past features when designing a new feature, so that we avoid repeating past mistakes.

#### Acceptance Criteria

1. WHEN the Agent is designing a new feature (during spec creation or architecture discussion), THE Agent SHALL search the Engineering_Decisions_Database using the Notion_MCP `post_search` tool with the feature name as the query.
2. WHEN the search returns related Feature_Pages, THE Agent SHALL read the content of up to 3 related Feature_Pages and present a summary of relevant prior decisions, trade-offs, and gotchas to the user.
3. WHEN the search returns no related Feature_Pages, THE Agent SHALL proceed without Notion context.

### Requirement 7: Worktree Integration — Sub-PR Status Tracking

**User Story:** As an engineer, I want the Notion page to serve as the live coordination layer for parallel worktree features, so that each worktree instance can self-identify, read its assigned tasks, and report progress back to Notion as it works.

#### Acceptance Criteria

1. WHEN the Agent checks sub-PR merge status via GitHub MCP during the preTaskExecution dependency check (as defined in parallel-worktree-strategy.md), THE Agent SHALL update the parent feature's Feature_Page content with a status entry noting which sub-PRs are merged and which are still pending.
2. WHEN the user informs the Agent that a sub-PR from a Worktree_Plan has been merged, THE Agent SHALL verify the merge via GitHub MCP `get_pull_request` tool, then update the parent feature's Feature_Page content with a status entry noting which sub-PR was merged, the merge date, and the tasks it completed.
3. THE Feature_Page for a worktree-based feature SHALL include a "Sub-PR Status" section listing each sub-PR branch name, its assigned tasks, and its current status (Pending, In Progress, Merged).
4. WHEN the Agent determines via GitHub MCP that all sub-PRs from a Worktree_Plan have been merged, THE Agent SHALL update the Feature_Page Status property to "Completed".
5. THE Agent SHALL use the GitHub MCP tools as the ground truth for determining sub-PR merge status, and use Notion only as the display and coordination layer for that status.
6. WHEN a worktree Agent instance starts up, THE Agent SHALL self-identify by running `git branch --show-current` to obtain the current branch name and reading the workspace folder name to determine the repository.
7. WHEN the Agent detects that the current branch matches the `{parent-branch}-prN` pattern, THE Agent SHALL derive the parent branch name by stripping the `-prN` suffix and search the Engineering_Decisions_Database for a Feature_Page matching the parent branch name and repository.
8. WHEN the Agent finds a matching parent Feature_Page, THE Agent SHALL read the "Sub-PR Status" section to determine which tasks are assigned to its sub-PR identifier.
9. WHEN the Agent completes a task assigned to its sub-PR, THE Agent SHALL update the parent Feature_Page's "Sub-PR Status" section to reflect the task completion (marking individual tasks as done and updating the sub-PR status to "In Progress").
10. THE Feature_Page for a worktree-based feature SHALL serve as the source of truth for cross-worktree coordination, enabling each worktree instance to see the progress of all other sub-PRs without direct inter-process communication.

### Requirement 8: Lean Access Pattern

**User Story:** As an engineer, I want Notion access to be minimal and targeted, so that agent sessions stay fast and don't waste context on irrelevant data.

#### Acceptance Criteria

1. THE Agent SHALL NOT read all pages or databases from Notion at session start.
2. THE Agent SHALL only query Notion when a specific trigger condition is met (starting work on a domain, designing a new feature, completing a retrospective, or merging a PR).
3. WHEN querying the Engineering_Decisions_Database, THE Agent SHALL filter by feature name or Domain — never perform unfiltered queries.
4. THE Agent SHALL cache the Engineering_Decisions_Database ID locally in `.kiro/knowledge/notion-database-id.md` and read the ID from that file instead of searching Notion for the database on every session.
5. WHEN reading Feature_Page content from Notion, THE Agent SHALL read only the specific page content needed for the current task, limiting to a maximum of 3 pages per query.

### Requirement 9: Guide Updates for Write Triggers

**User Story:** As an engineer, I want the guide-evolution and git-add-commit-push steering files updated with Notion write trigger instructions, so that agents know when to write to Notion.

#### Acceptance Criteria

1. THE Agent SHALL update `guide-evolution.md` to include an instruction that after each Post_Push_Retrospective, the Agent creates or updates the Feature_Page in Notion for the current feature.
2. THE Agent SHALL update `guide-evolution.md` to include an instruction that after a PR is merged, the Agent updates the Feature_Page Status to "Completed" and adds the PR link.
3. THE Agent SHALL update `guide-evolution.md` to include an instruction that when codebase discoveries are made, the Agent adds the discovery to both `.kiro/knowledge/` AND the relevant Feature_Page in Notion.

### Requirement 10: Guide Updates for Read Triggers

**User Story:** As an engineer, I want the guide-evolution steering file updated with Notion read trigger instructions, so that agents know when to search Notion for prior decisions.

#### Acceptance Criteria

1. THE Agent SHALL update `guide-evolution.md` to include an instruction that before starting work on a Domain, the Agent searches the Engineering_Decisions_Database for prior decisions in that domain.
2. THE Agent SHALL update `guide-evolution.md` to include an instruction that when designing a new feature, the Agent searches Notion for related past features to surface relevant trade-offs and gotchas.

### Requirement 11: Worktree Strategy Guide Update

**User Story:** As an engineer, I want the parallel-worktree-strategy guide updated with Notion integration instructions, so that worktree-based features track sub-PR status in Notion.

#### Acceptance Criteria

1. THE Agent SHALL update `parallel-worktree-strategy.md` to include an instruction that after each sub-PR merge, the Agent updates the parent feature's Feature_Page in Notion with the merged sub-PR status.
2. THE Agent SHALL update `parallel-worktree-strategy.md` to include an instruction that the Feature_Page serves as the high-level status view for which sub-PRs have merged and which are pending.
3. THE Agent SHALL update `parallel-worktree-strategy.md` to include a note that GitHub MCP remains the ground truth for "can I start working?" dependency checks, and Notion is the display layer only.


### Requirement 12: Spec Tracking in Notion

**User Story:** As an engineer working across multiple repos, I want spec files and their metadata automatically tracked in Notion, so that I can browse Notion by repo and work type to see all features, bugfixes, tasks, and refactors done in each repo.

#### Acceptance Criteria

1. WHEN a spec is created (a `requirements.md` file is written to `.kiro/specs/{feature-name}/`), THE Agent SHALL create a new Feature_Page in the Engineering_Decisions_Database with the Title set to the feature name, Repo set to the current repository, and Type set to the Spec_Type value read from `.kiro/specs/{feature-name}/.config.kiro`.
2. WHEN a spec's `requirements.md` is created, THE Agent SHALL populate the Feature_Page content with a "Spec Summary" section containing a concise summary of the requirements (key user stories and acceptance criteria highlights).
3. WHEN a spec progresses and a `design.md` file is created in `.kiro/specs/{feature-name}/`, THE Agent SHALL update the corresponding Feature_Page content with a "Design Decisions" section summarizing the key architectural choices, component structure, and data flow from the design document.
4. WHEN a spec progresses and a `tasks.md` file is created in `.kiro/specs/{feature-name}/`, THE Agent SHALL update the corresponding Feature_Page content with a "Task List" section listing each task with its description and status.
5. THE Feature_Page for a spec-tracked feature SHALL include a "Spec Files" section listing the relative paths of all Spec_Files present in `.kiro/specs/{feature-name}/` (e.g., `requirements.md`, `design.md`, `tasks.md`, `.config.kiro`).
6. THE Feature_Page for a spec-tracked feature SHALL include a "Files Changed" section that the Agent populates as tasks from the spec are completed, listing the key source files created or modified during implementation.
7. WHEN a task from a spec's `tasks.md` is completed, THE Agent SHALL append the files touched by that task to the "Files Changed" section of the corresponding Feature_Page.
8. THE Agent SHALL set the Feature_Page Type property based on the `specType` field from `.kiro/specs/{feature-name}/.config.kiro`, mapping "feature" to feature, "task" to task, "bugfix" to bugfix, and "refactor" to refactor.
9. WHEN querying the Engineering_Decisions_Database to browse work by repo and type, THE Agent SHALL filter by the Repo property and optionally by the Type property to return matching Feature_Pages.
10. IF the `.config.kiro` file does not contain a valid `specType` field, THEN THE Agent SHALL default the Type property to "feature" and log a warning noting the missing Spec_Type.


### Requirement 13: Worktree Self-Identification

**User Story:** As an engineer running multiple Kiro instances in parallel worktrees, I want each instance to automatically detect which worktree it is, find its parent feature in Notion, and read its assigned tasks, so that no manual coordination is needed between worktree instances.

#### Acceptance Criteria

1. WHEN the Agent starts a session, THE Agent SHALL first read `.kiro/specs/{feature-name}/.config.kiro` to check for a `notionPageId` field — if present, the Agent SHALL use that ID to retrieve the Feature_Page directly from Notion without any search or branch detection.
2. WHEN `.config.kiro` does not contain a `notionPageId` field (or the file does not exist), THE Agent SHALL fall back to running `git branch --show-current` to obtain the current branch name and reading the workspace folder name to determine the current repository.
3. WHEN the current branch name matches the pattern `{parent-branch}-prN` (where N is one or more digits), THE Agent SHALL classify the session as a worktree instance and derive the parent branch name by stripping the `-prN` suffix.
4. WHEN the Agent classifies the session as a worktree instance, THE Agent SHALL search the Engineering_Decisions_Database using the Notion_MCP `query_data_source` tool, filtering by the Branch property matching the parent branch name and the Repo property matching the current repository.
5. WHEN the Agent finds a matching parent Feature_Page, THE Agent SHALL read the "Sub-PR Status" section of the Feature_Page to identify which tasks are assigned to the current sub-PR identifier (e.g., pr1, pr2).
6. WHEN the Agent completes a task during a worktree session, THE Agent SHALL update the parent Feature_Page's "Sub-PR Status" section to mark the task as completed and set the sub-PR row status to "In Progress".
7. IF the Agent cannot find a matching Feature_Page for the derived parent branch and repository, THEN THE Agent SHALL inform the user that no parent feature page was found in Notion and offer to create one.
8. IF the current branch name does not match the `{parent-branch}-prN` pattern, THEN THE Agent SHALL treat the session as a standard (non-worktree) session and skip worktree self-identification.
9. THE Agent SHALL use the workspace folder name (the directory name containing the `.git` folder or `.git` file) as the repository identifier for Notion lookups, mapping common folder names to their Repo select values (e.g., `Ubiquity-WebApps`, `Ubiquity-WebApps-pr1` both map to `Ubiquity-WebApps`).
10. WHEN `.config.kiro` contains an `assignedTasks` field, THE Agent SHALL use that field to determine which tasks to execute instead of parsing the "Sub-PR Status" section from Notion or reading `worktree-plan.md`.


### Requirement 14: Feature Page Lookup Strategy — Branch-First Search

**User Story:** As an engineer working across multiple machines or sharing branches with teammates, I want the agent to find existing Notion pages by branch name first, so that duplicate pages are never created when different sessions use different feature name context.

#### Acceptance Criteria

1. WHEN the Agent needs to locate an existing Feature_Page and `.config.kiro` contains a `notionPageId` field, THE Agent SHALL retrieve the Feature_Page directly using the Notion_MCP `retrieve_a_page` tool with that ID, skipping all subsequent search steps.
2. WHEN `.config.kiro` does not contain a `notionPageId` (or the file does not exist), THE Agent SHALL query the Engineering_Decisions_Database using the Notion_MCP `query_data_source` tool, filtering by the Branch property (exact match on the current git branch obtained from `git branch --show-current`) AND the Repo property (derived from the workspace folder name).
3. WHEN the branch-based query in acceptance criterion 2 returns a matching Feature_Page, THE Agent SHALL use that Feature_Page and skip the remaining fallback searches.
4. WHEN the branch-based query in acceptance criterion 2 returns no results AND `.config.kiro` contains a `pbiId` field, THE Agent SHALL query the Engineering_Decisions_Database filtering by the PBI_ID property (exact match on the `pbiId` value).
5. WHEN the PBI_ID-based query in acceptance criterion 4 returns a matching Feature_Page, THE Agent SHALL use that Feature_Page and skip the name-based fallback search.
6. WHEN neither the branch-based query nor the PBI_ID-based query returns results (or PBI_ID is not available), THE Agent SHALL fall back to searching by feature name using the Notion_MCP `post_search` tool with the current feature or spec name as the query.
7. WHEN all search steps (notionPageId direct lookup, branch-based query, PBI_ID-based query, and name-based fallback search) return no results, THE Agent SHALL create a new Feature_Page in the Engineering_Decisions_Database.
8. THE Agent SHALL NOT create a new Feature_Page without first completing all applicable search steps in the defined order.
9. THE Agent SHALL use `git branch --show-current` as the source of the current branch name for the branch-based query, ensuring the lookup is deterministic regardless of which user or machine is running the session.
10. WHEN deriving the Repo value for the branch-based query, THE Agent SHALL strip any `-prN` suffix from the workspace folder name before matching against the Engineering_Decisions_Database Repo select options (e.g., `Ubiquity-WebApps-pr2` maps to `Ubiquity-WebApps`).
11. WHEN the Agent successfully locates or creates a Feature_Page, THE Agent SHALL write the `notionPageId` back to `.config.kiro` so that future sessions can use the direct lookup path.


### Requirement 15: Azure DevOps PBI Integration

**User Story:** As an engineer, I want the Engineering Decisions database to track Azure DevOps PBI identifiers, so that I can link Notion pages to planned work items and filter by PBI to see all work related to a single PBI across repos.

#### Acceptance Criteria

1. WHEN the user provides a PBI name or PBI ID when starting a spec or feature (e.g., "PBI-1234: Add searchbar to connector list"), THE Agent SHALL store the `pbiId`, `pbiName`, and `pbiLink` fields in `.kiro/specs/{feature-name}/.config.kiro`.
2. WHEN the Agent creates a Feature_Page and `.config.kiro` contains a `pbiId` field, THE Agent SHALL set the PBI_ID property on the Feature_Page to the `pbiId` value.
3. WHEN the Agent creates a Feature_Page and `.config.kiro` contains a `pbiLink` field, THE Agent SHALL set the PBI_Link property on the Feature_Page to the `pbiLink` value.
4. WHEN the Agent creates a Feature_Page and `.config.kiro` contains a `pbiName` field, THE Agent SHALL set the Feature_Page Title to the PBI name (e.g., "PBI-1234: Add searchbar to connector list") instead of the bare feature name.
5. WHEN querying the Engineering_Decisions_Database to find all work related to a specific PBI, THE Agent SHALL filter by the PBI_ID property (exact match) to return all Feature_Pages associated with that PBI across repositories.
6. THE PBI_ID property SHALL serve as an additional lookup key in the Branch-First_Lookup_Strategy defined in Requirement 14, searched after the branch+repo query and before the name-based fallback search.
7. IF the user does not provide a PBI when starting a spec or feature, THEN THE Agent SHALL proceed without setting PBI_ID or PBI_Link on the Feature_Page, and the `.config.kiro` file SHALL omit the `pbiId`, `pbiName`, and `pbiLink` fields.


### Requirement 16: Worktree Config Schema

**User Story:** As an engineer running parallel worktrees, I want each worktree's `.config.kiro` to contain everything the agent needs to operate independently, so that worktree instances can start working immediately without searching Notion or parsing plan files.

#### Acceptance Criteria

1. WHEN the parallel-worktree-strategy creates the base branch and initial Notion Feature_Page, THE Agent SHALL write a `.kiro/specs/{feature-name}/.config.kiro` in the main worktree containing at minimum: `specType`, `workflowType`, `branch` (the parent/integration branch), `notionPageId` (the Notion Feature_Page ID), `repo` (the repository name), and any PBI fields (`pbiId`, `pbiName`, `pbiLink`) if a PBI was provided.
2. WHEN the parallel-worktree-strategy creates individual worktrees, THE Agent SHALL generate a per-worktree `.kiro/specs/{feature-name}/.config.kiro` containing all fields from the main worktree config plus the following sub-PR specific fields: `parentBranch` (the integration branch), `subPrId` (e.g., "pr1", "pr2"), `branch` (the sub-branch name, e.g., "feature/searchbar-pr2"), `assignedTasks` (array of task numbers assigned to this worktree), and `dependsOn` (array of sub-PR identifiers that must merge before this worktree can start, e.g., ["pr1"]).
3. WHEN the Agent starts a session and `.config.kiro` contains a `notionPageId` field, THE Agent SHALL use that ID to retrieve the Feature_Page directly from Notion without performing any search queries.
4. WHEN `.config.kiro` contains a `dependsOn` field listing other sub-PR identifiers, THE Agent SHALL check the status of those dependencies via GitHub MCP `list_pull_requests` (checking merge status into the parent branch) or by reading the parent Feature_Page's "Sub-PR Status" section in Notion before starting any assigned tasks.
5. WHEN `.config.kiro` contains an `assignedTasks` field, THE Agent SHALL use that field as the definitive list of tasks to execute, without needing to parse `worktree-plan.md` or the Notion "Sub-PR Status" section for task assignments.
6. THE per-worktree `.config.kiro` SHALL conform to the following JSON schema:
   ```json
   {
     "specType": "feature",
     "workflowType": "requirements-first",
     "branch": "feature/searchbar-pr2",
     "parentBranch": "feature/searchbar",
     "subPrId": "pr2",
     "notionPageId": "abc123-def456",
     "pbiId": "PBI-1234",
     "pbiName": "Add searchbar to connector list",
     "pbiLink": "https://dev.azure.com/org/project/_workitems/edit/1234",
     "assignedTasks": [3, 4],
     "dependsOn": ["pr1"],
     "repo": "Ubiquity-WebApps"
   }
   ```
7. IF a dependency listed in `dependsOn` has not been merged, THEN THE Agent SHALL inform the user which sub-PRs are still pending and refrain from starting any assigned tasks until the dependencies are resolved.
8. THE main worktree `.config.kiro` SHALL omit sub-PR specific fields (`parentBranch`, `subPrId`, `assignedTasks`, `dependsOn`) since those apply only to individual worktree instances.
