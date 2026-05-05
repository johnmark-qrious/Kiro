---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-01
lastPublished:
---

# Ubiquity-WebApps: Test Framework is bun:test, Not Vitest

The monorepo uses bun:test as its test runner, not vitest. All existing test files import from "bun:test":

import { describe, expect, it } from "bun:test";

## Key Details

- vitest.config.ts and vitest.setup.ts exist in packages/ui/ on origin/main but are unused scaffolding
- @vitejs/plugin-react and vitest are NOT in packages/ui/package.json on origin/main
- For mock functions, use mock() from bun:test instead of vi.fn() from vitest
- For DOM assertions, use toBeTruthy() / toBeNull() instead of toBeInTheDocument() from jest-dom
- afterEach(cleanup) is needed since bun:test does not auto-cleanup like vitest with globals

## Where This Bit Us

Writing a React component test with vitest imports, then discovering the project uses bun:test. Had to rewrite the test file and remove accidentally-added devDependencies.
