---
status: draft
priority: 7
wave: 4
cooperation_probability: 45%
estimate: 4 weeks / $50-75K NZD
gate: ZAG trials must be generating unstructured data with no proper home
---

# Idea G: NIR Advisory Data Integration

## Executive Summary

MCS accepts Near-Infrared (NIR) spectroscopy readings as supplementary advisory data. Lab testing remains the clearance authority. NIR data is stored alongside lab results for correlation analysis and scheduling intelligence. The Science Team controls if/when NIR becomes clearance-grade.

**This is a 3-5 year journey, not a switch.** Phase 1 is storage and display. Phase 2+ is Science Team's decision.

## Problem Statement

- Zespri is trialing NIR devices through ZAG (Scentian Bio, Felix F-751, microwave sensing)
- Trial data is being stored in spreadsheets, vendor portals, or not at all
- No structured way to correlate NIR readings with lab results over time
- Without correlation data, Science Team can never validate NIR for clearance use
- If MCS can't accept NIR data, it becomes irrelevant as the industry moves to non-destructive testing (5-10 year horizon)

## Business Case

| Metric | Value |
|--------|-------|
| ZAG investment | US$2M/year |
| NIR trials currently running | Multiple (Scentian Bio VOC, Felix F-751, microwave) |
| Data being captured structurally | None (spreadsheets/vendor portals) |
| Industry direction | Non-destructive testing replacing lab testing in 5-10 years |
| Build cost | $50-75K NZD |
| Strategic value | Positions MCS as the multi-modal maturity platform (not just lab results) |

## Prerequisites (Gates Before Build)

### Gate 1: Active Trials Generating Data

Confirm with Zespri:
- Which NIR/sensing devices are currently being trialed?
- What data format do they produce?
- Where is trial data currently stored?
- Is there a gap (data being lost or poorly structured)?

**Kill condition:** No active trials, or trials have their own adequate storage.

### Gate 2: Science Team Accepts "Advisory" Framing

Science Team must agree:
- NIR data can be stored in MCS
- It will be clearly labeled as "trial/advisory" (not clearance evidence)
- No connection to Calc Engine
- Science Team controls the roadmap for future use

**Kill condition:** Science Team vetoes storage in MCS entirely.

### Gate 3: Device Vendor Cooperation

At least one vendor must provide:
- Data format documentation (API spec or export format)
- Willingness to integrate (or at minimum, documented export format we can parse)

**Kill condition:** All vendors refuse to share format documentation.

## Requirements

### Functional

1. **Universal Ingest Schema**
   - Device-agnostic schema that accepts readings from any NIR/sensing device
   - Fields: sample request link, device ID, operator, timestamp, location, readings, quality score
   - Extensible: new reading types can be added without schema migration

2. **Vendor Adapter Framework**
   - Each device vendor gets a separate adapter (Azure Function)
   - Adapter maps proprietary format to MCS universal schema
   - New vendor = new adapter, zero changes to MCS core
   - Pattern: Anti-Corruption Layer

3. **Device Registry**
   - Register devices: serial number, model, calibration date, assigned operator
   - Flag readings from overdue-calibration devices
   - Track device lifecycle (active, retired, calibrating)

4. **Correlation View (Science Team)**
   - Side-by-side: NIR reading vs lab result for same sample request
   - Scatter plot: NIR DM prediction vs actual lab DM
   - Accuracy metrics: R-squared, MAE, bias per device/operator/variety
   - This is the data Science Team needs to eventually validate NIR

5. **Advisory Display (Ops Team)**
   - "Block X: latest NIR reading suggests DM 16.8% (lab threshold: 17.0%)"
   - Clearly labeled: "Advisory - not for clearance decisions"
   - Used for scheduling intelligence (Idea C enhancement)

6. **Raw Spectrum Storage**
   - Store raw spectral data in blob storage (for future reanalysis)
   - Reference from reading record
   - Enables: Science Team can reprocess historical spectra with improved models

### Non-Functional

- Ingest endpoint handles burst of 100 readings/minute (field workers uploading batch)
- Readings stored within 5 seconds of submission
- No connection to Calc Engine (enforced at database level - no FK to clearance tables)
- Clearly separated schema (different tables, different permissions)

## Technical Design

### Architecture

```
+-------------------+  +-------------------+  +-------------------+
| Felix F-751       |  | Scentian Bio      |  | Microwave Device  |
| (NIR handheld)    |  | (VOC biosensor)   |  | (future)          |
+--------+----------+  +--------+----------+  +--------+----------+
         |                       |                       |
         v                       v                       v
+-------------------+  +-------------------+  +-------------------+
| Felix Adapter     |  | Scentian Adapter  |  | Microwave Adapter |
| (Azure Function)  |  | (Azure Function)  |  | (Azure Function)  |
+--------+----------+  +--------+----------+  +--------+----------+
         |                       |                       |
         +----------+------------+----------+------------+
                    |                       |
                    v                       v
+---------------------------------------------------+
|  MCS Ingest API (NEW)                             |
|  POST /api/nir/readings                            |
|  Validates against universal schema                |
|  Stores in [dbo].[NirReading]                     |
+---------------------------------------------------+
         |                               |
         v                               v
+--------------------+    +----------------------------+
| [dbo].[NirReading] |    | Azure Blob Storage         |
| Structured data    |    | Raw spectral data          |
+--------------------+    +----------------------------+
```

### Universal Ingest Schema

```json
{
  "sampleRequestId": "string (optional - links to existing SR)",
  "deviceId": "string (registered device identifier)",
  "deviceModel": "string (e.g. 'Felix F-751', 'Scentian Bio')",
  "operatorId": "string (MCS user who took reading)",
  "timestamp": "ISO 8601",
  "location": { "lat": 0.0, "lng": 0.0 },
  "readings": {
    "dryMatterPercent": 0.0,
    "brixDegrees": 0.0,
    "hueAngle": 0.0,
    "pressureKg": 0.0,
    "firmness": 0.0,
    "vocProfile": {},
    "custom": {}
  },
  "rawSpectrumRef": "string (blob storage reference)",
  "qualityScore": 0.0,
  "notes": "string"
}
```

### Database Objects

```sql
CREATE TABLE NirReading (
  ReadingId INT IDENTITY PRIMARY KEY,
  SampleRequestId INT NULL, -- optional link to SR
  DeviceId INT NOT NULL,
  OperatorId NVARCHAR(100),
  ReadingTimestamp DATETIME2 NOT NULL,
  Latitude DECIMAL(9,6) NULL,
  Longitude DECIMAL(9,6) NULL,
  DryMatterPercent DECIMAL(5,2) NULL,
  BrixDegrees DECIMAL(5,2) NULL,
  HueAngle DECIMAL(5,2) NULL,
  Firmness DECIMAL(5,2) NULL,
  QualityScore DECIMAL(3,2) NULL,
  RawSpectrumRef NVARCHAR(500) NULL,
  CustomReadings NVARCHAR(MAX) NULL, -- JSON for extensibility
  CreatedDate DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE NirDevice (
  DeviceId INT IDENTITY PRIMARY KEY,
  SerialNumber NVARCHAR(100) NOT NULL,
  Model NVARCHAR(100) NOT NULL,
  VendorName NVARCHAR(100),
  CalibrationDate DATE,
  CalibrationDueDate DATE,
  Status NVARCHAR(20) DEFAULT 'Active', -- Active, Retired, Calibrating
  AssignedOperator NVARCHAR(100) NULL,
  CreatedDate DATETIME2 DEFAULT GETUTCDATE()
);
```

## Cost Estimate

| Phase | Scope | Duration | Cost |
|-------|-------|----------|------|
| Schema design | Universal ingest schema, DB tables, blob storage setup | 3 days | $5K |
| Ingest API | POST endpoint with validation | 3 days | $5K |
| First vendor adapter (Felix F-751 or Scentian Bio) | Map proprietary format to schema | 4 days | $6K |
| Device registry | CRUD for device management, calibration tracking | 2 days | $3K |
| Correlation view | Science Team dashboard (NIR vs lab side-by-side) | 4 days | $6K |
| Advisory display | Ops-facing NIR readings with disclaimers | 2 days | $3K |
| Raw spectrum storage | Blob storage integration, reference linking | 1 day | $2K |
| Second vendor adapter | If applicable | 3 days | $5K |
| Testing + documentation | End-to-end validation, API docs | 3 days | $5K |
| **Total** | | **3.5 weeks** | **$40K** |

### Ongoing Costs

| Item | Monthly |
|------|---------|
| Azure Function (consumption) | ~$10 |
| Blob storage (raw spectra) | ~$20 (grows with volume) |
| Total | ~$30/month |

## Validation & Testing

### Acceptance Criteria

- [ ] Ingest endpoint accepts readings conforming to universal schema
- [ ] Readings from different device types stored in same table
- [ ] Device registry tracks calibration status
- [ ] Overdue-calibration devices flagged on readings
- [ ] Correlation view shows NIR vs lab results side-by-side
- [ ] No connection exists between NirReading and Calc Engine tables
- [ ] Raw spectral data retrievable from blob storage
- [ ] Advisory display clearly labeled "not for clearance"

### How to Validate

1. **Schema validation:** Submit readings from 2 different device formats. Confirm both stored correctly.
2. **Correlation test:** For 50 samples with both NIR and lab results, verify correlation view accuracy.
3. **Isolation test:** Confirm NirReading table has no foreign keys to clearance/CalcResult tables.
4. **Science Team review:** Present correlation view. Ask: "Is this the data you need to evaluate NIR?"

### Kill Conditions

- No active ZAG trials generating data
- Science Team vetoes NIR data in MCS entirely
- All device vendors refuse to share format documentation
- Zespri has their own storage solution (ZAG manages its own data platform)
- Finance says "no ROI until NIR is clearance-grade" AND won't fund data preservation

## Stakeholder Sign-off Required

- [ ] Zespri Science Team - approves advisory-only storage in MCS
- [ ] Zespri ZAG/Innovation team - confirms data gap exists
- [ ] Device vendor (at least 1) - provides format documentation
- [ ] Zespri Finance - budget approval
- [ ] Zespri IT - approves new tables and blob storage

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Science Team says "too early" | High | Fatal | Frame as data preservation, not validation. "Store now, evaluate later." |
| Finance says "no ROI" | High | Fatal | Connect to ZAG investment protection. "$2M/year on trials, data being lost." |
| TSPs feel threatened | Medium | Medium | Explicit guarantee: "Labs remain clearance standard for current contract terms." |
| Vendor adapter proliferation | Low | Low | Registry pattern. Each adapter is isolated. |
| NIR accuracy disputed by growers | Low | Low | Advisory only. No clearance impact. Disputes are Science Team's domain. |
| Scope creep toward clearance use | Medium | High | Architectural enforcement: no FK to Calc Engine. Requires explicit migration to change. |
