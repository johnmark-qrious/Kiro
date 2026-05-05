---
inclusion: manual
---

# Parallel Worktree Strategy

Local-first development: code everything integrated in -local, ship files to PR branches for review.

| Phase | File | When |
|-------|------|------|
| 1. Plan | `worktree-1-plan.md` | After tasks.md — decide PR splits, build ship manifest |
| 2. Setup | `worktree-2-setup.md` | After plan approved — create branches, worktrees |
| 3. Execute & Ship | `worktree-3-execute.md` | During development — code in -local, ship to PR branches |
| 4. Final QA & Cleanup | `worktree-4-integrate.md` | All PRs merged — one final QA, then merge to main |

Start with Phase 1.
