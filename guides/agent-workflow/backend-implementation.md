---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Backend Implementation Workflow

## When to Use
Any C#/.NET implementation work in the QT-Ubi-UbiquityBackend repository.

## Agent Order
1. **@backend**  Implements the C# code changes
2. **@quality-assurance**  Reviews for edge cases, error handling, backward compatibility
3. **@backend**  Addresses QA feedback

## Workflow

### Step 0: Knowledge Lookup
Before writing code, scan `.kiro/knowledge/README.md` index for entries matching these tags:
`QT-Ubi-UbiquityBackend`, `backend`, `mvc`, `csharp`, `grpc`, `build`, `namespace`

Read any matching entries. They contain gotchas and non-obvious behavior that will affect your implementation.

### Step 1: Implementation (@backend)
- Identify the target domain and affected projects
- Check existing patterns in the domain before writing new code
- When introducing any naming pattern or convention not already in the guides, search the codebase first (e.g. file search for common suffixes). Never fall back to trained defaults when the codebase has an established pattern.
- Implement changes following C# conventions
- Add/update NUnit tests
- Run `dotnet build` and `dotnet test` for affected projects

### Step 2: Review (@quality-assurance)
- Re-read any knowledge entries found in Step 0 — review the code specifically for those known gotchas
- Review for error handling gaps
- Check backward compatibility (existing contracts, XML config)
- Verify test coverage for critical paths
- Flag any missing null checks or exception handling

### Step 3: Fix (@backend)
- Address QA findings
- Re-run tests to confirm fixes

## Key Considerations
- Always check XML config files when modifying service wiring
- Run tests for the specific domain: `dotnet test {domain}/nunit/{domain}.nunit.csproj`
- Check for breaking changes in shared projects (u2ool, system.common)
- Verify gRPC contract compatibility when modifying grpc/ projects

## Learned Patterns
<!-- cap: 10 | last-consolidated: never | pr-count-since: 1 -->

### 1. Use async/await, never sync-over-async (PR #2754)
Never use `Task.Run(() => ...).Result` or `.GetAwaiter().GetResult()` in controller actions. Use `async Task<ActionResult>` and `await` directly. Sync-over-async risks deadlocks in ASP.NET.

### 2. Always log caught exceptions (PR #2754)
Never swallow exceptions silently. Use `Log.Exception(ex, "context message")` in every catch block before returning an error response. Pattern: `catch (Exception ex) { Log.Exception(ex, "..."); ... }`

### 3. Pass only what a method needs (PR #2754)
If a private method only uses one property from an object, accept that property directly instead of the whole object. Improves testability and makes dependencies explicit.
