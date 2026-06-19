# QriousGPT Improvement Plan

## Context

Forked from Snowflake's official starter template (Dash DesAI). Current state: functional prototype with significant code hygiene debt, no CI, no tests, deprecated toolchain. Goal: bring to production quality matching our TypeScript standards.

---

## Phase 1: Hygiene (1-2 days)

Zero behavior change. Just clean the mess so future work isn't fighting ghosts.

- [ ] Delete `server/server copy.js` and `src/services/snowflakeAgentsApi copy.ts`
- [ ] Remove duplicate `sendAgentFeedback` from `utils/chatUtils.ts` (keep the one in services)
- [ ] Remove all `// NEW UNDER CONSTRUCTION` and `// UNDER CONSTRUCTION` comments
- [ ] Remove commented-out imports and dead code
- [ ] Fix `package.json` name from "dash-desai" to "qriousgpt"
- [ ] Remove Dash's branding from header (LinkedIn link, "Dash" references in textConstants)
- [ ] Add `.dockerignore` (node_modules, .git, build, .env)
- [ ] Remove stale env validation in `index.tsx` (legacy REACT_APP_* vars)
- [ ] Clean up `env.ts` — remove legacy fields from `SnowflakeConfig` interface, keep only `backendUrl`

---

## Phase 2: Tooling & CI (1-2 days)

Establish quality gates so new code can't regress.

- [ ] Add Biome config (`biome.json`) matching your team standards:
  - noExplicitAny: error
  - noConsole: error
  - noUnusedImports: error
  - useArrowFunction: error
  - useExhaustiveDependencies: error
  - semicolons: always
  - quotes: double
  - organizeImports: true
- [ ] Add `lint` and `format` scripts to package.json
- [ ] Add commitlint + conventional commit config
- [ ] Add lefthook (pre-commit: biome check, commit-msg: commitlint)
- [ ] Fix all biome errors (bulk: remove console.*, fix `any` types, sort imports)
- [ ] Add GitHub Actions CI workflow: lint + typecheck on PR
- [ ] Upgrade TypeScript to 5.5+

---

## Phase 3: Type Safety (2-3 days)

Kill every `any`. Make the type system actually protect you.

- [ ] Type the streaming SSE event data (define interfaces for each event type: `response.text.delta`, `response.status`, `response.tool_result`, `response.thinking`, `response.chart`, `response.text.annotation`)
- [ ] Type the Snowflake API responses properly (agent list, agent details, feedback, eval)
- [ ] Replace `(error as any).fullMessage` pattern with a typed `AppError` class
- [ ] Type `ChartVisualization` props and parsing results (remove `any[]` from charts)
- [ ] Add Zod schemas for environment validation (replace manual `process.env` checks)
- [ ] Add Zod schemas for API request/response validation on the backend
- [ ] Type the speech recognition event handlers (replace `any` on SpeechRecognition events)

---

## Phase 4: Architecture Refactor (3-5 days)

Break the god components apart. No new features — same behavior, better structure.

### Frontend
- [ ] Extract agent state into a React context (`AgentProvider` — selected agent, config, refresh)
- [ ] Extract chat state into a context or reducer (`ChatProvider` — messages, loading, send, cancel)
- [ ] Split `Main.tsx` into:
  - `ChatTab.tsx` (messages + input)
  - `FeedbackTab.tsx` (already exists)
  - `UsageTab.tsx` (already exists)
  - `AppShell.tsx` (header + tabs + layout)
- [ ] Extract streaming SSE parser from `useChatMessages` into `parseSSEStream.ts` utility
- [ ] Extract chart data transformation from `ChartVisualization.tsx` into `utils/chartParser.ts`
- [ ] Move error display logic into a shared `ErrorDisplay` component (used in 3 places with identical code)

### Backend
- [ ] Split `server.js` into:
  - `routes/agents.js` (list, describe, messages)
  - `routes/feedback.js` (submit, get, eval)
  - `routes/health.js`
  - `middleware/auth.js` (Snowflake headers)
  - `middleware/validation.js` (agent name, request body)
  - `services/snowflake.js` (sfStatement, auth config)
  - `services/eval.js` (runText2SqlEval)
- [ ] Fix SQL interpolation in `runText2SqlEval` — use EXPLAIN via parameterized statement or validate SQL doesn't contain injection patterns

---

## Phase 5: Testing (2-3 days)

High-value tests only. Not 100% coverage — cover the risky parts.

- [ ] Unit test: SSE stream parser (given raw SSE chunks, produces correct message state)
- [ ] Unit test: chart data transformer (Vega-Lite spec → Recharts data)
- [ ] Unit test: agent config mapping (Snowflake API response → internal config)
- [ ] Unit test: env validation (missing vars throw, present vars pass)
- [ ] Integration test: backend `/api/agents` route (mock Snowflake, verify proxy behavior)
- [ ] Integration test: backend `/api/agents/:name/messages` streaming (mock upstream SSE)
- [ ] Integration test: feedback submit + eval trigger
- [ ] Add test runner: Vitest (works with both CRA and future Vite migration)
- [ ] Add test script to CI workflow

---

## Phase 6: Modernize Stack (3-5 days)

Migrate off deprecated CRA+CRACO to a modern build system.

- [ ] Migrate from CRA+CRACO to **Vite** (fastest path, no framework change needed):
  - Replace `react-scripts` with `vite` + `@vitejs/plugin-react`
  - Move `index.html` to root
  - Update env var prefix from `REACT_APP_` to `VITE_`
  - Remove craco.config.js
  - Update scripts in package.json
- [ ] Switch package manager from npm to **Bun** (align with team tooling)
- [ ] Add path aliases (`@/` → `src/`) via tsconfig + vite config
- [ ] Consider: move backend into the same Vite project as an API route (or keep separate if SPCS deployment needs it)

---

## Phase 7: Performance & Polish (2-3 days)

Only worth doing after the architecture is clean.

- [ ] Add `React.memo` to `ChatMessage` component (prevents re-render of all messages on each SSE chunk)
- [ ] Use `useRef` for accumulating stream text instead of setState on every chunk (batch renders)
- [ ] Add virtualized message list (`react-window` or `@tanstack/virtual`) for long conversations
- [ ] Batch agent DESCRIBE calls (or cache agent specs client-side with TTL)
- [ ] Add loading skeletons instead of spinner for initial agent load
- [ ] Add optimistic UI for feedback submission
- [ ] Debounce speech recognition transcript updates

---

## Summary

| Phase | Effort | Risk | Value |
|-------|--------|------|-------|
| 1. Hygiene | 1-2 days | None | Unblocks everything else |
| 2. Tooling & CI | 1-2 days | Low | Prevents regression |
| 3. Type Safety | 2-3 days | Low | Catches bugs at compile time |
| 4. Architecture | 3-5 days | Medium | Enables future features without pain |
| 5. Testing | 2-3 days | Low | Safety net for refactors |
| 6. Modernize | 3-5 days | Medium | Dev speed, build speed, team alignment |
| 7. Performance | 2-3 days | Low | UX improvement at scale |

**Total: ~15-23 days of focused work** (can be done in parallel by 2 people: one on frontend phases, one on backend + tooling).

**Stop-after-Phase-3** gives you a maintainable, type-safe codebase with CI. Phases 4-7 are for when this becomes a long-lived product rather than an internal tool.
