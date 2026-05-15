---
sync: draft
notionPageId:
lastLocalEdit: 2026-05-13T12:37:00+12:00
lastPublished:
---

# Ubiquity-WebApps — Pre-Push Tooling & CI

## Git Hooks (lefthook v2.1.3)

| Hook | Command | What it does |
|------|---------|--------------|
| commit-msg | `npx commitlint --edit {1}` | Validates conventional commit format |
| pre-commit | `bunx --bun lint-staged` | Runs biome on staged .ts/.tsx files |
| pre-push | `bun run typecheck` | Full turbo typecheck across all apps |

## lint-staged

Runs on `*.{ts,tsx}` files:
```
biome check --write --no-errors-on-unmatched
```
Auto-fixes formatting and lint issues on staged files before commit.

## Commitlint (.commitlintrc.json)

- Extends: `@commitlint/config-conventional`
- Rules: `header-max-length: 100`
- Format: `type(scope): description`

## Biome (v2.3.13, biome.json)

Formatter:
- Line ending: LF
- Line width: 100
- Semicolons: always
- Trailing commas: ES5
- Quote style: double
- Arrow parens: always
- Bracket same line: true

Key lint rules:
- `noUnusedImports`: error
- `noUnusedVariables`: error
- `noExplicitAny`: error
- `noConsole`: error
- `noEnum`: error
- `noCommonJs`: error
- `useArrowFunction`: error
- `useSortedClasses`: error (with `cn` function)
- `useExhaustiveDependencies`: error
- `noNonNullAssertion`: error
- `useAwait`: error

## Sherif

Dependency consistency checker across monorepo workspaces. Runs via `bun run check:sherif`.

## Package Scripts (root)

| Script | Command |
|--------|---------|
| `dev` | `turbo run dev` |
| `build` | `turbo run build` |
| `typecheck` | `turbo run typecheck` |
| `test:unit` | `turbo run test:unit` |
| `check:biome` | `bunx --bun biome check` |
| `check:sherif` | `bunx --bun sherif` |
| `fix:biome` | `bunx --bun biome check --write` |
| `fix:sherif` | `bunx --bun sherif --fix` |
| `doctor` | `bun run fix:biome && bun run fix:sherif` |
| `postinstall` | Runs doctor (biome + sherif fix) after install |

## CI Pipeline (pr.yml)

Triggers on PR to `main` or `support/**` (non-draft only).

### Validate job:
1. Checkout (shallow: commits + 1)
2. Setup Bun (latest)
3. `bun install --frozen-lockfile`
4. Commitlint (from base SHA to head SHA)
5. Typecheck (`bun turbo typecheck`)
6. Lint (`bun run check:biome`)
7. Sherif (`bun run check:sherif`)
8. Terraform fmt check (`terraform fmt -check -recursive tf`)
9. Unit tests (`bun turbo test:unit` with JUnit reporter)
10. Convert to CTRF + report results

### Detect apps job:
- Discovers all apps in `monorepo/apps/*/`
- Discovers all Terraform stacks in `tf/*/`

### Terraform validate job (per stack):
- `terraform init -backend=false`
- `terraform validate`

## Known Issue (2026-05-12)

`bunx --bun` segfaults on Windows (exit code -1073741819 / 0xC0000005). Affects:
- Pre-commit hook (lint-staged)
- Postinstall (doctor script)
- `check:biome` and `check:sherif` scripts

Workaround: run `node_modules/.bin/lint-staged` directly, or commit from a terminal where bunx works. CI is unaffected (runs on Ubuntu).

## Fixed: packages/ui @/lib/utils Path Alias (2026-05-14)

**Problem:** Shadcn components in `packages/ui/src/shadcn/` used `import { cn } from "@/lib/utils"`. This path alias only resolves within packages/ui's own tsconfig. When consuming apps (admin, database) typecheck and follow imports into packages/ui source, TypeScript resolves `@/` against the consuming app's path mapping, causing `Cannot find module '@/lib/utils'`.

**Why it was masked:** Turbo cache. Once an app typechecked successfully, the cache persisted. Only cache misses exposed the bug.

**Fix:** Replaced `@/lib/utils` with `../lib/utils` (relative import) in 6 shadcn files: accordion, button, card, checkbox, dialog, input.

**Rule:** In shared packages, NEVER use path aliases (`@/`) for internal imports. Always use relative paths. Path aliases break when consumers typecheck through source files.

## Gotcha: Env Validation + Docker Build (2026-05-13)

**Problem:** Zod env schemas with no `.default()` (e.g. `z.string().url()`) crash the Docker build. The Dockerfile runs `next build` without env vars present - it relies on defaults to get past the Zod parse at build time. Real values are injected at runtime via ECS task definitions.

**Rule:** All env vars in `src/config/env.ts` MUST have `.default("http://placeholder")` or similar. Never use `.url()` or bare `.string()` without a default for URL fields.

**Why it works locally:** You have a `.env` file. Docker doesn't copy `.env` into the build stage.

**Existing pattern:** All apps (database, journey-builder) use `z.string().default("http://placeholder")` for gRPC/API URLs. Follow this pattern for any new app.

**If you want strict validation:** Do it at runtime startup (e.g. a health check that verifies real URLs are configured), not at Zod schema parse time.

## Known Issue: Stale Protos Symlink After Merge (2026-05-13)

After merging main into a feature branch (or any operation that bumps `@qriousnz/ubiquity-protos` version in the lockfile), bun may NOT update the per-app `node_modules/@qriousnz/ubiquity-protos` symlink. The root `node_modules/.bun/` gets the new version but individual app `node_modules/` keep pointing to the old one.

**Symptom:** Typecheck fails with missing enum values or types that clearly exist in the package (e.g., `Property 'CONNECTION_MANAGEMENT' does not exist on type 'typeof FeatureName'`). The root package has the type, but the app-level symlink points to an older version.

**Diagnosis:**
```powershell
# Check root version (correct):
Select-String -Path "node_modules\.bun\node_modules\@qriousnz\ubiquity-protos\package.json" -Pattern "version"
# Check app version (stale):
Select-String -Path "monorepo\apps\{app}\node_modules\@qriousnz\ubiquity-protos\package.json" -Pattern "version"
```

**Fix:**
```powershell
Remove-Item -Recurse -Force "monorepo\apps\{app}\node_modules\@qriousnz\ubiquity-protos"
bun install --frozen-lockfile
```

**When to suspect this:** Any time typecheck fails on types/enums that were recently added to protos, especially after merging main or bumping the protos version.
