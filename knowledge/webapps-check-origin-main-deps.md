---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-01
lastPublished:
---

# Ubiquity-WebApps: Always Diff package.json Against origin/main

Feature branches in this monorepo sometimes accumulate stale devDependencies that were added during development but should not be shipped. Before committing any package.json change, always run:

git show origin/main:path/to/package.json

Compare the devDependencies section. If a dependency does not exist on origin/main, do not add it unless there is a clear reason and the user approves.

## Where This Bit Us

packages/ui/package.json on the feature branch had @vitejs/plugin-react and vitest in devDependencies. These were not on origin/main. Committing them would have introduced unnecessary dependencies and changed bun.lock.
