---
sync: draft
lastLocalEdit: 2026-05-18T15:22:00+12:00
---

# Streaming File Download via gRPC Server Stream

## Pattern

When the backend provides a server-streaming RPC that returns file chunks (bytes), pipe it directly to the browser via a Next.js Route Handler. No client-side file generation or CSV libraries needed.

## Architecture

```
Browser GET → Next.js Route Handler → gRPC server stream → pipe chunks → HTTP chunked response → browser download
```

## Implementation

### Route Handler (`app/{feature}/download/route.ts`)

```typescript
import { requireSessionInfoCached } from "@monorepo/packages-auth/server";
import { grpcClient } from "@/lib/grpc-clients";

export async function GET(request: Request) {
  const sessionInfo = await requireSessionInfoCached();
  // Auth check here

  const { searchParams } = new URL(request.url);
  // Extract params from query string

  const stream = grpcClient.downloadSomething({ /* params */ });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(new TextEncoder().encode("\uFEFF")); // BOM for Excel CSV
        for await (const response of stream) {
          controller.enqueue(response.chunk);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="export.csv"`,
      "Transfer-Encoding": "chunked",
    },
  });
}
```

### Client-side trigger

```typescript
window.location.href = `/admin/feature/download?${params}`;
```

## Why This Over Client-Side Generation

- No data loaded into browser memory (scales to millions of rows)
- Backend handles CSV formatting + injection protection
- Browser shows native download progress
- No CSV library dependency on the client
- Consistent with backend streaming architecture

## When to Use

- Backend has a server-streaming RPC returning `bytes chunk`
- File could be large (100+ rows)
- Data is already available server-side

## When NOT to Use

- Small exports from data already in the client (< 50 rows, already rendered)
- Backend doesn't have a streaming endpoint
- Need client-side transformations before export

## First Used

Billing report CSV download (PR #200, May 2026). Backend RPC: `BillingReportService.DownloadBillingReport`.

## Decision Context

Architect (Stuart) directed: use streaming from backend instead of client-side CSV generation. PapaParse was considered but unnecessary since backend already produces the CSV bytes.
