# Split SampleRequestApi.cs into Domain Services

**Type:** Epic / Tech Debt
**Priority:** High
**Project:** MCS FY2027 Modernization

---

## Summary

Break apart `SampleRequestApi.cs` (133KB, 2,420 lines, 10 endpoints) into focused API classes backed by a proper service layer. This is the single largest file in the codebase and the highest coupling risk. Every sample request feature change touches this one file, making parallel work impossible and regressions likely.

---

## Why This Needs to Happen

1. **Untestable.** All business logic lives in API endpoint methods. You can't unit test state transitions, validation rules, or notification logic without spinning up the full Azure Functions host.
2. **Merge conflicts.** Any two devs working on sample requests will conflict. During harvest season (the busiest time for bug fixes), this is a bottleneck.
3. **Cognitive load.** 2,420 lines in one file. New devs can't reason about it. Even experienced devs miss side effects buried 1,500 lines deep.
4. **Prerequisite for .NET 8 migration.** The isolated worker migration (also planned) is far riskier if done against a god class. Split first, migrate after.
5. **Prerequisite for test coverage.** Integration tests (also planned) need a service layer to mock against. Can't write meaningful tests against the current structure.
6. **Mixed concerns.** CRUD, search, state machine, associations, CSV upload, and notifications are all in one class. Each has different auth requirements, different change frequency, and different risk profiles.

---

## Current State

| Metric | Value |
|--------|-------|
| File size | 133KB |
| Lines of code | 2,420 |
| Endpoints | 10 |
| Auth patterns | 2 (`samplerequest/*` and `associations/*`) |
| Shared private methods | ~15 (validation, query building, notification) |
| External callers | UI (direct from browser) + eAPI2 (SSPs/TSPs via state change) |

---

## Sub-Tasks

### Sub-Task 1: Extract Service Layer Interfaces

**What:** Define `ISampleRequestService`, `ISampleRequestSearchService`, `ISampleRequestAssociationService`, `ISampleRequestStateService` interfaces. Register in DI.

**Why first:** Establishes the contracts before moving code. Other sub-tasks depend on this.

**AC:**
- [ ] 4 service interfaces defined with method signatures matching current endpoint logic
- [ ] Interfaces registered in `Startup.cs` DI container
- [ ] No behaviour change (interfaces exist but aren't called yet)
- [ ] Builds successfully

**Estimate:** 0.5 day

---

### Sub-Task 2: Extract SampleRequestCrudService

**What:** Move Get, Create, Update logic into `SampleRequestCrudService`. API methods become thin wrappers that call the service.

**Endpoints affected:**
- `GetSampleRequests` (GET)
- `CreateSampleRequest` (POST)
- `UpdateSampleRequest` (PUT)

**AC:**
- [ ] `SampleRequestCrudService` implements `ISampleRequestService`
- [ ] API methods are max 10-15 lines (deserialize, call service, return result)
- [ ] Validation logic (date checks, S/B number generation) lives in service
- [ ] Post-creation stored procedure call lives in service
- [ ] All 3 endpoints return identical responses to before (byte-for-byte JSON match not required, but same shape and data)
- [ ] Existing integration tests (if any) still pass

**Estimate:** 1 day

---

### Sub-Task 3: Extract SampleRequestSearchService

**What:** Move the shared `SearchSampleRequests` method (~500 lines) and its 3 calling endpoints into `SampleRequestSearchService` + `SampleRequestSearchApi.cs`.

**Endpoints affected:**
- `SearchSampleRequestResults` (POST)
- `SearchSampleRequestReleases` (POST)
- `SearchSampleRequestRecentSamples` (POST)

**AC:**
- [ ] `SampleRequestSearchService` owns the shared search/filter/sort logic
- [ ] `SampleRequestSearchApi.cs` is a new file with 3 endpoints
- [ ] Search results are identical for all filter combinations (verified against current output)
- [ ] Pagination behaviour unchanged
- [ ] Performance unchanged (no N+1 introduced by extraction)

**Estimate:** 1 day

---

### Sub-Task 4: Extract SampleRequestStateService

**What:** Move state change logic into `SampleRequestStateService` + `SampleRequestStateApi.cs`. This is the most critical endpoint (drives the entire sample lifecycle and triggers notifications to SSPs/TSPs).

**Endpoints affected:**
- `SampleRequestsStateChange` (PUT)

**AC:**
- [ ] `SampleRequestStateService` owns state transition validation, bulk processing, and notification dispatch
- [ ] `SampleRequestStateApi.cs` is a new file with 1 endpoint
- [ ] All valid state transitions still work (see state machine diagram in architecture docs)
- [ ] Invalid transitions still rejected with same error responses
- [ ] SSP/TSP allocation emails still sent on relevant transitions
- [ ] Bulk operations still return success/error/unauthorized lists in same format
- [ ] eAPI2 (external callers) behaviour unchanged

**Estimate:** 1 day

---

### Sub-Task 5: Extract SampleRequestAssociationsService

**What:** Move association logic into `SampleRequestAssociationsService` + `SampleRequestAssociationsApi.cs`. These use a different permission (`associations/*`) so they're already a separate concern.

**Endpoints affected:**
- `GetSampleRequestsAssociations` (POST)
- `UpdateSampleRequestsAssociations` (PUT)

**AC:**
- [ ] `SampleRequestAssociationsService` owns association query and update logic
- [ ] `SampleRequestAssociationsApi.cs` is a new file with 2 endpoints
- [ ] Auth still checks `associations/read` and `associations/write` (not `samplerequest/*`)
- [ ] Display status overrides still applied correctly
- [ ] TSP/SSP allocation triggers Associated/Unassociated state transitions correctly

**Estimate:** 0.5 day

---

### Sub-Task 6: Extract CSV Upload to Existing CsvApiBase Pattern

**What:** Move `UploadSampleRequestsCsv` into `SampleRequestCsvApi.cs`, using the existing `CsvApiBase` pattern already used by hazards and block associations.

**Endpoints affected:**
- `UploadSampleRequestsCsv` (POST)

**AC:**
- [ ] `SampleRequestCsvApi.cs` extends `CsvApiBase`
- [ ] Per-row validation logic preserved exactly
- [ ] Error reporting format unchanged (row-level errors returned to UI)
- [ ] File size limits enforced (10MB)
- [ ] Successful upload creates same sample requests as before

**Estimate:** 0.5 day

---

### Sub-Task 7: Delete Original SampleRequestApi.cs + Cleanup

**What:** Once all endpoints are migrated and verified, delete the original file. Update any shared helpers that were duplicated during extraction.

**AC:**
- [ ] `SampleRequestApi.cs` deleted from solution
- [ ] No dead code remaining (unused private methods, orphaned helpers)
- [ ] Solution builds with zero warnings
- [ ] All routes still resolve (no 404s introduced)
- [ ] Shared helpers (KPIN validation, season lookup, etc.) extracted to a `SampleRequestHelpers` or base class

**Estimate:** 0.5 day

---

## Total Estimate

**5-6 days** (with AI assistance). Human solo: 1.5-2 weeks.

---

## Dependencies

- None blocking start. But ideally done BEFORE:
  - Isolated worker migration (.NET 6 -> .NET 8)
  - Integration test suite creation
  - Any new sample request features

---

## Regression Testing

### Automated (must pass before merge)

- [ ] Full build succeeds (`dotnet build`)
- [ ] Existing unit tests pass (if any exist for this domain)
- [ ] Route verification script: hit every endpoint, confirm 200/401 responses match baseline

### Manual Regression Checklist

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Create single sample request | Login as Zespri admin > Sample Requests > Create > Fill form > Submit | SR created with correct S/B number, appears in list |
| 2 | Create bulk sample requests | Same as above but select multiple areas | All SRs created, post-creation SP runs |
| 3 | Search results tab | Sample Requests > Results tab > Apply filters (variety, region, date range) | Filtered results match, pagination works |
| 4 | Search releases tab | Sample Requests > Releases tab > Filter by compromised | Only compromised/hold SRs shown |
| 5 | State change (single) | Select 1 SR > Change state to Allocated > Confirm | State updates, SSP email sent |
| 6 | State change (bulk) | Select 5 SRs > Bulk state change > Confirm | All 5 update, mixed success/error reported correctly |
| 7 | State change (unauthorized) | Login as SSP user > Try to change state they can't | Unauthorized list returned, no state change |
| 8 | Associations view | Associations tab > Filter by packhouse | Correct SRs shown with display status overrides |
| 9 | Update associations | Select SR > Assign TSP > Save | TSP assigned, state transitions to Associated |
| 10 | CSV upload (valid) | Upload valid CSV with 10 rows | 10 SRs created, success message |
| 11 | CSV upload (invalid rows) | Upload CSV with 3 invalid rows mixed in | Valid rows created, invalid rows reported with line numbers |
| 12 | CSV upload (oversized) | Upload 15MB file | Rejected with size error before processing |
| 13 | eAPI2 state change | Call PUT /mcs/SampleRequest?State=Collected&BlindedSampleNumber=S-xxx externally | State updates same as UI |
| 14 | Permission boundary | Login as packhouse user > Attempt to view SRs outside their KPINs | No data returned / 403 |
| 15 | Edit sample request | Open existing SR > Edit mutable fields > Save | Updates saved, immutable fields unchanged |

### Performance Baseline

Before starting, capture response times for:
- `POST samplerequests/results` with 1000+ results
- `PUT samplerequests/state` with 20 SRs
- `POST samplerequests/associations` with full filter set

After split, these must not regress by more than 10%.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Shared private methods have hidden side effects | Map all method dependencies before moving. Extract shared helpers first. |
| eAPI2 (external SSP/TSP callers) breaks | Route paths must not change. Test with actual eAPI2 call format. |
| Notification emails stop firing | Verify email dispatch in state service. Test in TST environment with real SendGrid. |
| DI registration order matters | Register services before API classes. Test startup in isolation. |

---

## Approach

1. Map all private methods and their callers (dependency graph within the file)
2. Extract shared helpers to a base class or utility first
3. Work inside-out: service layer first, then split API files
4. Each sub-task is a separate PR (reviewable in isolation)
5. Feature-flag: keep old file alongside new files until verified, then delete
6. Test in DEV and TST before PPE/PRD
