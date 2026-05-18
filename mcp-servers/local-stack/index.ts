import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const PROCESS_COMPOSE_URL = "http://localhost:8080";
const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 180_000; // 3 minutes

async function pcFetch(path: string, method = "GET") {
  const res = await fetch(`${PROCESS_COMPOSE_URL}${path}`, { method });
  if (!res.ok) throw new Error(`process-compose ${path}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function waitForHealthy(names: string[], timeoutMs = MAX_WAIT_MS): Promise<{ ready: string[]; failed: string[] }> {
  const start = Date.now();
  const ready: string[] = [];
  const pending = new Set(names);

  while (pending.size > 0 && Date.now() - start < timeoutMs) {
    const processes: any = await pcFetch("/processes");
    for (const name of [...pending]) {
      const proc = processes.data?.find((p: any) => p.name === name);
      if (proc?.status === "Running") {
        ready.push(name);
        pending.delete(name);
      }
    }
    if (pending.size > 0) await Bun.sleep(POLL_INTERVAL_MS);
  }

  return { ready, failed: [...pending] };
}

const server = new McpServer({ name: "local-stack", version: "1.0.0" });

server.tool("stack_status", "Get status of all local services (process-compose)", {}, async () => {
  try {
    const processes: any = await pcFetch("/processes");
    const services = (processes.data || []).map((p: any) => ({
      name: p.name,
      status: p.status,
      namespace: p.namespace || "default",
      pid: p.pid,
      uptime: p.system_time,
      exitCode: p.exit_code,
    }));
    return { content: [{ type: "text", text: JSON.stringify(services, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: "text", text: `Process-compose not reachable at ${PROCESS_COMPOSE_URL}. Is it running?\nError: ${e.message}` }], isError: true };
  }
});

server.tool(
  "stack_start",
  "Start local services. Blocks until healthy or timeout (3 min). Omit names to start all.",
  { names: z.array(z.string()).optional().describe("Service names to start. Omit for all.") },
  async ({ names }) => {
    try {
      if (names && names.length > 0) {
        for (const name of names) {
          await pcFetch(`/process/start/${name}`, "POST");
        }
        const result = await waitForHealthy(names);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } else {
        // Start all via namespace or just hit each process
        const processes: any = await pcFetch("/processes");
        const allNames = (processes.data || []).map((p: any) => p.name);
        for (const name of allNames) {
          await pcFetch(`/process/start/${name}`, "POST").catch(() => {});
        }
        const result = await waitForHealthy(allNames);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    } catch (e: any) {
      return { content: [{ type: "text", text: `Failed to start services: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "stack_stop",
  "Stop local services. Omit names to stop all.",
  { names: z.array(z.string()).optional().describe("Service names to stop. Omit for all.") },
  async ({ names }) => {
    try {
      if (names && names.length > 0) {
        for (const name of names) {
          await pcFetch(`/process/stop/${name}`, "PATCH");
        }
        return { content: [{ type: "text", text: `Stopped: ${names.join(", ")}` }] };
      } else {
        const processes: any = await pcFetch("/processes");
        const allNames = (processes.data || []).map((p: any) => p.name);
        for (const name of allNames) {
          await pcFetch(`/process/stop/${name}`, "PATCH").catch(() => {});
        }
        return { content: [{ type: "text", text: `Stopped all services.` }] };
      }
    } catch (e: any) {
      return { content: [{ type: "text", text: `Failed to stop services: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "stack_logs",
  "Get recent logs for a service.",
  {
    name: z.string().describe("Service name"),
    lines: z.number().optional().default(50).describe("Number of lines to fetch (default 50)"),
  },
  async ({ name, lines }) => {
    try {
      const res = await fetch(`${PROCESS_COMPOSE_URL}/process/logs/${name}/0/${lines}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data: any = await res.json();
      const logText = (data.logs || []).map((l: any) => l.message || l).join("\n");
      return { content: [{ type: "text", text: logText || "(no logs)" }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Failed to get logs for ${name}: ${e.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
