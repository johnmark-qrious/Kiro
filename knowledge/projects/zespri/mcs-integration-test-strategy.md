---
sync: draft
lastLocalEdit: 2026-05-13T15:42:00+12:00
---

# Zespri MCS - Integration Test Strategy

## Context

- 1 test file exists (3 tests covering IsProvisionalResolver)
- 133KB SampleRequestApi with zero tests
- State machine logic lives in stored procs
- Can't refactor safely without tests capturing current behavior

## Approach: TestContainers + Real SQL Server

Don't use EF in-memory provider - it doesn't support stored procs, views, or SQL Server-specific features. Use Testcontainers with real SQL Server Docker image.

```
Test Host (xUnit)
  -> Azure Functions (in-process for tests)
    -> EF Core -> SQL Server container (seeded with schema + test data)
```

## Test Pyramid

```
┌─────────────────────────────────┐
│  E2E (Playwright) - LATER       │  5-10 critical paths only
├─────────────────────────────────┤
│  Integration Tests - NOW        │  HTTP -> API -> DB -> response
├─────────────────────────────────┤
│  Unit Tests - AFTER extraction  │  extracted services, no DB
└─────────────────────────────────┘
```

Integration tests first because:
1. No service layer exists yet (can't unit test what's coupled to DbContext)
2. Stored procs ARE the business logic (must test against real SQL)
3. Tests capture current behavior BEFORE refactoring
4. After service extraction, unit tests become possible

## Infrastructure

```csharp
public class McsApiFixture : IAsyncLifetime
{
    private MsSqlContainer _sqlContainer;
    private HttpClient _client;

    public async Task InitializeAsync()
    {
        _sqlContainer = new MsSqlBuilder()
            .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
            .Build();
        await _sqlContainer.StartAsync();
        await ApplySchema(_sqlContainer.GetConnectionString());
        await SeedReferenceData(_sqlContainer.GetConnectionString());
        _client = CreateTestHost(_sqlContainer.GetConnectionString());
    }
}
```

## Priority Order

| # | Endpoint | Why | Test Cases |
|---|----------|-----|------------|
| 1 | `PUT samplerequests/state` | Core state machine | Valid/invalid transitions, bulk, notifications |
| 2 | `POST samplerequests` | Creation + validation | Single, bulk, duplicates, blocks, helpers |
| 3 | `POST samplerequests/results` | Search + computation | Filters, clearance pass values, status overrides |
| 4 | `PUT samplerequests/associations/{id}` | Association transitions | Add/remove TSP/SSP, state changes |
| 5 | `POST orchards/{kpin}/areas` | Area + dispensation | Valid, duplicate, dispensation rules |
| 6 | `POST orchards/{kpin}/hazards` | Hazard + SR cancel | Stop sampling, blocks, notification |
| 7 | `POST samplerequests/upload` | CSV bulk | Valid, errors, partial success |
| 8 | `POST sas/generate` | SAS tokens | Admin vs grower, SSP write denial |

## Test Data Strategy

**Seed once per test class** (not per test - too slow):

Reference data (shared):
- Seasons (current + previous)
- Varieties (GA, HE, HW, RS)
- GrowMethods, MaturityTypes, SampleTypes
- SamplingMethods, SeverityLevels, HazardTypes
- Packhouses, SupplyAreas, Regions, Countries
- Roles, Permissions catalog
- SampleRequestStates + transitions

Per-test (transactional):
- Orchards with blocks
- Areas with block associations
- Sample requests in various states
- Users with different permission sets

## Auth in Tests

```csharp
var zespriAdmin = TestToken.ZespriAdmin();
var sspUser = TestToken.SSP(packhouseIds: [1, 2], kpins: [1234, 5678]);
var tspUser = TestToken.TSP(kpins: [1234]);
var grower = TestToken.Grower(kpins: [1234]);

[Fact]
public async Task SSP_CannotTransitionTo_LoggedIntoLab()
{
    var response = await _client.PutAsync("/samplerequests/state",
        new { Ids = [srId], To = "LoggedIntoLab" }, sspUser);
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
}
```

## Stored Proc Testing

```csharp
[Theory]
[InlineData(SRStatus.Allocated, SRStatus.Assigned, true)]
[InlineData(SRStatus.Allocated, SRStatus.Cleared, false)]
[InlineData(SRStatus.Collected, SRStatus.CompromisedSSP, true)]
[InlineData(SRStatus.Cleared, SRStatus.Allocated, false)]
public async Task StateTransition_ValidatesAllowedTransitions(
    int from, int to, bool shouldSucceed)
```

## Folder Structure

```
Tests/
├── Zespri.MCS.Tests.Integration/
│   ├── Fixtures/
│   │   ├── McsApiFixture.cs
│   │   ├── TestTokenFactory.cs
│   │   └── SeedData.cs
│   ├── SampleRequest/
│   │   ├── CreateSampleRequestTests.cs
│   │   ├── StateChangeTests.cs
│   │   ├── SearchResultsTests.cs
│   │   ├── AssociationTests.cs
│   │   └── CsvUploadTests.cs
│   ├── Orchard/
│   │   ├── AreaTests.cs
│   │   ├── HazardTests.cs
│   │   └── PartBlockTests.cs
│   ├── Admin/
│   │   ├── ClearanceCriteriaTests.cs
│   │   ├── TestGroupTests.cs
│   │   └── SeasonRolloverTests.cs
│   └── External/
│       ├── PackhouseApiTests.cs
│       └── SasTokenTests.cs
└── Zespri.MCS.Tests.Unit/
    ├── Services/
    │   ├── SampleRequestResultsServiceTests.cs
    │   ├── SampleRequestValidationServiceTests.cs
    │   └── NotificationServiceTests.cs
    └── Helpers/
        └── SampleRequestStateHelperTests.cs
```

## Schema Management

Use **SQL scripts** (most reliable for scaffolded DB with stored procs and views that EF migrations don't capture). Export current schema, apply to container on startup.

## CI Pipeline

```yaml
- task: Docker@2
  inputs:
    command: 'run'
    arguments: '-d -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest'

- script: dotnet test Tests/Zespri.MCS.Tests.Integration --logger trx
  displayName: 'Integration Tests'
```

Or use Testcontainers (manages Docker lifecycle automatically).

## Effort Estimate

| Work | With AI |
|------|---------|
| Test infrastructure (fixture, seed, token factory) | 1 day |
| Schema export + container setup | 0.5 day |
| State machine tests (Priority 1) | 1 day |
| CRUD + search tests (Priority 2-4) | 2 days |
| Remaining endpoints (Priority 5-8) | 2 days |
| CI pipeline integration | 0.5 day |
| **Total** | **~7 days** |

## Key Principle

Test behavior, not implementation. These tests should pass before AND after:
- Service extraction
- SampleRequestApi split
- Isolated worker migration
- .NET 8 upgrade

They're the safety net for all refactoring ahead.
