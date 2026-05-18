---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Skill Auditor Gate

## Gate Condition

**Do not proceed to implementation unless this gate has run and the user has acknowledged the output.**

Skip when: Bug fix workflow, or task touches ≤3 files with no new technology.

## When This Runs

After the design is complete (architecture section exists, @dark-architect debate finished if applicable). Before presenting the design to the user for approval.

## Process

### 1. Extract Technologies

Scan the design document for every named:
- Language, framework, library, UI kit
- Database, cache, queue, search engine, object store
- Cloud service, runtime, IaC tool, CI system
- Protocol, spec, standard (OAuth2, WebSocket, SSE, OpenTelemetry, etc.)
- API or data source (OpenSky, Mapbox, Stripe, etc.)
- Architectural pattern (CRDT, event sourcing, CQRS, real-time streaming, etc.)

### 2. Check Coverage

For each extracted item, check:
- `/skills/` — does a matching skill file exist?
- `/guides/` — does a matching guide cover this technology?
- Is it baseline knowledge (standard HTTP, basic SQL, common patterns) that doesn't need a dedicated doc?

Classify each:
- ✅ **Covered** — skill or guide exists and addresses this technology
- ⚠️ **Partial** — general guide exists but lacks specific depth for this use case
- ❌ **Gap** — nothing covers this

### 3. Produce Gap Table

Always produce this table, even if all items are ✅:

```markdown
## Skill Audit

| Technology | Source in Design | Coverage | Verdict |
|-----------|-----------------|----------|---------|
| Next.js App Router | §Frontend | /guides/frontend/nextjs-conventions.md | ✅ Covered |
| Mapbox GL JS | §Map Rendering | None | ❌ Gap |
| WebSocket/SSE | §Real-time Updates | None | ❌ Gap |
| OpenSky Network API | §Data Sources | None | ❌ Gap |

### Gaps Requiring Action

| Gap | Recommended Action | Risk if Skipped |
|-----|-------------------|-----------------|
| Mapbox GL JS | Research official docs + draft skill | High — complex API, easy to hallucinate |
| WebSocket/SSE in Next.js | Draft skill from Next.js docs | Medium — well-documented but non-trivial |
| OpenSky Network API | Spike first (test free tier limits) | Medium — unknown rate limits and data shape |

### Recommendation
[Fill gaps before implementing / Proceed with caution on low-risk gaps / Spike required for X]
```

### 4. Action Types

Not all gaps are equal. Recommend one per gap:

| Action | When |
|--------|------|
| **Draft skill** | Well-documented technology, AI can produce accurate skill from official docs |
| **Research + draft** | Complex API surface, needs careful reading of docs before writing skill |
| **Spike first** | Unknown constraints (rate limits, auth requirements, data format), must test before committing |
| **Waive** | Low-risk, well-known pattern that doesn't need a dedicated skill doc |

### 5. User Decision

Present gaps to user. They choose per gap:
- **Fill** — author the skill before implementing
- **Waive** — proceed with general knowledge (user accepts the risk)
- **Spike** — do a time-boxed exploration before committing to the approach

Record the decision. Implementation must not start with unresolved ❌ gaps unless explicitly waived.

## Output

The gap table is appended to the design presentation. It becomes part of what the user reviews and approves.

## 6. Role Coverage Check

Beyond technology, check if the design requires expertise domains not covered by any agent in the roster.

Known role domains:
| Domain | Agent | Covers |
|--------|-------|--------|
| UI/UX design | @designer | Interaction patterns, states, accessibility, visual design |
| Backend/.NET | @backend | C#, gRPC, NUnit, XML config |
| Frontend/React | @frontend | TypeScript, Next.js, Biome |
| Infrastructure | (none - use Terraform skills) | IaC, cloud, CI/CD |
| GIS/Mapping | (none) | ArcGIS, Mapbox, spatial data, projections |
| Data engineering | (none) | Pipelines, ETL, warehousing, streaming |
| ML/AI | (none) | Model selection, training, inference |
| Security specialist | (none) | Threat modeling, pen testing, compliance |

For each domain the design requires:
- If an agent exists -> note as covered
- If no agent exists -> flag as ROLE gap in the gap table

### Role Gap Output

Add to the gap table:

```markdown
### Role Gaps

| Domain Needed | Current Coverage | Verdict |
|--------------|-----------------|---------|
| UI/UX design | @designer | Covered |
| GIS/Mapping | No agent, no skill | ROLE GAP |
| Real-time streaming | No agent, partial skill | ROLE GAP |
```

### Recommended Actions for Role Gaps

| Action | When |
|--------|------|
| **Create agent guide** | Domain will recur across multiple projects (e.g., @designer) |
| **Create skill doc** | One-off domain expertise needed for this project only (e.g., ArcGIS skill) |
| **Extend existing agent** | Domain is adjacent to an existing agent's scope (e.g., add streaming to @backend) |
| **Spike + decide** | Unclear whether this needs a full agent or just a skill |

Present role gaps alongside technology gaps. User decides the action per gap.

## Chaining into Skill Creator

When the user chooses **Fill** for a gap with action "Draft skill" or "Research + draft":

1. Load `/skills/skill-creator/SKILL.md`
2. Pass the gap context:
   - Technology name (from gap table)
   - Source in design (which section references it)
   - Action type ("Draft skill" or "Research + draft")
   - Any known constraints from the design
3. Skill Creator takes over from Step 2 or Step 3 (depending on action type)
4. After skill is created, re-run this audit on the same design to confirm the gap is now ✅ Covered

This handoff is automatic when the user says "Fill" — no separate invocation needed.

## Don't Do This

- Don't produce an empty table and call it "all clear" — if you extracted nothing, the extraction failed
- Don't classify everything as "baseline" to avoid flagging gaps
- Don't recommend "draft skill" for technologies you've never seen accurate docs for
- Don't block on ⚠️ Partial items — those are informational, not blocking
- Don't skip this gate because the user seems eager to start coding
