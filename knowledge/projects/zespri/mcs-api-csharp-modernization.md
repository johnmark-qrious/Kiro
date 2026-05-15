---
sync: draft
lastLocalEdit: 2026-05-13T15:06:00+12:00
---

# Zespri MCS - C# API Legacy Patterns & Modernization

## The Big Picture

The API is stuck on .NET 6 in-process Azure Functions (EOL November 2024), uses deprecated Azure SDKs, has zero test coverage on business logic, and puts all logic directly in API classes with no service layer.

---

## Critical Issues

### 1. Azure Functions In-Process Model (END OF LIFE)

.NET 6 in-process reached end-of-support November 2024. No security patches.

**Current:** `Microsoft.Azure.Functions.Extensions` + `net6.0`
**Target:** `Microsoft.Azure.Functions.Worker` + `net8.0` (isolated worker)

**Migration changes:**
- `FunctionsStartup` -> `Program.cs` with `HostBuilder`
- `[FunctionName]` -> `[Function]`
- `HttpRequest` -> `HttpRequestData`
- `IActionResult` -> `HttpResponseData`
- Constructor DI becomes standard (no more `FunctionInvocationFilterAttribute` for auth)

**Effort with AI:** 2-3 days

### 2. Deprecated Azure SDKs

| Current (deprecated) | Replacement |
|---------------------|-------------|
| `Microsoft.WindowsAzure.Storage` v9 | `Azure.Storage.Blobs` v12 |
| `Microsoft.Azure.KeyVault` v3 | `Azure.Security.KeyVault.Secrets` + `Azure.Identity` |
| `Microsoft.Azure.Services.AppAuthentication` | `Azure.Identity` (DefaultAzureCredential) |

**Effort with AI:** 0.5-1 day

### 3. No Service Layer (God Classes)

All business logic lives in API endpoint methods. `SampleRequestApi.cs` is 133KB. No separation of concerns. Untestable without spinning up the full Azure Functions host.

**Target architecture:**
```
API Layer (thin) -> Service Layer (business logic) -> Data Access (EF Core)
```

**Effort with AI:** 3-5 days (extract services, register DI, keep API classes as thin route handlers)

---

## Convention Violations

### 4. EF Core Anti-Patterns

| Issue | Count | Impact |
|-------|-------|--------|
| Missing `AsNoTracking()` on read queries | ~80 queries | Wasted memory, slower reads |
| Include chains loading full entity graphs | 88 `.Include()` calls | Over-fetching data |
| No `.Select()` projections | 0 uses | Loading 20 columns when 3 are needed |
| AutoMapper post-load instead of `ProjectTo<>()` | All mappings | Requires eager loading everything |

**Modern pattern:** `_dbContext.Areas.AsNoTracking().Select(a => new AreaVm { ... })` or AutoMapper's `ProjectTo<AreaVm>()`

**Effort with AI:** 2-4 days

### 5. Error Handling (Per-Endpoint, Loses Stack Trace)

```csharp
catch (Exception ex) {
    logger.LogError(ex.Message); // loses stack trace!
    return new InternalServerErrorResult();
}
```

19 identical catch blocks. `ex.Message` only (no `ex` object passed to logger).

**Modern pattern:** Global exception middleware in isolated worker model. One place handles all errors.

**Effort with AI:** 0.5 day (part of isolated worker migration)

### 6. Logging (Not Structured)

```csharp
logger.LogError($"Error. SR#:{sr.SampleId}"); // string interpolation = not queryable
```

48 log calls, all using string interpolation instead of structured templates.

**Modern pattern:** `logger.LogError(ex, "State change failed for SR {SampleId}", sr.SampleId);`

**Effort with AI:** 0.5 day (mechanical find-replace)

### 7. Newtonsoft.Json (Legacy)

Used throughout. Modern .NET uses `System.Text.Json` (faster, less allocations, built-in).

**Effort with AI:** 1 day (isolated worker migration forces this anyway)

---

## DRY Violations

| Issue | Occurrences | Fix | Effort |
|-------|-------------|-----|--------|
| Auth + KPIN validation boilerplate | 37 | Extract `ValidateKpinAccessAsync()` to ApiBase | 2-3h |
| Identical try/catch blocks | 19 | Use `HandleApiException` or wrapper | 1-4h |
| Magic strings vs existing Enums | 14 | Use `Enum.ToString()` / Description helper | 2-3h |
| Repeated entity lookups (season, orchard) | 11 | Cache per-request | 1-2h |
| Scattered notification construction | 60 refs | Extract `NotificationBuilder` | 4-6h |
| SampleRequestStateHelper (10 params, 150-line if/else) | 1 file | Extract `StateChangeRequest` record + notification strategy | 6-8h |

---

## What's Actually Good (Don't Touch)

- **CsvApiBase** - well-designed template method pattern. Best-structured code in the project.
- **ZespriAuthorizeAttribute** - functional (despite the null-counting bug). The pattern is correct.
- **Async usage** - properly awaited everywhere. No `.Result` or `.Wait()`.
- **EF parameterization** - no SQL injection risk in LINQ queries.
- **Stored proc delegation** - state machine logic in SQL is a valid pattern for this domain.

---

## Modernization Roadmap (with AI)

| Phase | Items | Effort | Risk | Prerequisite |
|-------|-------|--------|------|--------------|
| **1. Quick wins** | Magic strings, structured logging, AsNoTracking | 1 day | Low | None |
| **2. SDK upgrade** | Azure.Storage.Blobs, Azure.Identity | 0.5-1 day | Low | None |
| **3. Isolated worker** | .NET 8 + isolated model + System.Text.Json | 2-3 days | Medium | Phase 2 |
| **4. Service extraction** | Extract business logic from API classes | 3-5 days | Medium | Phase 3 |
| **5. Query optimization** | ProjectTo, Select projections, remove over-fetching | 2-4 days | Medium | Phase 4 |
| **6. Test coverage** | Unit tests for extracted services | 5+ days | Low | Phase 4 |
| **7. Auth fix** | Fix null-counting permission bug | 1 hour | Low | None (do immediately) |
| **8. Notification refactor** | NotificationBuilder + strategy pattern | 4-6 hours | Medium | Phase 4 |
| **9. SampleRequestApi split** | 5 files + 2 services | 2-3 days | High | Phase 4 + 6 |

**Total: ~17-24 days with AI assistance**

---

## Effort Comparison

| Phase | Human Solo | With AI |
|-------|-----------|---------|
| Quick wins (logging, strings, NoTracking) | 2-3 days | 1 day |
| SDK upgrade | 2-3 days | 0.5-1 day |
| Isolated worker migration | 1-2 weeks | 2-3 days |
| Service extraction | 2-3 weeks | 3-5 days |
| Query optimization | 1-2 weeks | 2-4 days |
| Test coverage | 3-4 weeks | 5+ days |
| SampleRequestApi split | 1-2 weeks | 2-3 days |
| **Total** | **10-14 weeks** | **17-24 days** |

---

## Risk Matrix

```
         Low Risk ────────────────────── High Risk
    ┌─────────────────────────────────────────────┐
    │                                             │
H   │              SampleRequestApi split         │
i   │              (needs tests first)            │
g   │                                             │
h   │    Service extraction    Isolated worker    │
    │                                             │
E   ├─────────────────────────────────────────────┤
f   │                                             │
f   │    Query optimization    Auth bug fix       │
o   │    Notification refactor                    │
r   │                                             │
t   ├─────────────────────────────────────────────┤
    │                                             │
L   │    Structured logging    SDK upgrade        │
o   │    Magic strings                            │
w   │    AsNoTracking                             │
    │                                             │
    └─────────────────────────────────────────────┘
```

**Start bottom-left. The auth bug fix (top-right, low effort) should be done immediately regardless of everything else.**
