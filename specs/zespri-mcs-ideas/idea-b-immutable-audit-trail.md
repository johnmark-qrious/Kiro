---
status: draft
priority: 2
wave: 1
cooperation_probability: 85%
estimate: 2-3 weeks / $25-35K NZD
---

# Idea B: Immutable Audit Trail & Export Compliance

## Executive Summary

Add cryptographic hashing to every state transition in MCS, creating a tamper-proof evidence chain from orchard to export. Generate machine-verifiable compliance certificates for market access (India, EU, China, Japan).

## Problem Statement

- Zespri exports to 50+ countries, each with different compliance requirements
- India FTA (33% tariff removal) opens a massive new market with new regulators
- EU regulations increasingly demand digital traceability
- 40,000 quality claims/year ($70M NZD) - disputes need evidence
- Current audit trail is database records that could theoretically be modified
- Audit preparation is manual and time-consuming

## Business Case

| Metric | Value |
|--------|-------|
| Markets at risk without traceability | India (new), EU (tightening), China (existing) |
| Revenue protected | $5.9B NZD (total export revenue depends on market access) |
| Quality claims per year | 40,000 ($70M NZD) |
| Current audit prep time | Days per audit |
| Target audit prep time | Minutes (one-click report) |
| Build cost | $25-35K NZD |

## Requirements

### Functional

1. **State Transition Hashing**
   - Every sample request state change gets a SHA-256 hash
   - Hash includes: previous hash + timestamp + actor + state + payload
   - Creates an unbreakable chain (any modification invalidates all subsequent hashes)
   - Stored in append-only table (no UPDATE/DELETE permissions)

2. **Compliance Certificate Generation**
   - One-click export of full chain-of-custody for any sample request
   - Machine-readable format (JSON + human-readable PDF)
   - Includes: all state transitions, actors, timestamps, test results, clearance decision
   - QR code linking to verification endpoint

3. **Verification Endpoint**
   - Public API: given a certificate ID, verify the hash chain is intact
   - Returns: VALID (chain unbroken) or INVALID (tampering detected)
   - Usable by MPI, import regulators, Zespri customers

4. **Audit Dashboard**
   - View all state transitions for any sample request with hash verification
   - Bulk verification: "verify all transitions for season X"
   - Export audit report (PDF/CSV) for regulatory submission

5. **Batch Export Compliance Report**
   - For a given shipment/batch: aggregate all sample requests, verify all chains
   - Generate export-ready compliance package
   - Format aligned with target market requirements (India MPI, EU, China GACC)

### Non-Functional

- Zero performance impact on existing state transitions (hash computed async)
- Append-only storage (database permissions enforce immutability)
- Hash computation < 10ms per transition
- Verification endpoint response < 500ms
- Audit report generation < 30 seconds for full season

## Technical Design

### Architecture

```
+---------------------------------------------------+
|  MCS State Machine (existing)                     |
|  Sample Request state transitions                  |
+----------------------------+----------------------+
                             |
                    Event published (after commit)
                             |
                             v
+---------------------------------------------------+
|  Audit Hash Service (NEW)                         |
|  Azure Function (event-triggered)                  |
|                                                   |
|  1. Receive state transition event                 |
|  2. Fetch previous hash for this sample request    |
|  3. Compute: SHA-256(prev_hash + timestamp +       |
|     actor + from_state + to_state + payload)       |
|  4. Append to [dbo].[AuditHashChain]              |
+---------------------------------------------------+
                             |
                             v
+---------------------------------------------------+
|  [dbo].[AuditHashChain] (append-only)             |
|                                                   |
|  SampleRequestId INT                               |
|  SequenceNumber INT                                |
|  PreviousHash CHAR(64)                             |
|  CurrentHash CHAR(64)                              |
|  Timestamp DATETIME2                               |
|  ActorId NVARCHAR(100)                             |
|  FromState INT                                     |
|  ToState INT                                       |
|  PayloadHash CHAR(64) -- hash of test results etc  |
|  CreatedDate DATETIME2                             |
|                                                   |
|  PERMISSIONS: INSERT only. No UPDATE, No DELETE.   |
+---------------------------------------------------+
```

### Verification Logic

```
For each transition in chain:
  expected_hash = SHA-256(
    previous_hash +
    timestamp +
    actor_id +
    from_state +
    to_state +
    payload_hash
  )
  IF expected_hash != stored_hash THEN INVALID
  
IF all hashes match THEN VALID
```

### Compliance Certificate Format

```json
{
  "certificateId": "MCS-2026-SR-12345-CERT",
  "generatedAt": "2026-05-30T10:00:00Z",
  "sampleRequest": {
    "blindedSampleNumber": "BSN-12345",
    "kpin": "1234",
    "block": "A1",
    "variety": "GA (Gold3)",
    "season": "2026"
  },
  "chainOfCustody": [
    {
      "sequence": 1,
      "from": "Requested",
      "to": "Allocated",
      "actor": "system",
      "timestamp": "2026-04-01T08:00:00Z",
      "hash": "a1b2c3..."
    }
  ],
  "testResults": {
    "dryMatter": 17.5,
    "brix": 14.2,
    "testedBy": "TSP-Lab-001",
    "testedAt": "2026-04-05T14:30:00Z"
  },
  "clearanceDecision": {
    "outcome": "Cleared",
    "criteria": "Mainpack GA DM >= 16.5%",
    "decidedAt": "2026-04-05T15:00:00Z"
  },
  "verification": {
    "chainValid": true,
    "verifyUrl": "https://mcs.zespri.com/verify/MCS-2026-SR-12345-CERT",
    "qrCode": "base64..."
  }
}
```

## Cost Estimate

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Schema + permissions | AuditHashChain table, INSERT-only permissions | 1 day | $2K |
| Hash service | Azure Function triggered on state change | 3 days | $5K |
| Backfill | Hash existing historical transitions (last 2 seasons) | 1 day | $2K |
| Verification endpoint | Public API for hash chain validation | 2 days | $3K |
| Certificate generation | PDF + JSON export with QR code | 3 days | $5K |
| Audit dashboard | UI for viewing/verifying chains | 3 days | $5K |
| Batch compliance report | Shipment-level aggregation | 2 days | $3K |
| Testing + documentation | Verify integrity, edge cases, regulatory format review | 3 days | $5K |
| **Total** | | **2.5 weeks** | **$30K** |

### Ongoing Costs

| Item | Monthly |
|------|---------|
| Azure Function (consumption) | ~$5 (event-driven, minimal) |
| Storage (append-only table) | ~$2 |
| Total | ~$7/month |

## Validation & Testing

### Acceptance Criteria

- [ ] Every state transition produces a hash within 1 second
- [ ] Hash chain is verifiable end-to-end for any sample request
- [ ] Modifying any historical record causes verification to return INVALID
- [ ] Compliance certificate generates in < 5 seconds
- [ ] Verification endpoint responds in < 500ms
- [ ] Append-only table rejects UPDATE and DELETE operations
- [ ] Backfill covers last 2 seasons without gaps
- [ ] Certificate PDF renders correctly with all required fields

### How to Validate

1. **Integrity test:** Manually modify a historical record in test DB. Run verification. Confirm it detects tampering.
2. **Performance test:** Generate 10,000 hashes in sequence. Verify < 10ms per hash.
3. **Compliance review:** Show certificate format to Zespri compliance team. Confirm it meets India/EU requirements.
4. **Audit simulation:** Run full-season verification. Confirm < 30 seconds.

### Kill Conditions

- No India/EU compliance gap exists (current process already sufficient)
- Zespri says "we'll deal with it when we need to" and India exports are >12 months away
- Never prioritized as standalone (must bundle with another feature)

## Stakeholder Sign-off Required

- [ ] Zespri Compliance team - confirms regulatory need
- [ ] Zespri IT - approves append-only table permissions
- [ ] Zespri Finance - budget approval (or bundled with Wave 1)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Death by indifference (never prioritized) | High | Medium | Bundle with Grower Portal (Wave 1). Marginal cost: +3 days. |
| Regulatory requirements unclear | Medium | Low | Build generic. Adapt certificate format per market later. |
| Performance impact on state transitions | Low | Medium | Async hash computation. State transition completes first, hash follows. |
| Historical data gaps (missing transitions) | Low | Medium | Backfill marks gaps explicitly. Partial chains still valuable. |
