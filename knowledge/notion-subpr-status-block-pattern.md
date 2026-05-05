---
sync: draft
notionPageId:
lastLocalEdit:
lastPublished:
---

# Notion Sub-PR Status — Update Existing Blocks, Don't Append

When updating the Sub-PR Status table on a Notion Feature_Page, you MUST update the existing table block's rows — not append a new table below the existing one.

**Pattern:**
1. Retrieve the page's block children
2. Find the existing table block (by searching for the "Sub-PR Status" heading, then the table block after it)
3. Update the table's row blocks in place via `patch_block_children`

**What goes wrong if you append:** You end up with duplicate tables — the old one with stale data and a new one with current data. This compounds on every reconciliation pass.
