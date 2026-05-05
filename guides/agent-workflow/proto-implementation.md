---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Proto/gRPC Schema Implementation

When working on proto schemas, codegen, or gRPC service definitions:

## Step 1: Schema Work
Use **@protobuf-engineer** for all proto-related changes
- Design or modify `.proto` files
- Add protovalidate constraints
- Configure buf.yaml / buf.gen.yaml
- Run codegen and verify output
- Check for breaking changes with `buf breaking`

## Step 2: Review (conditional)
Let **@quality-assurance** review if the change affects existing consumers.

**Handoff context**: Include which proto files changed, what fields/services were added/modified, and whether `buf breaking` passed.

- Verify backward compatibility
- Check that generated types are used correctly downstream
- Validate constraint coverage

Skip this step for additive-only changes (new fields, new services) that pass `buf breaking`.

## Step 3: Frontend Integration
If the proto change requires UI updates, hand off to the frontend implementation workflow.
- @frontend-engineer consumes the new/updated generated types
- Transform at the domain boundary — keep proto types out of components

## Example

```
User: "Add an email field to the CreateConnector request"

1. @protobuf-engineer - Add field with protovalidate email constraint, run buf lint + breaking
2. IF modifies existing fields → @quality-assurance - Review compatibility
   IF additive only + buf breaking passes → skip review
3. IF UI needs updating → hand off to frontend implementation workflow
```

## Learned Patterns
<!-- cap: 10 | last-consolidated: never | pr-count-since: 0 -->
