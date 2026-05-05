---
inclusion: manual
---

# Knowledge Base Management

Rules for storing and retrieving codebase discoveries across sessions.

## Two Knowledge Stores

1. **`.kiro/knowledge/`** — Manual notes (works in IDE and CLI). Use the table-of-contents approach: scan `README.md` index, only read matching entries.
2. **`kiro-cli /knowledge`** — Semantic search over indexed codebase (CLI only, experimental). Supports natural language queries and finds related concepts without exact keyword matches. Enable with `kiro-cli settings chat.enableKnowledge true`.

## When to Use `.kiro/knowledge/`

- Gotchas, anti-patterns, and "things that surprised us"
- Undocumented API contracts or conventions
- Hidden dependencies between components
- Environment-specific quirks

## When to Use `kiro-cli /knowledge`

- Searching across large codebases semantically
- Finding related code patterns without knowing exact file locations
- Indexing documentation, configs, and code for natural language queries

## Sync Frontmatter

Every knowledge file MUST have sync frontmatter:

```yaml
---
sync: draft | published | modified
notionPageId: (set after first publish)
lastLocalEdit: (ISO timestamp)
lastPublished: (ISO timestamp)
---
```

Rules:
- New file: set `sync: draft`
- After publish: set `sync: published` and `lastPublished` to now
- After editing a `published` file: flip to `sync: modified` and update `lastLocalEdit`
- The `sync check` script handles publishing and setting `published` + `lastPublished`
- Never manually set `sync: published` — let the script do it

## Format

- Filename: `{repo}-{topic}.md` — short, factual, no fluff
- The README.md index is optional. The knowledge base is vector-indexed and searchable without it
