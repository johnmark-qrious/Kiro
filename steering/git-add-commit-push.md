---
inclusion: manual
---

# git add, commit and push Protocol

Commit messages should explain the resulting state of the code, not the reason why you're changing it

## Conventional Commits (commitlint)

All commits must follow conventional commit format: `type(scope): description`
- Subject line max 100 characters (enforced by commitlint)
- Body lines max 100 characters each
- Common types: `feat`, `fix`, `chore`, `refactor`, `docs`, `ci`, `test`

## Squash Merge on GitHub

When squash merging a PR on GitHub, always:
1. Ensure the PR title follows conventional commit format — GitHub uses it as the squash commit subject
2. Clear or trim the commit body in the merge dialog — GitHub dumps the full PR description into the body by default, which causes `body-max-line-length` violations
3. Recommended repo setting: Settings → General → Pull Requests → set default squash commit message to "Pull request title only"

## Pre-Commit Verification

Before every `git commit`, run `git diff --staged` to verify file content is actually present. Don't trust tool reads  verify what git will actually commit. Empty files or missing content won't be caught by `readFile` or `getDiagnostics` if they read from a buffered state.

## Post-Push Retrospective

**MANDATORY** - fires immediately after git push, before ANY other work (user summary, next task). Do NOT skip or defer. The retrospective is the first thing after push output.

After every `git push`, the agent MUST do a brief self-assessment:

1. **What went well** — Did we follow the guides? Was the approach clean?
2. **What could be better** — Did we hit any friction? Did we improvise where a guide should exist?
3. **Guide updates needed?** — Propose any updates to steering, guides, or knowledge base entries
4. **Knowledge discoveries** — Did we learn anything non-obvious about the codebase worth adding to `.kiro/knowledge/`?

Keep it short — 2-4 bullet points max. This is a quick pulse check, not a full report.
Wait for user approval before making any changes to guides/knowledge.

## Worktree Setup

When working in a fresh git worktree, run `bun install` (or the
repo's package manager install) before any git operations. Git hooks
(e.g. lefthook) live in `node_modules` and won't run without deps.

## Don't Do This

- **Don't use `--no-verify` as a first resort.** If hooks fail,
  diagnose why (missing deps, wrong env, broken config) and fix the
  root cause. `--no-verify` masks real problems.
- **Don't push multi-commit PRs when the base is a merge commit.** The commitlint CI uses a shallow clone (`fetch-depth: commits + 1`) that can't resolve the base SHA when it's a merge commit at the boundary. Squash to 1 commit on a fresh branch off the base. This is a known `unit-tests.yml` fragility  real fix is `fetch-depth: 0` but that needs a separate CI PR.
