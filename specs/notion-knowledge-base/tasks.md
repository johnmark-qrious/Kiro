---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: Notion Knowledge Base

## Overview

This feature is agent infrastructure — no application code. Implementation uses Notion MCP tools to create a database with 10 properties (including PBI tracking), caches the database ID locally, updates three steering/guide files with Notion integration instructions (including worktree self-identification and config schema documentation), and verifies the setup with a smoke test that exercises the Branch-First Lookup Strategy. Tasks follow natural dependency order: database first, then steering file updates (parallelizable across files), then end-to-end verification.

## Tasks

- [x] 1. Create the Engineering Decisions database in Notion and cache the ID
  - [x] 1.1 Create the Engineering Decisions database via Notion MCP
    - Call `mcp_notion_API_create_a_data_source` with the exact schema from design Component 1
    - The database must include all 10 properties: Title (title), Repo (select with 5 repo options), Type (select with 4 type options), Domain (rich_text), Branch (rich_text), Status (select with 3 status options), Date (date), PR_Links (url), PBI_ID (rich_text), PBI_Link (url)
    - Use the parent page ID from the user's Notion workspace
    - Capture the returned database ID from the API response
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create the database ID cache file
    - Create `.kiro/knowledge/notion-database-id.md` with the database ID returned from step 1.1
    - Follow the exact format from design Component 3: title, Database ID (UUID), Created date, Workspace name, and usage description
    - _Requirements: 1.4, 8.4_

  - [x] 1.3 Update the knowledge base index
    - Add an entry to `.kiro/knowledge/README.md` index section: `- \`notion-database-id.md\` — Notion Engineering Decisions database UUID for agent queries | Tags: notion, knowledge-base, database-id`
    - _Requirements: 1.4_

- [x] 2. Checkpoint — Verify database creation
  - Ensure the database was created successfully in Notion with all 10 properties (including PBI_ID and PBI_Link) and correct select options. Verify the cache file contains a valid UUID and the README.md index has the new entry. Ask the user if questions arise.

- [x] 3. Update steering files with Notion integration instructions
  - [x] 3.1 Update `guide-evolution.md` with Notion Knowledge Base Sync section
    - Add the "Notion Knowledge Base Sync" section from design Component 4a after the existing "Codebase Discoveries (Knowledge Base)" section
    - Must include Write Triggers subsection with all 4 triggers: Post-Push Retrospective (referencing Branch-First Lookup Strategy Req 14), PR Merge (verify via GitHub MCP first), Codebase Discovery (append to Gotchas or create standalone page), Spec Tracking (create page on requirements.md, update on design.md/tasks.md, track files changed)
    - Must include Read Triggers subsection: Starting Domain Work (query by domain, max 5 results), Designing New Feature (search by name, max 3 pages)
    - Must include Lean Access Rules subsection with all 6 rules (never bulk read, always filter, read DB ID from cache, use notionPageId from .config.kiro when available, limit results, only query on trigger)
    - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 8.1, 8.2, 8.3, 8.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 3.2 Update `git-add-commit-push.md` with Post-Push Notion step
    - Add step 5 to the existing Post-Push Retrospective section as specified in design Component 4b
    - The new step must reference the Branch-First Lookup Strategy: `5. **Notion sync** — Use the Branch-First Lookup Strategy to find or create the Feature_Page for the current feature. Append retrospective findings. If \`.config.kiro\` has a \`notionPageId\`, use it directly. Otherwise, read the database ID from \`.kiro/knowledge/notion-database-id.md\` and search by branch+repo first.`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 14.1, 14.2_

  - [x] 3.3 Update `parallel-worktree-strategy.md` with Notion Status Tracking, Worktree Self-Identification, and Worktree Config Schema sections
    - Add three new sections from design Component 4c after the existing "Dependency Check (preTaskExecution)" section
    - **Notion Status Tracking** section must include:
      - "When to Update Notion" subsection (after each sub-PR merge, all sub-PRs merged → Status "Completed")
      - "Ground Truth" note (GitHub MCP is ground truth, Notion is display layer only — never block work based on Notion status)
      - "Sub-PR Status Format" with the table template (columns: Sub-PR Branch, Sub-PR ID, Tasks, Completed Tasks, Status, Merge Date)
    - **Worktree Self-Identification** section must include:
      - "Detection Steps (Priority Order)" — read .config.kiro first, use notionPageId + assignedTasks directly, check dependsOn via GitHub MCP, fall back to git branch detection with regex `^(.+)-pr(\d+)$`, derive parent branch and repo, use Branch-First Lookup Strategy, write notionPageId back
      - "Per-Instance Behavior" — each instance reads .config.kiro at startup, writes only its own row in Sub-PR Status, never modifies other instances' rows
      - "Task Completion Updates" — 6-step process for updating Sub-PR Status after completing each task
    - **Worktree Config Schema (.config.kiro)** section must include:
      - Main Worktree Config example JSON (specType, workflowType, branch, notionPageId, repo, PBI fields)
      - Per-Worktree Config example JSON (adds parentBranch, subPrId, assignedTasks, dependsOn)
      - Field Reference table (all 12 fields with Main/Per-Worktree applicability and descriptions)
      - Generation Timing (main config on base branch creation, per-worktree configs during git worktree add, notionPageId backfill on successful lookup)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 11.1, 11.2, 11.3, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 14.1, 14.9, 14.10, 14.11, 15.1, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_

- [x] 4. Checkpoint — Verify steering file updates
  - Ensure all three steering files contain the new Notion sections in the correct locations. Verify `guide-evolution.md` has Write Triggers, Read Triggers, and Lean Access Rules. Verify `git-add-commit-push.md` has step 5 referencing Branch-First Lookup. Verify `parallel-worktree-strategy.md` has all three new sections (Notion Status Tracking, Worktree Self-Identification, Worktree Config Schema) with complete content. Ask the user if questions arise.

- [x] 5. Smoke test — Create a test Feature Page with PBI info and verify the Branch-First Lookup Strategy
  - [x] 5.1 Create a test Feature Page in the Engineering Decisions database
    - Use `mcp_notion_API_post_page` to create a page with all 10 properties populated:
      - Title="PBI-0000: Notion Knowledge Base Setup", Repo="Ubiquity-WebApps", Type="feature", Domain="knowledge-base", Branch="feature/notion-knowledge-base", Status="In Progress", Date=today's date, PR_Links=(leave null for now), PBI_ID="PBI-0000", PBI_Link=(leave null — no real PBI)
    - Populate the page content body with the Feature Page template from design Component 2:
      - PBI section (with PBI ID, PBI Name, PBI Link placeholders)
      - What We Built, Why This Approach, Trade-offs, Gotchas Discovered, Decisions Made sections (fill with actual content from this feature's requirements and design)
      - Spec Summary section (summarize the 16 requirements)
      - Design Decisions section (summarize key architectural choices)
      - Spec Files section (list requirements.md, design.md, tasks.md, .config.kiro)
    - Capture the returned page ID for use in subsequent verification steps
    - _Requirements: 1.2, 1.3, 12.1, 12.2, 12.3, 12.5, 12.8, 15.2, 15.3, 15.4_

  - [x] 5.2 Verify Branch-First Lookup Strategy works end-to-end
    - **Step 2 — Branch+Repo query**: Use `mcp_notion_API_query_data_source` with compound filter `{Branch="feature/notion-knowledge-base" AND Repo="Ubiquity-WebApps"}` and verify the test page appears in results (exact match, page_size=1)
    - **Step 3 — PBI_ID query**: Use `mcp_notion_API_query_data_source` with filter `{PBI_ID="PBI-0000"}` and verify the test page appears in results
    - **Step 4 — Name fallback**: Use `mcp_notion_API_post_search` with query "Notion Knowledge Base" and verify the page is found
    - **Content verification**: Use `mcp_notion_API_get_block_children` on the page and verify all content sections are present (PBI, What We Built, Spec Summary, etc.)
    - _Requirements: 5.1, 6.1, 8.3, 14.2, 14.4, 14.6, 15.5_

- [x] 6. Final checkpoint — Verify complete setup
  - Ensure: (1) database exists in Notion with correct 10-property schema including PBI_ID and PBI_Link, (2) cache file has valid UUID, (3) knowledge base index is updated, (4) all three steering files have Notion sections with complete content, (5) test Feature Page exists with PBI info and is queryable via all three Branch-First Lookup search methods (branch+repo, PBI_ID, name). Ask the user if questions arise.

## Notes

- This feature has no application code — all tasks use Notion MCP tools and file edits
- No automated tests are needed; verification is done via MCP tool calls during implementation
- The design document has exact JSON structures for all Notion API calls (Components 1, 6, Data Models section)
- Steering file changes are fully specified in design Component 4 — use those as the source of truth
- The `parallel-worktree-strategy.md` update (task 3.3) is the largest single task — it adds three substantial sections covering Notion status tracking, worktree self-identification logic, and the .config.kiro schema documentation
- The smoke test (task 5) doubles as the first real entry in the Engineering Decisions database for this feature
- The smoke test verifies the Branch-First Lookup Strategy (Req 14) which is the core deduplication mechanism
