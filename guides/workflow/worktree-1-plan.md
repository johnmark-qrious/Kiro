---
inclusion: manual
---

# Worktree Phase 1: Evaluate & Plan

Decompose a large feature into PR-sized units. All development happens in `-local`. PR branches are distribution targets for review.

## Concepts

- **Base branch**: `{branch}` — integration branch where all sub-PRs merge (user provides the name)
- **-local worktree**: where ALL development happens (fully integrated, never blocked)
- **PR worktrees**: receive shipped files from -local for review. One per PR.
- **Ship manifest**: tracks which files belong to which PR branch

### Folder Structure

```
Projects/
  {repo}/                                    <- main repo
  {repo}-worktrees/
    {feature-name}/
      local/                                 <- ALL development here
      shared-types/                          <- PR1 review target
      list-controller/                       <- PR2 review target
      detail-dialog/                         <- PR3 review target
```

## Branch Naming

```
{branch}                         <- base branch (from main)
{branch}/shared-types            <- PR1: foundation
{branch}/list-controller         <- PR2: parallel
{branch}/detail-dialog           <- PR3: parallel
{branch}/integration             <- PR4: wiring + tests (if needed)
```

## Agent Responsibilities

After tasks.md is complete:

1. Analyze tasks for file-level dependencies — each task MUST list files it creates/modifies
2. Group into: foundation (must ship first) -> parallel (independent) -> integration (wiring)
3. Run File Overlap Check (below)
4. Produce `worktree-plan.md` with ship manifest
5. Ask user for the base branch name
6. Save branch name in `.kiro/specs/{feature}/.config.kiro`

## File Overlap Check

Before finalizing, cross-check file lists across all PR branches:

1. Build map: `file -> [PR branches that need it]`
2. Any file in 2+ branches = shared file. Mark it in the ship manifest.
3. Shared files ship identically to all branches (git merges cleanly). If content diverges between branches, stop and ask user.

Resolution if overlap is problematic:
- Move file ownership to one branch, other gets a dependency
- Merge the branches
- Sequence instead of parallel

## Worktree-Plan Format

Produce in `.kiro/specs/{feature}/worktree-plan.md`:

```markdown
# Worktree Plan: {feature-name}

## Base Branch
{branch}

## Development
All code is written in the -local worktree. PR worktrees only receive shipped files.

## Ship Manifest

| File | PR Branch | Shared | Shipped |
|------|-----------|--------|---------|
| src/types/Schema.ts | {branch}/shared-types | no | no |
| src/controllers/List.cs | {branch}/list-controller | no | no |
| src/types/Schema.ts | {branch}/list-controller | yes | no |

## Ship Order

### Ship 1: Foundation
Target: {branch}/shared-types
Dependencies: none
Files: {list}

### Ship 2: Parallel (after foundation merged on origin)
Target: {branch}/list-controller
Dependencies: shared-types merged on origin
Files: {list}

Target: {branch}/detail-dialog
Dependencies: shared-types merged on origin
Files: {list}

### Ship 3: Integration (after all parallel merged on origin)
Target: {branch}/integration
Dependencies: all parallel PRs merged on origin
Files: {list}

## Merge Order
1. shared-types -> {branch}
2. list-controller, detail-dialog -> {branch} (any order)
3. integration -> {branch}
4. Final QA on full {branch} diff vs main
5. {branch} -> main
```

## Gate: Before Proceeding

- [ ] Tasks have explicit file lists
- [ ] Tasks grouped into ship phases (foundation -> parallel -> integration)
- [ ] File overlap check passed
- [ ] worktree-plan.md produced with ship manifest
- [ ] User approved the plan
- [ ] User provided base branch name

**Next:** `.kiro/guides/workflow/worktree-2-setup.md`
