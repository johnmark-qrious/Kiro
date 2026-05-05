---
inclusion: manual
---

# Worktree Phase 3: Execute & Ship

Two activities: develop in -local, ship to PR branches when ready.

## Development (in -local)

All coding happens in the -local worktree. Use the normal agent workflow:
- Backend tasks: @backend -> @quality-assurance -> fix if needed
- Frontend tasks: @frontend -> @quality-assurance -> fix if needed
- Proto tasks: @protobuf-engineer -> @quality-assurance -> fix if needed

Commit frequently in -local. No restrictions on what you work on — all tasks, all files, fully integrated.

## Shipping (from -local to PR worktrees)

When a set of files is ready for review, ship them to the target PR branch.

### Ship Process

1. `git fetch origin`
2. Read `worktree-plan.md` — find the target PR branch and its dependencies
3. **Dependency gate**: check that all dependency branches are merged on `origin/{branch}` (NOT local). If any unmerged, report what's pending and stop.
4. Sync PR worktree: `cd` to PR worktree folder, `git pull origin {branch}`
5. Copy files from -local folder to PR worktree folder (only the files mapped to this PR in the ship manifest)
6. Handle shared files:
   - If file content is identical across branches: ship to all, mark `shared` in manifest
   - If content diverges: stop and ask user
7. Commit and push from PR worktree
8. Update ship manifest: mark files as shipped

### Ship Status

Run anytime to see where things stand:

```
PR1 (shared-types)      -> MERGED
PR2 (list-controller)   -> READY TO SHIP (PR1 merged, 3 files pending)
PR3 (detail-dialog)     -> BLOCKED (PR1 not merged yet)
PR4 (integration)       -> BLOCKED (PR2, PR3 not merged yet)
```

Build this by reading the ship manifest + checking merge status on origin via GitHub MCP.

### Rules

- Ship gate checks origin, not local — prevents shipping code that references unmerged dependencies
- Never develop in PR worktrees — they only receive shipped files
- Ship manifest is the source of truth for what's been distributed
- Commit in -local frequently, ship to PR branches when ready for review

## Gate: Before Proceeding

- [ ] All files shipped to their PR branches per the ship manifest
- [ ] All PRs created and merged into {branch}
- [ ] Ship manifest shows all files shipped

**Next:** `.kiro/guides/workflow/worktree-4-integrate.md`
