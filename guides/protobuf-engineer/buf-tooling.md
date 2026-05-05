---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Buf Tooling

## CLI Workflow

After any proto edit, always run in order:

```bash
buf format -w        # Auto-format proto files
buf lint              # Check style and naming violations
buf breaking --against '.git#branch=main'  # Detect breaking changes
```

If a Makefile or script exists with `lint`/`format` targets, prefer those.

## buf.yaml Configuration

```yaml
version: v2
modules:
  - path: proto
lint:
  use:
    - STANDARD
breaking:
  use:
    - FILE
deps:
  - buf.build/bufbuild/protovalidate
```

## buf.gen.yaml (TypeScript/Connect)

```yaml
version: v2
plugins:
  - local: protoc-gen-es
    out: gen
    opt:
      - target=ts
  - local: protoc-gen-connect-es
    out: gen
    opt:
      - target=ts
```

Adapt `out` path and plugin names to match the project's existing codegen setup.

## Lint Error Resolution

Common lint errors and fixes:
- `FIELD_LOWER_SNAKE_CASE`: Rename field to `snake_case`
- `SERVICE_SUFFIX`: Service names must end with `Service`
- `ENUM_VALUE_PREFIX`: Prefix enum values with enum name
- `ENUM_ZERO_VALUE_SUFFIX`: First enum value must end with `_UNSPECIFIED`
- `PACKAGE_DEFINED`: Every proto file needs a `package` declaration

## Codegen

After modifying protos, regenerate TypeScript types:

```bash
buf generate
```

Verify generated files compile:

```bash
npx tsc --noEmit
```
