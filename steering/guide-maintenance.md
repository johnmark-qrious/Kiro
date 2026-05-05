---
inclusion: manual
---

# Guide Maintenance

Rules for keeping guides accurate, lean, and current. Read this during cleanup passes, synthesis runs, or when drift is detected.

## Codebase & Tooling Drift

- A guide recommendation that contradicts what the codebase actually does
- A guide section that's outdated (deprecated API, old syntax, removed dependency)
- A CI/pipeline failure revealed a convention or constraint not captured in guides
- When touching a guide for any reason, scan that same guide for stale entries and propose removing them
- The architecture doc (`.kiro/steering/ubiquity-architecture.md`) doesn't match reality — new app, new service, new domain, changed connections → propose an update

## Periodic Cleanup

When the user asks for a cleanup pass, or roughly every 5th push:
- Scan all guides for entries that haven't been relevant in recent work — propose pruning
- Check if any guide recommendations conflict with each other
- Look for duplicate content across guides that should be consolidated
- Check the knowledge base index for entries that may be stale

## Structural Hygiene

- A guide that's too verbose and could be condensed
- Duplicate information across guides that should be consolidated
- A steering rule that was ineffective and needed to be moved or restructured
- A topic that keeps coming up but has no guide — propose creating one

## Web Verification

When you suspect a guide recommendation may be outdated or contradicts current official documentation:

1. Use web search to check the latest official docs for the relevant library/framework
2. Compare what the guide says vs what the current docs recommend
3. If there's a mismatch, include the source URL in your proposal so the user can verify
4. Only propose changes backed by official documentation — not blog posts or opinions
5. Focus on the project's key dependencies: Next.js, React, Tailwind, Bun, Biome, gRPC/Connect

## Learning Synthesis

For periodic batch analysis of accumulated Notion gotchas, use the learning synthesis guide:
**Read**: `.kiro/guides/workflow/learning-synthesis.md`

This harvests repeated patterns from Notion and proposes guide updates for anything appearing 3+ times. Run it after sprints, big features, or when agents keep making the same mistakes.

## How to Apply Updates

Steering and guide files may live outside the current workspace (user-level at `~/.kiro/steering/`, or in a different worktree). When you need to edit them:

1. Use `git worktree list` to find the main worktree path
2. Check `~/.kiro/steering/` for user-level steering files
3. Check `<main-worktree>/.kiro/steering/` and `<main-worktree>/.kiro/guides/` for workspace-level files
4. Edit them directly via terminal (`sed`, Python, or similar) — don't claim you can't reach them
5. If the file is in a different worktree, use the absolute path

This applies to all worktrees in a parallel worktree setup. Steering files are shared context — any worktree agent can and should update them when approved.
