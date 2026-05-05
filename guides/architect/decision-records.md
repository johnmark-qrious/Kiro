---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Architecture Decision Records (ADRs)

Lightweight records for documenting trade-offs. Use when a decision affects multiple files, teams, or is hard to reverse.

## When to Write an ADR

- Choosing between two viable approaches (gRPC vs REST for a new service)
- Introducing a new dependency or pattern
- Changing data flow or component boundaries
- Decisions that will confuse future developers without context

## When NOT to Write an ADR

- Obvious choices with no real alternatives
- Implementation details that are easy to change
- Style preferences already covered by linting/guides

## Template

```markdown
# ADR-{number}: {Title}

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-{n}
**Date**: YYYY-MM-DD
**Author**: {name}

## Context

What is the problem or situation that requires a decision?
Keep it to 2-3 sentences. Include constraints.

## Options Considered

### Option A: {Name}
- Pros: ...
- Cons: ...

### Option B: {Name}
- Pros: ...
- Cons: ...

## Decision

We chose **Option {X}** because {one sentence reason}.

## Consequences

- What changes as a result
- What trade-offs we accept
- What we need to watch out for
```

## Examples

### ADR-001: gRPC Transport per Backend URL

**Status**: Accepted
**Date**: 2025-01-15

**Context**: We need to call multiple gRPC services. Each backend may have a different base URL. We need to decide whether to create one transport per service or share transports by URL.

**Decision**: One shared transport per unique base URL, with all clients for that URL sharing the transport. Session interceptor is attached at the transport level.

**Consequences**:
- Connection pooling is handled per-URL automatically
- Adding a new service to an existing backend = just add a `createClient` call
- Adding a new backend URL = new transport + new env var

### ADR-002: Server Components for gRPC Data Fetching

**Status**: Accepted
**Date**: 2025-02-01

**Context**: We need to fetch data from gRPC services. Options are Server Components (direct async), Server Actions (form-triggered), or client-side via route handlers.

**Decision**: Server Components for reads, Server Actions for writes. No client-side gRPC calls.

**Consequences**:
- gRPC clients and session tokens never reach the browser
- No loading spinners for initial data — streamed via Suspense
- Client Components receive plain serializable props, not protobuf objects
- Trade-off: can't do client-side polling without a route handler fallback

## Storage

Keep ADRs in the project wiki, PR descriptions, or a dedicated `docs/adr/` folder. The format matters more than the location — just make them findable.

## Review Checklist

When reviewing an architecture decision:
- Is the context clear enough for someone joining in 6 months?
- Are there at least 2 options considered?
- Is the reasoning for the decision explicit (not just "it felt right")?
- Are the consequences honest about trade-offs?
- Is the decision reversible? If not, does it warrant more scrutiny?
