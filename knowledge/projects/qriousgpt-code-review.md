---
sync: draft
lastLocalEdit: 2026-06-12T10:39:00+12:00
---

# QriousGPT — Architecture & Code Review

## Project Overview

Custom chat UI for Snowflake Cortex Agents. React 18 + TypeScript frontend with MUI 7, Express backend as proxy to Snowflake REST API.

**Repo:** https://github.com/ebonAtQrious/qriousgpt
**Local:** C:\Projects\GitHub\qriousgpt
**Author:** Dash DesAI (Qrious)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 4.9, MUI 7, Recharts, react-markdown, remark-gfm |
| Backend | Node.js/Express (proxy server, port 3001) |
| Build | CRA + CRACO (deprecated stack) |
| Deployment | Docker (nginx + Node via supervisord), Snowpark Container Services |
| AI/Data | Snowflake Cortex Agents REST API (streaming SSE) |

## Architecture

- Frontend (port 3000): React SPA, agent selector, streaming chat, charts, voice input, feedback + eval tabs
- Backend (port 3001): Express proxy keeps Snowflake PAT server-side, streams SSE to frontend
- Security: PAT never reaches browser; backend authenticates on behalf of user
- Feedback: thumbs up/down stored in Snowflake table, async LLM-as-judge eval (Text2SQL scoring)

## Key Features

- Multi-agent selector (dynamic from Snowflake)
- Streaming responses: thinking steps, SQL queries, charts (Vega-Lite → Recharts), annotations/citations
- Feedback system with async eval (Cortex COMPLETE as judge)
- Voice input (Web Speech API)
- Question history per agent
- AI usage/consumption tracking tab
- Dark/light theme

## Code Review Findings (2026-06-12)

### Critical

1. **Dead files in repo** — `server/server copy.js` (42KB), `src/services/snowflakeAgentsApi copy.ts` (19KB)
2. **Duplicate `sendAgentFeedback`** — exists in both `services/snowflakeAgentsApi.ts` AND `utils/chatUtils.ts`
3. **Stale env validation in `index.tsx`** — references legacy vars (REACT_APP_ACCOUNT, REACT_APP_PAT etc.) that are no longer used
4. **No linting, no formatter, no pre-commit hooks** — eslintConfig in package.json but no enforcement
5. **Zero tests** — test script exists but no test files anywhere

### Security

6. **SQL interpolation risk** — `EXPLAIN USING TEXT ${sqlQueryText}` in `runText2SqlEval` directly interpolates user-submitted SQL
7. **No input length limits** — feedback text fields have no server-side size cap
8. PAT protection is solid (server-side only, never in browser)
9. Parameterized SQL bindings used correctly elsewhere
10. Rate limiting + CORS configured properly

### Architecture

11. **Main.tsx is 500+ line god component** — all state, all tabs, all accordion logic in one file
12. **`useChatMessages` hook is 400+ lines** — handles state, streaming, parsing, history, abort
13. **Backend is single 500-line file** — routing, auth, SQL, streaming, eval all in server.js
14. **No state management** — all via useState + prop drilling
15. **ChartVisualization.tsx is 34KB** — heuristic field detection mixed with rendering

### Tooling

16. **CRA + CRACO is deprecated** — should migrate to Vite or Next.js
17. **TypeScript 4.9.5** — current is 5.5+
18. **No `.dockerignore`** — node_modules sent to Docker build context
19. **package.json name is "dash-desai"** — should be "qriousgpt"
20. **10+ "UNDER CONSTRUCTION" comments** in production files

### Performance

21. Message list re-renders on every SSE chunk (new array reference via map)
22. No virtualization for long chat histories (cap at 100 messages)
23. Agent list fetches with N+1 individual DESCRIBE calls

## Priority Fixes

1. Delete dead copy files
2. Remove duplicate sendAgentFeedback from chatUtils
3. Fix EXPLAIN SQL interpolation (parameterize or validate)
4. Strip stale env vars, fix index.tsx validation
5. Add ESLint/Prettier + lint script
6. Add .dockerignore
7. Fix package.json name
8. Remove "UNDER CONSTRUCTION" comments

## Grades

| Category | Grade |
|----------|-------|
| Functionality | B+ |
| Security | B |
| Architecture | C |
| Code Hygiene | D |
| Testing | F |
| Tooling | D |
| Performance | C+ |
