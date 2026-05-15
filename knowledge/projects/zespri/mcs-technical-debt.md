---
sync: draft
lastLocalEdit: 2026-05-13T21:16:00+12:00
---

# Zespri MCS - Technical Debt Registry

## Self-Admitted Hacks (Comments in Code)

| Location | Comment | Impact |
|----------|---------|--------|
| SampleRequestApi.cs ~line 1558 | "I am sorry this is hacky" | Status override logic in payment-critical path |
| SampleRequestApi.cs ~line 1816 | "TODO: need to understand the business logic to rewrite this better" | Dev didn't understand rules they implemented |
| SampleRequestApi.cs ~line 636 | "Andrey looking into what the original intent of this was" | Dead notification code, nobody knows purpose |
| ApiBase.cs (logging) | "****todo: figure out why this is not giving the expected result" | Logger passed as param everywhere instead of DI |
| ApiBase.cs (timezone) | "apparently there will be one reference timezone for each country 🙂" | Hardcoded NZ timezone |
| FilterApi.cs | "This endpoint is no-longer called by the front-end" | Dead code still deployed and accepting requests |
| SiteRequirementApi.cs | Same dead code comment | Still deployed |
| OrchardApi.cs (2 endpoints) | Returns BadRequest() silently | Deprecated but not removed |

## Security Debt

| Issue | Location | Severity |
|-------|----------|----------|
| Secrets committed to repo (.env, local.settings.json) | Root | Critical |
| Suspicious token in package.json "test" field | package.json | Critical |
| Auth permission check counts nulls (privilege escalation) | ZespriAuthorizeAttribute ~line 87 | Critical |
| God-mode admin flag bypasses all checks | ZespriAuthorizeAttribute ~line 73 | Critical |
| Token in localStorage without expiry check on reload | Login component | High |
| `rejectUnauthorized: false` on ADFS key fetch | authz/requestToken.ts | High |
| Silent `catch(e) {}` on token verification | request.ts | High |
| Timing-attack vulnerable string comparison for API key | send/notification | Medium |
| Mock routes deployed with no auth | 6 API routes | Medium |
| Wildcard CORS in local.settings.json | local.settings.json | Low |

## Architectural Debt

| Issue | Location | Impact |
|-------|----------|--------|
| 133KB SampleRequestApi.cs (god class) | Apis/SampleRequestApi.cs | Untestable, unmaintainable |
| Dual ORM (Prisma + EF Core) on same DB | Architecture | No shared transactions, potential stale reads |
| `public static ExceptionDbLogger` | ApiBase.cs | Race condition under concurrency |
| `dynamic` usage in GetFieldId | ApiBase.cs | Loses type safety |
| No service layer (business logic in API classes) | All API files | Can't unit test |
| .NET 6 in-process Azure Functions (EOL Nov 2024) | csproj | No security patches |
| Deprecated Azure Storage SDK (WindowsAzure.Storage) | csproj | No patches since 2019 |
| adal-angular deprecated (support ended June 2023) | package.json | No security patches |
| jose v2 (EOL) | package.json | Known issues, author recommends v5 |
| Recoil abandoned by Meta | package.json | No maintenance |
| No error boundaries | _app.tsx | One error crashes entire page |
| No integration tests on business logic | Tests/ | Can't refactor safely |
| Only 5 unit tests exist | Tests/ | Near-zero coverage |

## Data/DB Debt

| Issue | Evidence |
|-------|----------|
| Table named "T" with real domain data | T.cs (Variety, Growmethod, Tasteband columns) |
| Table named "Temp" (single column "B") | Temp.cs |
| TestTbl1 in production schema | TestTbl1.cs |
| BlockBak0511 (backup never cleaned) | BlockBak0511.cs |
| ClearanceCriteriaSwap0312 (swap table) | ClearanceCriteriaSwap0312.cs |
| SampleResultLoadTest10 (load test artifact) | SampleResultLoadTest10.cs |
| 82 staging/temp entities scaffolded | Stg*, Tmp*, *Temp* files |
| Password reuse across environments (3kiR4okx) | .env, local.settings.json |
| 1MB MCSContext.cs scaffolded indiscriminately | MCSContext.cs |

## Code Smell Debt

| Issue | Location | Count |
|-------|----------|-------|
| Magic string "Pending Dispensation" instead of enum | AreaApi | 8 |
| "Active"/"Inactive" as raw strings | Multiple APIs | 14 total |
| "Stop Sampling" hardcoded | OrchardHazardApi | Instead of severity lookup |
| Manual auth header injection | src/components/ | 193 occurrences, 92 files |
| useEffect + useState for data fetching | src/components/ | 82 files |
| Manual setLoading(true/false) | src/components/ | 61 files |
| try/catch + toaster.danger per component | src/components/ | 72 files |
| ZTable row rendering copy-pasted | src/components/ | 47 files |
| Modal boilerplate duplicated | src/components/ | 25+ modals |
| coverage/ directory committed | Git | Build output in source |

## "Nobody Knows Why" Debt

| Thing | Evidence |
|-------|----------|
| `/api/update-criteria` endpoint | No UI callers. Comment: "DOESN'T LOOK LIKE ANYTHING IS USING THIS" |
| Duplicate `plotGraph("Hue")` call | graphs.ts - called twice, result overwritten |
| `ViewModelBase<T>` | Empty class, never used by any ViewModel |
| `SampleRequestStateHelper` manually instantiated | Only service not using DI: `new SampleRequestStateHelper(dbContext)` |
| `ExceptionDbLogger` swallows shallow-stack exceptions | FrameCount <= 1 = exception disappears silently |
| `ExceptionDbLogger` overwrites MethodName with SprocName | Loses method context when both provided |

## Performance Debt

| Issue | Location | Impact |
|-------|----------|--------|
| 16 sequential DB calls in reports/graphs | pages/api/reports/graphs.ts | 800-1600ms wasted |
| 8 sequential DB calls in reports/tables | pages/api/reports/tables.ts | 400-800ms wasted |
| `await` inside `Promise.all()` (bug) | pages/api/reports/industry-trend | Defeats parallelism |
| No caching on immutable report data | All report routes | Repeat queries on every view |
| Missing AsNoTracking on read queries | C# API (~80 queries) | Wasted memory/tracking |
| Include chains loading full entity graphs | C# API (88 .Include() calls) | Over-fetching |
| No .Select() projections | C# API | Loading 20 columns when 3 needed |
| O(n^2) pivot logic in industry-trend | industry-trend/index.ts | Slow for large datasets |
| No pagination on some list views | KiwistartClearanceList, RolesList, etc. | Will break at scale |

## Debt Priority Matrix

| Priority | Category | Action |
|----------|----------|--------|
| P0 (NOW) | Security: secrets in repo, auth bypass bug | Rotate credentials, fix null check |
| P1 (This sprint) | Performance: Promise.all in reports | 30 min fix, 70% faster |
| P1 (This sprint) | Security: auto-inject auth headers | Removes 193 manual token passes |
| P2 (Next sprint) | Architecture: integration tests | Safety net for everything else |
| P2 (Next sprint) | Architecture: .NET 8 migration | Get off EOL |
| P3 (Following) | Architecture: service extraction | Enable unit testing |
| P3 (Following) | Code smell: ZTable, hooks, modals | DX improvement |
| P4 (When capacity) | Data: clean up test/temp tables | Reduce scaffold noise |
| P4 (When capacity) | Modernization: Recoil, ADAL, Yup | Tech currency |
