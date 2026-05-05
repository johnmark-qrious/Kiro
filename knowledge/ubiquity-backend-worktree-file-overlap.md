---
sync: draft
notionPageId:
lastLocalEdit:
lastPublished:
---

# Worktree File Overlap Causes Merge Conflicts

When using parallel worktrees, if two PRs both touch the same file (especially creating the same new file), merging them into the feature branch causes conflicts.

**Example from database-change-alert:**
- PR3 created `connector_warnings_dialog.ascx` and modified `Index.aspx`
- PR4 also created `connector_warnings_dialog.ascx` and modified `Index.aspx`
- Result: add/add conflict on .ascx, content conflict on Index.aspx

**Root cause:** The worktree plan marked PR3 and PR4 as fully parallel, but they shared files. The File Overlap Check (added to parallel-worktree-strategy.md) should catch this at planning time.

**Fix applied:** PR4 now depends on PR3. Merge order: PR2+PR3 parallel, then sync PR4, then merge PR4.

**Rule:** Before finalizing parallel phases, cross-check "Files touched" lists. Any overlap = not truly parallel.
