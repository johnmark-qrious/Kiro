---
status: draft
project: qriousgpt
---

# QriousGPT Improvement Spec

## Context

Forked from Snowflake's official Cortex Agents React template (Dash DesAI / Snowflake-Labs). Your team added feedback/eval layer, observability, and operational fixes on top. Current state: functional but far below your TypeScript standards. No CI, no tests, no linting, deprecated build stack.

**Repo:** https://github.com/ebonAtQrious/qriousgpt
**Local:** C:\Projects\GitHub\qriousgpt

---

## Phase 1: Hygiene

**Goal:** Remove dead code, stale config, and leftover branding. Zero behavior change.

**Workflow:** Bug Fix (small, no design decisions)

**Agent sequence:**
```
@frontend → @quality-assurance → @github-agent
```

**Instructions for @frontend:**
1. Delete `server/server copy.js`
2. Delete `src/services/snowflakeAgentsApi copy.ts`
3. Remove duplicate `sendAgentFeedback` from `src/utils/chatUtils.ts` (keep the one in `src/services/snowflakeAgentsApi.ts`)
4. Remove all `// NEW UNDER CONSTRUCTION` and `// UNDER CONSTRUCTION` comments
5. Remove commented-out imports across all files
6. Fix `package.json` name: "dash-desai" → "qriousgpt"
7. Remove Dash's LinkedIn link and "Dash" developer credit from `src/constants/textConstants.ts` header section
8. Add `.dockerignore`: node_modules, .git, build, .env, *.md
9. In `src/index.tsx`: remove the `validateEnvironment()` function and its call (it checks stale legacy vars) — the real validation lives in `src/config/env.ts`
10. In `src/config/env.ts`: remove all legacy fields from `SnowflakeConfig` interface (keep only `backendUrl`), remove legacy vars from `validateEnvironment()`

**@quality-assurance checks:**
- No behavior change (app still works identically)
- No dead code remaining
- No references to removed files

**@github-agent:** PR to main with title `chore: remove dead code, stale config, and upstream branding`

---

## Phase 2: Tooling & CI

**Goal:** Establish quality gates. New code can't regress.

**Workflow:** Feature (Existing Stack) — skip architect/DA (tooling config, not design)

**Agent sequence:**
```
@frontend → @quality-assurance → @github-agent
```

**Instructions for @frontend:**
1. Add `biome.json` at project root:
   - `noExplicitAny`: error
   - `noConsole`: error
   - `noUnusedImports`: error
   - `noUnusedVariables`: error
   - `useArrowFunction`: error
   - `useExhaustiveDependencies`: error
   - `noNonNullAssertion`: error
   - Semicolons: always
   - Quotes: double
   - Trailing commas: es5
   - Line width: 100
   - `organizeImports`: true
2. Add dev dependencies: `@biomejs/biome`
3. Add scripts to `package.json`: `"lint": "biome check src/ server/"`, `"format": "biome check --write src/ server/"`
4. Add `.commitlintrc.json` extending `@commitlint/config-conventional`, max header 100 chars
5. Add lefthook config: pre-commit runs biome check on staged files, commit-msg runs commitlint
6. Run `biome check --write` to auto-fix formatting across all files
7. Manually fix remaining biome errors that can't auto-fix:
   - Replace all `any` with proper types (use `unknown` where type is genuinely unknown, define interfaces where structure is known)
   - Replace all `console.log`/`console.error` with either: removal (if debug-only) or a proper logger pattern (simple `const log = { error: console.error }` wrapper that can be toggled)
   - Fix exhaustive deps: either add missing deps or restructure to avoid the dep
8. Add `.github/workflows/ci.yml`: on PR → checkout, install, `biome check`, `tsc --noEmit`
9. Upgrade `typescript` to `^5.5.0` in package.json, fix any new strict errors

**@quality-assurance checks:**
- `biome check` passes with zero errors
- `tsc --noEmit` passes
- CI workflow is syntactically valid
- No `any` remaining in source code
- No `console.` calls remaining in source code (except logger wrapper if introduced)

**@github-agent:** PR with title `chore: add biome, commitlint, CI workflow, fix all lint errors`

---

## Phase 3: Type Safety

**Goal:** Replace stringly-typed and `unknown` patterns with proper interfaces. Add runtime validation.

**Workflow:** Feature (Existing Stack) — medium scope

**Agent sequence:**
```
@architect (lightweight design: define the type interfaces) → user approval → @frontend → @quality-assurance → @github-agent
```

**Instructions for @architect:**
Design typed interfaces for:
- SSE event payloads (7 event types: `response.text.delta`, `response.status`, `response.tool_result`, `response.thinking`, `response.thinking.delta`, `response.chart`, `response.text.annotation`)
- Snowflake API responses (agent list, agent details, feedback response, eval result)
- A typed `AppError` class to replace `(error as any).fullMessage`
- Zod schemas for frontend env validation (replacing manual checks)
- Zod schemas for backend request validation (message body, feedback body, agent name)

**Instructions for @frontend:**
1. Create `src/types/sse-events.ts` with interfaces per the architect's design
2. Create `src/types/errors.ts` with `AppError` class
3. Replace all `(error as any).fullMessage` usage with `AppError` instances
4. Type the streaming parser in `useChatMessages.ts` using the new SSE event interfaces
5. Replace `charts?: any[]` in `ChatMessage` type with proper `ChartContent[]`
6. Add Zod to dependencies
7. Rewrite `src/config/env.ts` using Zod schema (with `.default()` for build-time safety)
8. Type `useSpeechRecognition` events (replace `any` on `SpeechRecognition` and `SpeechRecognitionEvent`)

**Instructions for @backend (server-side, if applicable):**
1. Add input validation middleware using Zod: validate message body shape, feedback payload, agent name format
2. Add max-length constraints on feedback text fields (e.g., 10,000 chars)
3. Fix `EXPLAIN USING TEXT ${sqlQueryText}` — either:
   - Wrap in a try/catch and validate `sqlQueryText` is a single SELECT statement (no semicolons, no DDL keywords)
   - Or skip the EXPLAIN step entirely (it's a nice-to-have sanity check, not critical)

**@quality-assurance checks:**
- Zero `any` in the codebase (search confirm)
- Zero type assertions (`as unknown as X`, `as any`) except genuinely necessary boundary points (max 2-3, each with a comment explaining why)
- Zod schemas reject malformed input (test with bad data)
- `tsc --noEmit --strict` passes

**@github-agent:** PR with title `feat: add full type safety, Zod validation, typed SSE parser`

---

## Phase 4: Architecture Refactor

**Goal:** Break god components apart. Same behavior, better structure.

**Workflow:** Refactor

**Agent sequence:**
```
@architect (scope only — define component/module boundaries) → user approval → @frontend (frontend refactor) → @backend (backend refactor) → @quality-assurance → @github-agent
```

**Instructions for @architect:**
Define the target structure:
- Frontend: which contexts, which components, which utilities get extracted
- Backend: which route files, middleware, services

**Instructions for @frontend:**
1. Create `src/contexts/AgentContext.tsx` — holds selected agent, config, loading, refresh
2. Create `src/contexts/ChatContext.tsx` — holds messages, isLoading, sendMessage, cancelRequest, clearMessages
3. Split `Main.tsx` into:
   - `src/components/AppShell.tsx` (header + tabs + layout skeleton)
   - `src/components/tabs/ChatTab.tsx` (messages + starter questions + history + input)
   - Keep existing `FeedbackTab`, `UsageTab`, `FeedbackEvalsTab` as-is
4. Extract `src/utils/sseParser.ts` from `useChatMessages.ts` — pure function that takes a ReadableStream and yields typed events
5. Extract `src/utils/chartParser.ts` from `ChartVisualization.tsx` — all the Vega-Lite → Recharts transformation logic
6. Extract `src/components/shared/ErrorDisplay.tsx` — the error box UI used in 3 places

**Instructions for @backend:**
1. Create `server/routes/agents.js` — GET /agents, GET /agents/:name, POST /agents/:name/messages
2. Create `server/routes/feedback.js` — GET+POST feedback, GET eval
3. Create `server/routes/health.js` — GET /health
4. Create `server/middleware/snowflakeAuth.js` — getSnowflakeAuthHeaders, config
5. Create `server/middleware/validation.js` — validateAgentName, validateMessageBody
6. Create `server/services/snowflake.js` — sfStatement, safeJsonParse
7. Create `server/services/eval.js` — runText2SqlEval
8. Slim `server/server.js` down to: init express, mount middleware, mount routes, start listener

**@quality-assurance checks:**
- App behavior is identical (same API, same UI, same streaming)
- No file > 200 lines
- No component manages more than one concern
- Backend routes are testable in isolation

**@github-agent:** Split into 2 PRs:
- `refactor: extract frontend contexts, split Main.tsx, extract utilities`
- `refactor: split backend into routes, middleware, and services`

---

## Phase 5: Testing

**Goal:** Safety net for future changes. High-value tests only.

**Workflow:** Feature (Existing Stack)

**Agent sequence:**
```
@tester (design test plan) → @frontend (implement frontend tests) → @backend (implement backend tests) → @quality-assurance → @github-agent
```

**Instructions for @tester:**
Design test cases for:
- SSE stream parser (given raw SSE text chunks, assert correct typed events emitted)
- Chart data transformer (given Vega-Lite specs of each chart type, assert Recharts-compatible output)
- Agent config mapper (Snowflake response → internal config)
- Env validation (missing/invalid vars)
- Backend agent routes (mock Snowflake, verify proxy, verify streaming passthrough)
- Backend feedback routes (mock Snowflake SQL API, verify insert + eval trigger)

**Instructions for @frontend:**
1. Add Vitest + @testing-library/react as dev dependencies
2. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts
3. Implement unit tests:
   - `src/utils/__tests__/sseParser.test.ts`
   - `src/utils/__tests__/chartParser.test.ts`
   - `src/services/__tests__/snowflakeAgentsApi.test.ts` (mock fetch)
   - `src/config/__tests__/env.test.ts`

**Instructions for @backend:**
1. Add test runner for backend (vitest or jest with `--experimental-vm-modules`)
2. Implement integration tests:
   - `server/__tests__/agents.test.js` (supertest + mocked fetch)
   - `server/__tests__/feedback.test.js`
   - `server/__tests__/eval.test.js`

**@quality-assurance checks:**
- All tests pass
- Tests cover the risky parsing/transformation logic
- No flaky tests (no timers, no real network)

**@github-agent:** PR with title `test: add Vitest, unit tests for parsers, integration tests for backend`

Add test step to CI workflow.

---

## Phase 6: Modernize Stack

**Goal:** Replace deprecated CRA+CRACO with Vite. Align with team tooling.

**Workflow:** Refactor — medium risk (build system change)

**Agent sequence:**
```
@architect (migration plan + risk assessment) → user approval → @frontend → @quality-assurance → @github-agent
```

**Instructions for @architect:**
Produce a migration checklist: CRA → Vite. Cover:
- Env var prefix change (`REACT_APP_` → `VITE_`)
- index.html move (public/ → root)
- Proxy config (craco → vite.config.ts)
- Build output location
- SPCS Dockerfile changes
- Any CRA-specific features used (just the ForkTsChecker plugin in craco.config.js — Vite handles this natively)

**Instructions for @frontend:**
1. Remove: `react-scripts`, `@craco/craco`, `craco.config.js`
2. Add: `vite`, `@vitejs/plugin-react`
3. Create `vite.config.ts` with React plugin + proxy to backend on :3001
4. Move `public/index.html` to root, update with Vite entry (`<script type="module" src="/src/index.tsx">`)
5. Rename all `process.env.REACT_APP_*` to `import.meta.env.VITE_*` across the codebase
6. Update `src/config/env.ts` to use `import.meta.env`
7. Update scripts: `"start": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`
8. Switch from npm to Bun: delete `package-lock.json`, run `bun install`, generate `bun.lock`
9. Update Dockerfile: replace `npm ci` with `bun install --frozen-lockfile`, replace `npm run build` with `bun run build`
10. Update CI workflow to use Bun
11. Add path alias: `@/` → `src/` in tsconfig + vite config
12. Update all deep relative imports to use `@/` alias

**@quality-assurance checks:**
- `bun run build` produces working production build
- Dev server starts and streams correctly
- Docker build succeeds
- All tests still pass
- No references to `react-scripts`, `craco`, or `REACT_APP_` remain

**@github-agent:** PR with title `chore: migrate from CRA+CRACO to Vite+Bun`

---

## Phase 7: Performance & Polish

**Goal:** Optimize rendering and UX for production scale.

**Workflow:** Feature (Existing Stack) — small scope per item

**Agent sequence:**
```
@frontend → @quality-assurance → @github-agent
```

**Instructions for @frontend:**
1. Wrap `ChatMessage` component in `React.memo` with custom comparator (compare by message.id + message.text.length + message.status)
2. In `useChatMessages`: accumulate streaming text in a `useRef`, flush to state on a `requestAnimationFrame` cadence (batches rapid SSE chunks into fewer re-renders)
3. Add `@tanstack/react-virtual` for message list virtualization (only render visible messages)
4. Cache agent specs in `sessionStorage` with 5-minute TTL (skip N+1 DESCRIBE calls on page refresh)
5. Add loading skeletons (MUI `Skeleton`) for initial agent load instead of spinner
6. Add optimistic UI for feedback (show "Thanks!" immediately, reconcile on response)
7. Debounce speech recognition transcript updates (100ms)

**@quality-assurance checks:**
- No visual regression
- Streaming feels smoother (fewer layout shifts during SSE)
- Memory stable with 100 messages (no leak from virtualization)

**@github-agent:** PR with title `perf: memoize messages, batch stream renders, virtualize list`

---

## Execution Notes

- Phases 1-3 can run sequentially in a single sprint (~1 week)
- Phase 4 is the biggest risk — can split frontend/backend into parallel PRs
- Phase 5 can run in parallel with Phase 4 (test the old structure, tests still valid after refactor if interfaces don't change)
- Phase 6 is standalone — do it whenever, but after Phase 5 so tests validate the migration
- Phase 7 only matters if the app gets real usage volume

**Minimum viable improvement:** Phases 1-3 (5-7 days). After that you have a linted, typed, CI-gated codebase that won't embarrass you in a code review.
