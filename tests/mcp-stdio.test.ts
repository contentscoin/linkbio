import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runMjs = path.join(root, "mcp", "run.mjs");

const EXPECTED_TOOLS = [
  "list_templates",
  "get_page",
  "apply_template",
  "update_design",
  "update_profile",
  "import_social",
  "upsert_link",
  "delete_link",
] as const;

async function mcpRpc(
  messages: unknown[],
  env: Record<string, string> = {},
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runMjs], {
      cwd: root,
      env: {
        ...process.env,
        MCP_API_KEY: "test-mcp-key-at-least-24-chars!!",
        LINKBIO_BASE_URL: "http://127.0.0.1:9",
        ...env,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const replies: unknown[] = [];
    let buffer = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("MCP stdio timed out"));
    }, 8_000);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      buffer += chunk;
      const parts = buffer.split("\n");
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        if (!line.trim()) continue;
        replies.push(JSON.parse(line) as unknown);
      }
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", () => {
      clearTimeout(timer);
      resolve(replies);
    });

    for (const message of messages) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }
    child.stdin.end();

    // Allow handlers to answer, then stop the long-lived stdio server.
    setTimeout(() => child.kill("SIGTERM"), 1_200);
  });
}

test("MCP stdio initializes and lists eight LinkBio tools", async () => {
  const replies = await mcpRpc([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "mcp-stdio-test", version: "0.0.1" },
      },
    },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
  ]);

  const init = replies.find(
    (msg) =>
      typeof msg === "object" &&
      msg !== null &&
      "id" in msg &&
      (msg as { id: unknown }).id === 1,
  ) as {
    result?: { serverInfo?: { name?: string; version?: string }; protocolVersion?: string };
  };
  assert.equal(init?.result?.serverInfo?.name, "linkbio");
  assert.equal(init?.result?.serverInfo?.version, "0.2.0");
  assert.equal(init?.result?.protocolVersion, "2024-11-05");

  const listed = replies.find(
    (msg) =>
      typeof msg === "object" &&
      msg !== null &&
      "id" in msg &&
      (msg as { id: unknown }).id === 2,
  ) as { result?: { tools?: Array<{ name: string }> } };

  const names = (listed?.result?.tools ?? []).map((tool) => tool.name);
  assert.deepEqual(names, [...EXPECTED_TOOLS]);
});

test("MCP rejects missing API key before calling the agent", async () => {
  const replies = await mcpRpc(
    [
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "mcp-stdio-test", version: "0.0.1" },
        },
      },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "list_templates", arguments: {} },
      },
    ],
    { MCP_API_KEY: "short" },
  );

  const call = replies.find(
    (msg) =>
      typeof msg === "object" &&
      msg !== null &&
      "id" in msg &&
      (msg as { id: unknown }).id === 3,
  ) as { result?: { isError?: boolean; content?: Array<{ text?: string }> } };

  assert.equal(call?.result?.isError, true);
  assert.match(
    String(call?.result?.content?.[0]?.text ?? ""),
    /MCP_API_KEY is missing or too short/,
  );
});
