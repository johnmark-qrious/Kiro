---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# API Design Patterns

## gRPC with Connect (Project Standard)

This project uses `@connectrpc/connect` with `@connectrpc/connect-node` for gRPC communication. All gRPC clients go through a shared transport with session interceptors.

### Transport Setup Pattern

```typescript
// Single shared transport — reuse across all clients
const transport = createGrpcTransport({
  baseUrl: env.GRPC_BASE_URL,
  interceptors: [sessionInterceptor],
});

// Create typed clients from protobuf service definitions
const journeyClient = createClient(JourneyService, transport);
const accountClient = createClient(AccountService, transport);
```

Rules:
- One transport per backend service URL
- Always include the session interceptor for auth
- Export clients from a single `grpc-clients.ts` file per app
- Never create transports inside components or request handlers

### Session Interceptor Pattern

```typescript
// Injects session headers from cached claims into every gRPC call
const sessionInterceptor: Interceptor = (next) => async (req) => {
  const claims = await requireSessionClaimsCached();
  req.header.set("X-Claims-SessionID", claims.sessionId);
  req.header.set("X-Claims-SessionIPAddress", claims.sessionIpAddress);
  return next(req);
};
```

### Calling gRPC from Server Components

```typescript
// ✅ Direct call in Server Component — data stays on server
export default async function JourneysPage({ params }) {
  const { accountId } = await params;
  const response = await journeyClient.listJourneys({ accountId });
  return <JourneyList journeys={response.journeys} />;
}
```

### Calling gRPC from Server Actions

```typescript
'use server';

export async function createJourney(formData: FormData) {
  const accountId = formData.get('accountId') as string;
  const displayName = formData.get('displayName') as string;

  // Validate inputs
  const parsed = createJourneySchema.parse({ accountId, displayName });

  // gRPC call
  const journey = await journeyClient.createJourney(parsed);

  revalidatePath(`/journeys/${accountId}`);
  redirect(`/journeys/${accountId}/${journey.id}`);
}
```

## Protobuf Design Guidelines

When defining or reviewing `.proto` files:

### Message Design
- Use `string` for IDs (UUIDs) — not `int64`
- Use `google.protobuf.Timestamp` for dates — not `string` or `int64`
- Use `google.protobuf.Struct` for flexible JSON config — not `string`
- Prefix enums with the enum name: `JOURNEY_STATUS_ACTIVE`, not `ACTIVE`
- Reserve field numbers when removing fields — never reuse them

### Service Design
- One service per domain (JourneyService, AccountService)
- Use standard method naming: `Get`, `List`, `Create`, `Update`, `Delete`
- `List` methods return a response wrapper with `repeated` items + `next_page_token`
- Keep request/response messages specific to each RPC — don't share them

### Pagination Pattern

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

## REST API Routes (Next.js Route Handlers)

For cases where REST is needed (webhooks, external integrations, health checks):

### Resource Naming
- Plural nouns: `/api/journeys`, not `/api/journey`
- Nested resources: `/api/accounts/{accountId}/journeys`
- No verbs in URLs: use HTTP methods instead
- Consistent casing: kebab-case for URLs, camelCase for JSON

### Status Codes
| Action | Success | Client Error | Not Found |
|--------|---------|-------------|-----------|
| GET    | 200     | 400         | 404       |
| POST   | 201     | 400/422     | -         |
| PUT    | 200     | 400/422     | 404       |
| DELETE | 204     | 400         | 404       |

### Error Response Format

```typescript
// Consistent error shape across all route handlers
return NextResponse.json(
  {
    error: {
      code: "VALIDATION_ERROR",
      message: "Display name is required",
      details: result.error.flatten(),
    },
  },
  { status: 400 }
);
```

### Validation Pattern

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", details: result.error.flatten() } },
      { status: 400 }
    );
  }

  // Proceed with validated data
  const resource = await createResource(result.data);
  return NextResponse.json(resource, { status: 201 });
}
```

## Data Transformation

### gRPC → Frontend

Protobuf types don't always map cleanly to what the UI needs. Transform at the domain layer:

```typescript
// Domain util — transforms gRPC response to UI-friendly shape
export function toJourneyViewModel(proto: Journey): JourneyViewModel {
  return {
    id: proto.id,
    name: proto.displayName,
    status: proto.status,
    createdAt: proto.createdAt?.toDate() ?? new Date(),
    config: proto.config ?? {},
  };
}
```

Rules:
- Transform in domain utils, not in components
- Keep protobuf types out of UI components — use view models
- Handle missing/optional fields with sensible defaults
- Convert `Timestamp` to `Date` at the boundary
