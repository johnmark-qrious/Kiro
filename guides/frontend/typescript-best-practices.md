---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# TypeScript Best Practices

## Type Safety

- NEVER use `any` - use `unknown` if type is truly unknown
- AVOID type assertions (`as`) - design proper types instead
- Let TypeScript infer types when obvious
- Use generics for reusable, type-safe code
- Leverage utility types: Partial, Pick, Omit, Record, Readonly, etc.

## Type Design

- Prefer `interface` for object shapes
- Use `type` for unions, intersections, and primitives
- Use discriminated unions for state management
- Make impossible states unrepresentable
- Use branded types for domain-specific values when needed

## No Unnecessary Type Assertions

Never add `as unknown`, `as any`, or other type assertions unless TypeScript genuinely cannot compile without them. Before adding a cast:

1. Check if the type already supports the operation (e.g., `T[keyof T]` already allows `typeof` checks, `instanceof`, and comparison operators)
2. Try type narrowing first (`typeof`, `instanceof`, type guards)
3. Only use assertions as a last resort when the compiler truly cannot infer the correct type

If you believe a cast is needed, run `getDiagnostics` on the file WITHOUT the cast first. If it compiles clean, don't add the cast.

### Prefer Type Narrowing Over Casting

```typescript
// ❌ Bad - unnecessary cast
const value = obj[key] as unknown;
if (typeof value === "string") { ... }

// ✅ Good - narrowing works directly on indexed access types
const value = obj[key];
if (typeof value === "string") { ... }
```

### When Assertions Are Acceptable

- Interfacing with untyped third-party APIs
- Working around genuine TypeScript limitations (document why in a comment)
- Test files where type precision is less critical

Every `as` keyword in production code should have a justifying comment if it's not obvious why it's needed.

## Examples

```typescript
// ❌ Bad: Using any
const parseData = (data: any) => data.value;

// ✅ Good: Proper typing
const parseData = <T extends { value: string }>(data: T) => data.value;

// ❌ Bad: Type assertion
const user = response as User;

// ✅ Good: Type guard
const isUser = (data: unknown): data is User => {
  return typeof data === 'object' && data !== null && 'id' in data;
};
const user = isUser(response) ? response : null;

// ❌ Bad: Over-annotation
const name: string = "John";

// ✅ Good: Let inference work
const name = "John";
```
