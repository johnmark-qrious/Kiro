---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-01
lastPublished:
---

# Ubiquity-WebApps: Always Diff package.json Against origin/main

Before committing any changes to package.json (especially devDependencies), always check origin/main as the source of truth:

git show origin/main:monorepo/packages/ui/package.json

## Why

Feature branches may accumulate dependency drift from earlier experiments. If you add a dependency that is not on origin/main, you are introducing a new dependency  even if it already exists in the local worktree's package.json.

## Where This Bit Us

The packages/ui/package.json on the feature branch had @vitejs/plugin-react and vitest in devDependencies, but origin/main did not. We almost shipped those as part of our PR. The bun.lock also changed as a side effect and had to be restored from origin/main.

## Rule

Always run git show origin/main:<path-to-package.json> before committing dependency changes. If a dependency is not on main, it needs explicit justification.
