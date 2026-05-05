---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-04
lastPublished:
---

# Figma Designs May Require Structural Changes Beyond the Ticket Scope

When a ticket says "add popovers to wizard steps," the Figma design may also show layout restructuring (e.g. moving form fields between sections) that isn't mentioned in the ticket description.

## What Happened

The popover spec said to add a File Naming popover to the Connection step. But the Figma design also showed the File Pattern input field moved from the File Paths section into the File Naming section  a structural change not captured in the requirements.

## Lesson

Before implementing UI changes, check the Figma design for structural differences from the current layout, not just the new elements being added. Figma is the source of truth for layout, and tickets often only describe the new feature without mentioning surrounding layout changes.

## Agent Capability

The Figma MCP tool can fetch node data including layout, dimensions, and children. Use it to compare the current code structure against the Figma layout before implementation. Look for fields that moved between sections, not just new elements.
