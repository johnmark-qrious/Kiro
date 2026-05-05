---
inclusion: manual
---

# Worktree Phase 2: Setup

Create branches, worktrees, and configs. Run after user approves the worktree-plan.

## Step 1: Create Base Branch

```bash
git checkout -b {branch} main
git push -u origin {branch}
```

## Step 2: Create -local Worktree (development target)

```bash
mkdir -p ../{repo}-worktrees/{feature-name}
git worktree add ../{repo}-worktrees/{feature-name}/local -b {branch}-local {branch}
ln -s "$(pwd)/.kiro" ../{repo}-worktrees/{feature-name}/local/.kiro
```

This is where ALL development happens. Fully integrated, never blocked.

## Step 3: Create PR Worktrees (review targets)

One per PR branch from the worktree-plan:

```bash
git worktree add ../{repo}-worktrees/{feature-name}/{name1} -b {branch}/{name1} {branch}
git worktree add ../{repo}-worktrees/{feature-name}/{name2} -b {branch}/{name2} {branch}
ln -s "$(pwd)/.kiro" ../{repo}-worktrees/{feature-name}/{name1}/.kiro
ln -s "$(pwd)/.kiro" ../{repo}-worktrees/{feature-name}/{name2}/.kiro
```

These worktrees receive files during shipping. No development happens here.

## Step 4: Config

Write `.kiro/specs/{feature}/.config.kiro`:

```json
{
  "specType": "feature",
  "branch": "{branch}",
  "repo": "{repo}",
  "pbiId": "{pbiId}",
  "pbiName": "{pbiName}"
}
```

## Step 5: Tell User

"Setup complete. Open `../{repo}-worktrees/{feature-name}/local` in Kiro and start coding. When ready to ship, use Phase 3."

## Gate: Before Proceeding

- [ ] Base branch created and pushed
- [ ] -local worktree created (development target)
- [ ] PR worktrees created (review targets)
- [ ] .kiro symlinked into all worktrees
- [ ] .config.kiro written

**Next:** `.kiro/guides/workflow/worktree-3-execute.md`
