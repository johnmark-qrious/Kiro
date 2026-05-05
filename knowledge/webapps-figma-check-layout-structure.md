---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-04
lastPublished:
---

# Figma: Check Layout Structure, Not Just Styles

When implementing UI from Figma designs, always check the overall page layout and field grouping, not just individual component styles (colors, sizes, spacing).

## What Happened

During the popover feature, Figma MCP was used to verify trigger icon size (13x13), popover background color (#0D9F76), and shadow tokens. But the Figma design also moved the File Pattern input from the File Paths section into a new File Naming section. This structural change was missed because only individual node styles were checked, not the full page layout.

## Lesson

When a Figma link is provided for a feature:
1. Check individual component styles (colors, sizes, tokens)  we did this
2. Also check the overall section layout  which fields are grouped under which headings  we missed this
3. Compare the Figma layout against the current code structure before writing any integration code
4. If Figma shows fields in different sections than the current code, flag it as a structural change before implementing

## Agent Capability

The Figma MCP tool (mcp_figma_get_figma_data) can fetch layout data including parent-child relationships, dimensions, and grouping. Use it to verify section structure, not just leaf node styles.
