---
lastVerified:
lastUsedInTask:
---

# Proto-Change Cascade Detector

Traces the impact of a proto file change through all downstream consumers. Used during `deps` script execution and automatically during @architect phase when a design touches protos.

## When to Run

- User says `deps` with a proto file or package path
- @architect phase identifies proto changes in the design
- Proto-to-UI Mapping Check (adaptive-workflow) needs impact analysis
- After Stuart (or anyone) adds/changes fields in ubiquity-protos

## Inputs

One of:
- A proto file path: `protos/ubiquity/billing/v1/billing_report_service.proto`
- A package path: `ubiquity.billing.v1`
- A description: "added activated_at to BillingLineItem"

## Detection Procedure

### Step 1: Identify What Changed

Read the proto file (from `ubiquity-protos` repo at `C:\Projects\GitHub\ubiquity-protos`).
Extract:
- Package: `ubiquity.{domain}.v1`
- Service name(s): e.g., `BillingReportService`
- Message name(s): e.g., `BillingLineItem`
- Changed fields (if known): e.g., `activated_at (field 10)`
- Changed RPCs (if known): e.g., new `GetBillingReport` RPC

### Step 2: Scan TypeScript Consumers (Ubiquity-WebApps)

Location: `C:\Projects\GitHub\Ubiquity-WebApps`

```
grep -r "@qriousnz/ubiquity-protos/{domain}/v1" --include="*.ts" --include="*.tsx"
```

For each hit:
- File path
- Which symbols are imported (message types, service clients, enums)
- Whether the file uses the specific changed message/field

Map to: `packages/` (shared) or `monorepo/apps/{app}/` (app-specific)

### Step 3: Scan Backend Consumers (QT-Ubi-UbiquityBackend)

Location: `C:\Projects\GitHub\QT-Ubi-UbiquityBackend`

```
grep -r "{ServiceName}" --include="*.cs" grpc/
grep -r "{MessageName}" --include="*.cs"
```

Look for:
- Service implementation classes (inherit from `{ServiceName}Base`)
- Request/response handling that references the changed message
- Mapping code that populates the changed fields

### Step 4: Scan Python Consumers (Ubiquity-Connectors-Prefect)

Location: `C:\Projects\GitHub\Ubiquity-Connectors-Prefect`

```
grep -r "ubiquity_protos.{domain}" --include="*.py"
grep -r "{MessageName}" --include="*.py"
```

Look for:
- Flow files that call the affected RPC
- Message construction/reading that uses the changed fields

### Step 5: Generate Impact Report

Output format:

```
## Proto Change Impact: {proto_file}

### What Changed
- [list of field/RPC/enum changes]

### Downstream Impact

| Repo | File | Uses | Action Needed |
|------|------|------|---------------|
| WebApps | path/to/file.tsx | BillingLineItem (display) | Add new column for activated_at |
| Backend | grpc/BillingReportService.cs | Implements ListBillingLineItems | Populate activated_at from DB |
| Connectors | src/Flows/importers/x.py | Calls ListBillingLineItems | No action (reads only, new field auto-available) |

### Package Regeneration Steps
1. ubiquity-protos: merge PR → semantic-release publishes new version
2. WebApps: `bun update @qriousnz/ubiquity-protos`
3. Backend: update NuGet package version in .csproj
4. Connectors-Prefect: `uv pip install --upgrade ubiquity-protos`

### Generated Task Stubs
- [ ] {Repo}: {action needed} — references {proto field/RPC}
```

## Proto Domain → Package Path Mapping

| Proto Domain | TS Import Path | Python Import | .NET Namespace |
|-------------|---------------|---------------|----------------|
| billing | `@qriousnz/ubiquity-protos/billing/v1` | `ubiquity_protos.billing.v1` | `Ubiquity.Protos.Billing.V1` |
| list | `@qriousnz/ubiquity-protos/list/v1` | `ubiquity_protos.list.v1` | `Ubiquity.Protos.List.V1` |
| system | `@qriousnz/ubiquity-protos/system/v1` | `ubiquity_protos.system.v1` | `Ubiquity.Protos.System.V1` |
| mail | `@qriousnz/ubiquity-protos/mail/v1` | `ubiquity_protos.mail.v1` | `Ubiquity.Protos.Mail.V1` |
| journeybuilder | `@qriousnz/ubiquity-protos/journeybuilder/v1` | `ubiquity_protos.journeybuilder.v1` | `Ubiquity.Protos.Journeybuilder.V1` |
| tracking | `@qriousnz/ubiquity-protos/tracking/v1` | `ubiquity_protos.tracking.v1` | `Ubiquity.Protos.Tracking.V1` |

## "No Action Needed" Rules

Not every consumer needs a code change when a proto changes:
- **New field added (non-breaking):** Consumers that only READ the message get the field automatically after package update. Only flag if the UI should DISPLAY the new field.
- **New RPC added:** Only flag consumers that should CALL the new RPC. Existing consumers are unaffected.
- **Enum value added:** Only flag if consumers have switch/match statements on that enum (they might miss the new case).
- **Field renamed (breaking):** Flag ALL consumers — they will fail to compile.
- **Field removed (breaking):** Flag ALL consumers — they will fail to compile.

## Integration with Workflow

This detector feeds into:
1. **@architect phase** — impact report informs the design scope
2. **@taskmaster** — generated task stubs become real tasks in tasks.md
3. **Proto-to-UI Mapping Check** — confirms all UI columns have backing proto fields
4. **`deps` script** — manual invocation for ad-hoc impact analysis
