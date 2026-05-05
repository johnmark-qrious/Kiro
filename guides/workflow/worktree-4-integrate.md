---
inclusion: manual
---

# Worktree Phase 4: Final QA & Cleanup

All sub-PRs are merged into {branch}. One final check, then merge to main.

## Final QA (once, on the complete feature)

1. `git diff main...{branch}` — full diff of everything
2. @quality-assurance reviews the complete change for:
   - Duplicate code across sub-PRs
   - Inconsistent patterns (same problem solved differently)
   - Dead/orphaned code
   - Integration gaps (mismatched types, props, contracts)
3. Fix anything found directly on {branch}
4. Create PR from {branch} -> main

This is a catch-all for anything the per-task QA missed. Not a full re-review — just a scan for cross-PR issues.

## Cleanup (after feature merges to main)

```bash
# Remove all worktrees
git worktree remove ../{repo}-worktrees/{feature-name}/local
git worktree remove ../{repo}-worktrees/{feature-name}/{name1}
git worktree remove ../{repo}-worktrees/{feature-name}/{name2}
rm -rf ../{repo}-worktrees/{feature-name}

# Delete branches
git branch -d {branch}/{name1} {branch}/{name2} {branch}-local
git branch -d {branch}
git push origin --delete {branch}/{name1} {branch}/{name2} {branch}-local
```

Or use the `cleanup` script from steering/scripts.md which does all of this automatically.
