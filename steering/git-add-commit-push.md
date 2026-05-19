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

**Enforced by hook:** `pre-commit-verify-staged.kiro.hook`

Why: Tool reads can return buffered state that differs from what git will actually commit. Always verify staged content is real.

## Pre-Push Quality Gate

Before pushing to any branch that will become a PR:

1. **Lint + typecheck pass** — `bun run lint` / `dotnet build --warnaserror`. No exceptions.
2. **10-second diff scan** — read your own diff. "Would I approve this in someone else's PR?"
3. **Skill file check** — if a skill file exists for this task type (`.kiro/skills/`), re-read it. Confirm no contradiction.
4. **Visual proof (UI changes only)** — if the change is visible in a browser, run Playwright with `video: 'on'`. Attach the recording to the PR description. Skip for API-only, proto, config, or backend-only changes.
5. **Contract verification (proto changes only)** — `buf breaking --against 'main'` + verify at least one downstream client compiles.

**Exempt:** Spike/prototype branches not targeting main. Gate the merge, not the exploration.

## Post-Push Retrospective

**Enforced by hook:** `post-push-retro-trigger.kiro.hook`

Why: Retrospectives after push catch guide gaps, friction points, and knowledge discoveries while context is fresh. The hook guarantees it fires before any other work.

## PR Description Template

**Always read the repo's PR template** (`.github/pull_request_template.md` or equivalent) before creating a PR. Fill in every section. Never use a freeform description.

- If the template has checkboxes, check the ones that apply
- If a section doesn't apply, write "N/A" — don't delete it
- The template is the contract with reviewers — skipping it wastes their time

## Worktree Setup

When working in a fresh git worktree, run `bun install` (or the
repo's package manager install) before any git operations. Git hooks
(e.g. lefthook) live in `node_modules` and won't run without deps.

## Don't Do This

- **Don't use `--no-verify` as a first resort.** *(Enforced by `block-no-verify.kiro.hook`)* If hooks fail,
  diagnose why (missing deps, wrong env, broken config) and fix the
  root cause. `--no-verify` masks real problems.
- **Don't push multi-commit PRs when the base is a merge commit.** The commitlint CI uses a shallow clone (`fetch-depth: commits + 1`) that can't resolve the base SHA when it's a merge commit at the boundary. Squash to 1 commit on a fresh branch off the base. This is a known `unit-tests.yml` fragility  real fix is `fetch-depth: 0` but that needs a separate CI PR.
- **Never push fixes to a branch that has an open PR under review.** If issues are found after a PR is created (CI failures, missing files, config fixes), create a new branch off the target base, fix it there, and open a separate PR. The original PR's scope is locked once it's in review. Piggybacking fixes onto it bypasses the review process for those fixes.

## No Dead Code, No Placeholders, No Temporary Content

Every line committed must serve a purpose. Do NOT commit:
- Dead code (unused imports, unreachable branches, commented-out blocks)
- Placeholder files (dummy tests, empty implementations, stub-only files)
- TODO-only code with no real logic
- Temporary scaffolding that exists only to "make the folder exist"
- Empty files or directories used as placeholders

This applies globally — source code, tests, configs, everything. If it doesn't do something real, it doesn't get committed. Create files when they have real content, not before.
