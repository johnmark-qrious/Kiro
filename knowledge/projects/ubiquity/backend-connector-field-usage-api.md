---
sync: draft
notionPageId:
lastLocalEdit: 2026-06-09T11:05:00+12:00
lastPublished:
---

# Backend ↔ Connectors API: Field Usage Integration

## Key Discovery

The Connectors-Prefect FastAPI uses Pydantic's default snake_case JSON serialization. Any .NET consumer (like `ConnectorFieldUsageService`) MUST use snake_case in `[JsonProperty]` attributes when deserializing responses.

## API Contract

```
GET /connectors/{account_id}/field-usage?table_id={table_id}
```

- `table_id` optional — omit for contact table, include for transactional
- Auth: `verify_connectors_feature_access` + `verify_view_connectors`
- Returns 200 with empty `fields` array if no active connectors

## Response Shape (snake_case from Python)

```json
{
  "fields": [
    {
      "field_identifier": "email",
      "usage_type": "to_name",
      "connectors": [
        {
          "connector_id": "uuid",
          "connector_name": "SFTP Daily Import",
          "connector_type": "importer",
          "system": "sftp"
        }
      ]
    }
  ]
}
```

## Backend Consumer

- File: `mvc/code/Infrastructure/ConnectorFieldUsageService.cs`
- Static class, `Lazy<HttpClient>`, reads `Settings.ConnectorFieldUsageApiBaseUrl`
- Private deserialization models with `[JsonProperty("snake_case")]`
- Maps to public models in `Info/Connector/`
- Gracefully degrades (returns empty result) if API URL not configured

## Config

- Setting: `ConnectorFieldUsage.ApiBaseUrl`
- Test: `https://connectors-helper.internal.ubiquity-test.co.nz`
- Prod: `https://connectors-helper.internal.ubiquity-prod.co.nz`
- Local: not configured by default (graceful degrade)

## Gotcha

Pydantic serializes as snake_case by default. The original PR #2773 used camelCase in JsonProperty attributes, causing all fields to deserialize as null. Fixed in `fix/connector-field-usage-deserialization` branch.

## Revert History

### 1.178.0 (2026-05-07)
- **PR #2773** (feature) — merged then REVERTED via PR #2795
- **PR #2788** (URL fix + graceful degrade) — closed, never merged
- **Branch `fix/connector-field-usage-deserialization`** — parked, contains snake_case fix

### 1.179.0 (2026-06-09)
- **PR #2796** (core feature re-introduction) — merged then REVERTED via PR #2866
- **PR #2840** (mandatory+unique detection) — merged then REVERTED via PR #2866
- **PR #2866** (revert PR) — targets release/1.179.0, removes entire feature
- **Reason:** Transactional database fields not covered. Alert only fires for contact DB schema changes. TransactionalListsSchema controller + view has no connector warning integration.

## Gap: Transactional DB Not Covered

The `GetConnectorFieldUsage` action and `connectorFieldUsageUrl` JS wiring only exist on:
- `SchemaController` (contact DB: `Lists/Schema/Index.aspx`)

Missing from:
- `TransactionalListsSchemaController` (transactional DB: `Lists/TransactionalListsSchema/Edit.aspx`)

The Connectors API already supports `table_id` param for transactional tables. The backend just never calls it from the transactional editor.

## Re-merge Plan (1.180.0)

1. Revert the revert (re-introduce #2796 + #2840 code)
2. Add `GetConnectorFieldUsage` to TransactionalListsSchemaController
3. Wire `connectorFieldUsageUrl` in TransactionalListsSchema/Edit.aspx
4. Pass `table_id` to ConnectorFieldUsageService for transactional context
5. Full end-to-end testing on BOTH contact and transactional databases
6. Merge into release/1.180.0

## Related PBIs

- #3503387 — Connector field usage API (Connectors-Prefect side, George Powell)
- #3482774 — Database Change Alert (consumes this API)
- Parent Feature: #3487866 — Database Edit Alert
