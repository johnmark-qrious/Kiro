---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Proto Schema Design

## Message Conventions

- Use `string` for IDs (UUIDs) — not `int64`
- Use `google.protobuf.Timestamp` for dates — not `string` or `int64`
- Use `google.protobuf.Struct` for flexible JSON config — not `string`
- One request/response message per RPC — don't share across methods
- Keep messages focused: single responsibility per message

## Field Rules

- Use next sequential field numbers — never skip or reuse
- Mark fields `optional` when they may not be present
- Use `repeated` for lists, never a comma-separated string
- Add field-level comments explaining purpose and constraints
- Reserve field numbers and names when removing fields

## Enum Patterns

- Prefix values with the enum name: `JOURNEY_STATUS_ACTIVE`, not `ACTIVE`
- Always include an `UNSPECIFIED = 0` value as the default
- Use `(buf.validate.field).enum.defined_only = true` to reject unknown values

## Service Design

- One service per domain: `JourneyService`, `AccountService`
- Standard method naming: `Get`, `List`, `Create`, `Update`, `Delete`
- `List` methods return a wrapper with `repeated` items + `next_page_token`

## Pagination

```protobuf
message ListJourneysRequest {
  string account_id = 1;
  int32 page_size = 2;
  string page_token = 3;
}

message ListJourneysResponse {
  repeated Journey journeys = 1;
  string next_page_token = 2;
}
```

## Protovalidate Constraints

Add constraints to every field in production APIs:

```protobuf
import "buf/validate/validate.proto";

message CreateJourneyRequest {
  string account_id = 1 [(buf.validate.field).string.uuid = true];
  string display_name = 2 [(buf.validate.field).string = {
    min_len: 1,
    max_len: 255
  }];
  string email = 3 [(buf.validate.field).string.email = true];
}
```

Common constraints:
- Strings: `min_len`, `max_len`, `uuid`, `email`, `uri`
- Numbers: `gt`, `gte`, `lt`, `lte`
- Enums: `defined_only = true`
- Required fields: `(buf.validate.field).required = true`
