---
sync: draft
notionPageId:
lastLocalEdit: 2026-04-23
lastPublished:
---

# Distribute Changes from Local Branch to PR Branches

When all edits live on a single branch (e.g. the `-local` testing worktree or the feature branch itself) and need to be distributed to individual PR branches based on the worktree plan's file-to-branch mapping.

## When to Use

- After testing in the `-local` worktree and making fixes there
- After QA review produces fixes that were applied on the feature branch
- Any time one branch has the "truth" and individual PR branches need updating

## Prerequisites

- `worktree-plan.md` exists with file-to-branch mapping
- All PR branches already exist
- Changes are unstaged/uncommitted on the source branch

## Workflow

### 1. Run QA First

Before distributing, run `@quality-assurance` on the full diff to catch issues. Fix everything on the source branch before distributing — it's much easier to fix once than fix in 4 PRs.

### 2. Map Files to PRs

Use `git status --short` to list all changed files. Cross-reference against `worktree-plan.md` to assign each file to a PR. Files not in the plan need a manual decision.

### 3. Stash and Distribute

**Do NOT use `git stash pop`** — it causes merge conflicts when PR branches have different file sets.

Instead, use `git checkout stash -- file` to selectively pull files:

```bash
# Stash all distributable files (exclude any files you want to keep)
git stash push -m "distribute-to-prs" -- file1 file2 file3 ...

# For each PR branch:
git checkout feature/xxx-prN
git checkout 'stash@{0}' -- "path/to/file-for-this-pr"
# Verify with git diff --staged
git commit -m "type(scope): description"
git push origin feature/xxx-prN

# Repeat for each PR branch

# When done, switch back and drop the stash
git checkout feature/xxx
git stash drop
```

### 4. Key Details

- **PowerShell escaping**: Use `'stash@{0}'` (single quotes) — PowerShell eats `@{}` otherwise
- **Excluded files**: Any file you don't stash stays as a dirty file on the source branch
- **Untracked files from stash pop**: If a file doesn't exist on the target branch, `git checkout stash` may leave it as untracked — just `Remove-Item` it
- **Pre-commit verification**: Always run `git diff --staged` before committing (per git steering)
- **Conventional commits**: Each PR gets its own commit message describing the resulting state

### 5. Post-Distribution

- Source branch should only have excluded files as dirty
- Each PR branch has its specific files committed and pushed
- Run verification on each PR folder if needed

## Anti-Patterns

- **Don't use `git stash pop`** on PR branches — causes conflicts when branches have different file sets
- **Don't distribute before QA** — fix once on the source branch, not 4 times across PRs
- **Don't forget to drop the stash** after distribution is complete
- **Don't include files that belong to other PRs** — cross-check the worktree plan
- **Don't forget to check PR branches for stale files from old commits that should be cleaned up** — distribution only adds new changes, it doesn't remove leftover files from previous commits
