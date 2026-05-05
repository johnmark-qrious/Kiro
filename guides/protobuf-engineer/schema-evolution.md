---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Schema Evolution & Safe Migrations

## Golden Rule

Never break existing consumers. Every schema change must be backward-compatible unless explicitly coordinated.

## Safe Changes (non-breaking)

- Adding new fields with new field numbers
- Adding new RPC methods to existing services
- Adding new enum values (not at position 0)
- Adding new messages
- Adding `optional` to an existing field

## Breaking Changes (require coordination)

- Removing or renaming a field
- Changing a field's type or number
- Removing an RPC method or service
- Renaming a message or enum
- Changing `repeated` to singular or vice versa

## Removing Fields Safely

Never delete a field. Reserve it:

```protobuf
message Journey {
  reserved 3, 8;
  reserved "old_field_name", "deprecated_config";

  string id = 1;
  string display_name = 2;
  // field 3 was old_field_name — removed in v2.1
}
```

## Adding Fields

- Always use the next available field number
- Check existing messages for the highest number — don't guess
- Add a comment explaining the new field's purpose

## Enum Evolution

- Never change the `= 0` value — it's the default for unset fields
- Add new values at the end
- If removing a value, reserve the number and name

## Pre-Merge Checklist

Before merging any proto change:

1. `buf format -w` — formatted?
2. `buf lint` — passes?
3. `buf breaking --against '.git#branch=main'` — no breaking changes?
4. Field numbers sequential and not reused?
5. Reserved numbers/names for any removed fields?
6. Protovalidate constraints on new fields?
7. Generated TypeScript types compile?
