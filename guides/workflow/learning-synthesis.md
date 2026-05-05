---
lastVerified:
lastUsedInTask:
---

# Learning Synthesis

Periodic task to turn accumulated Notion gotchas and discoveries into guide updates. Run manually via `/spawn` (CLI) or by asking any agent (IDE).

## Trigger

Run this when you want to harvest learnings — after a sprint, after a big feature, or whenever it feels like agents keep making the same mistakes.

## Prompt

Use this prompt with `/spawn` (CLI) or paste it into any agent session (IDE):

```
Read the Notion Engineering Decisions database ID from /mnt/c/Users/T828819/.kiro/knowledge/notion-database-id.md (IDE: .kiro/knowledge/notion-database-id.md).

Query the Engineering Decisions database for all pages updated in the last 14 days. For each page, read the "Gotchas Discovered" and "Key Decisions" sections.

Then:

1. Group all gotchas by pattern category (e.g., "null-guard", "async-error", "type-safety", "gRPC-handling", "state-management", "config-drift")
2. For any pattern that appears 3+ times across different features:
   - Identify which guide file should cover it
   - Draft a concrete 1-2 sentence addition to that guide
   - Include the feature names where this pattern appeared as evidence
3. For any pattern that appears 2 times: flag it as "watch list" — don't propose a guide update yet
4. For patterns appearing only once: ignore

Output format:

## Proposed Guide Updates

### [guide-file-path]
**Pattern:** {category}
**Occurrences:** {count} ({feature1}, {feature2}, ...)
**Proposed addition:** {concrete text to add to the guide}

## Watch List (2 occurrences — not yet actionable)

- {pattern}: {feature1}, {feature2}

## No Patterns Found
If fewer than 2 repeated patterns exist, say so and skip the rest.
```

## How It Works

1. Notion is the raw data store — agents write gotchas there during normal work
2. This synthesis task reads Notion periodically and finds repeated patterns
3. Repeated patterns become guide proposals (3+ threshold prevents noise)
4. Human approves/rejects each proposal
5. Approved proposals get written to the relevant guide file

## Integration with Guide Evolution

This complements the existing guide-evolution.md protocol:
- **Guide evolution** = real-time, per-session proposals (agent notices something during work)
- **Learning synthesis** = batch, periodic proposals (patterns across multiple sessions/features)

Both feed into the same approval flow: agent proposes → human approves → guide updated.

## Adjusting the Window

- Default: 14 days
- After a sprint: use 7 days
- Quarterly review: use 90 days
- Change the number in the prompt as needed
