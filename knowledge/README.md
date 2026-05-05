# Knowledge Base

Codebase discoveries, gotchas, and important details that are easily forgotten.
These are facts about how the code works — not instructions on how to do things (that's what guides are for).

## How to Use (Agent Instructions)

MANDATORY: Do NOT read all knowledge entries. Only scan this table of contents.
1. Check the index below for entries matching the current domain/repo/topic
2. If a matching entry exists, read ONLY that file
3. If no match, move on — don't waste context

## Index

<!-- When adding a new entry, add a line here in the format: -->
<!-- - `{filename}` — {one-line summary} | Tags: {repo}, {domain}, {topic} -->

- `notion-database-id.md` — Notion Engineering Decisions database UUID for agent queries | Tags: notion, knowledge-base, database-id
- `backend-mvc-architecture.md` — Full MVC project architecture: controllers, infrastructure, routing, viewmodels, caching, auth, migration pattern | Tags: QT-Ubi-UbiquityBackend, mvc, architecture, legacy, strangler-fig
- `ubiquity-backend-columninfo-no-ispk.md` — ColumnInfo has no IsPK property; key field detection only at DTE layer, MVC schema model update needed | Tags: QT-Ubi-UbiquityBackend, list, schema, columninfo, ispk
- `notion-subpr-status-block-pattern.md` — Update existing Notion table blocks in place, don't append new ones during sub-PR status reconciliation | Tags: notion, worktree, sub-pr-status, gotcha
- `ubiquity-dialog-escape-gotcha.md` — MVC jQuery gotchas: Escape keypress broken, <a> disabled class not preventing clicks, XSS via .html() string concat | Tags: QT-Ubi-UbiquityBackend, mvc, util, dialog, escape, xss, jquery, gotcha
- `ubiquity-backend-build-order.md` — Build order for u3.sln: service DLLs must build before mvc project | Tags: QT-Ubi-UbiquityBackend, build, mvc, dependencies
- `ubiquity-backend-namespace-services-collision.md` — Services namespace collides with Services.cs ViewModel class, causes CS0118 | Tags: QT-Ubi-UbiquityBackend, namespace, csharp, gotcha
- `ubiquity-backend-worktree-file-overlap.md` — Parallel worktrees creating the same file causes merge conflicts | Tags: worktree, git, merge-conflict, gotcha
- `worktree-distribute-from-local.md` — Distribute changes from local/feature branch to individual PR branches using selective stash checkout | Tags: worktree, git, distribute, workflow

## File Naming

Each entry: `{repo}-{topic}.md` (e.g., `webapps-grpc-session-interceptor.md`)

## What Belongs Here

- Non-obvious behavior discovered while working in the code
- Gotchas that caused bugs or confusion
- Important relationships between components that aren't obvious from the code
- Environment-specific quirks
- Data flow details that took time to trace
- Undocumented API contracts or conventions

## What Does NOT Belong Here

- How-to instructions (use guides instead)
- Coding standards (use steering instead)
- Feature specs (use specs instead)
