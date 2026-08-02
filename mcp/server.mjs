#!/usr/bin/env node
/**
 * LinkBio MCP server — query, organize, update pages & design via HTTP agent API.
 *
 * Env:
 *   LINKBIO_BASE_URL  e.g. http://localhost:3000
 *   MCP_API_KEY       same key as Next.js MCP_API_KEY
 */

const baseUrl = (process.env.LINKBIO_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const apiKey = process.env.MCP_API_KEY || "";

function send(msg) {
  const body = JSON.stringify(msg);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
}

async function agentFetch(method, query, body) {
  const url = new URL(`${baseUrl}/api/v1/agent`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null) url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  if (!response.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${response.status}`);
  }
  return json;
}

const tools = [
  {
    name: "list_templates",
    description: "List LinkBio visual templates and their default design tokens.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_page",
    description: "Fetch a page summary: profile, design, links, and social channels.",
    inputSchema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "apply_template",
    description: "Apply a named template (field, studio, coral, dusk, fairway, ink, meadow, tournament).",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        theme: { type: "string" },
      },
      required: ["handle", "theme"],
      additionalProperties: false,
    },
  },
  {
    name: "update_design",
    description:
      "Patch page design: accentColor, backgroundKind/Value, buttonStyle, fontPair, layout, customCss for personalization.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        design: { type: "object" },
      },
      required: ["handle", "design"],
      additionalProperties: false,
    },
  },
  {
    name: "update_profile",
    description: "Update displayName, bio, contactEmail, publish/share flags.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        displayName: { type: "string" },
        bio: { type: "string" },
        contactEmail: { type: "string" },
        isPublished: { type: "boolean" },
        showShare: { type: "boolean" },
        showContact: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "import_social",
    description: "Import a social channel URL and scrape OG/public metadata onto the page.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        url: { type: "string" },
      },
      required: ["handle", "url"],
      additionalProperties: false,
    },
  },
  {
    name: "upsert_link",
    description: "Create or update a link button on the page.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        linkId: { type: "string" },
        label: { type: "string" },
        url: { type: "string" },
        isVisible: { type: "boolean" },
      },
      required: ["handle", "label", "url"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_link",
    description: "Delete a link by id.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        linkId: { type: "string" },
      },
      required: ["handle", "linkId"],
      additionalProperties: false,
    },
  },
];

async function callTool(name, args) {
  switch (name) {
    case "list_templates":
      return agentFetch("GET", { action: "templates" });
    case "get_page":
      return agentFetch("GET", { action: "page", handle: args.handle });
    case "apply_template":
      return agentFetch("POST", null, {
        action: "apply_template",
        handle: args.handle,
        theme: args.theme,
      });
    case "update_design":
      return agentFetch("POST", null, {
        action: "update_design",
        handle: args.handle,
        design: args.design,
      });
    case "update_profile":
      return agentFetch("POST", null, { action: "update_profile", ...args });
    case "import_social":
      return agentFetch("POST", null, {
        action: "import_social",
        handle: args.handle,
        url: args.url,
      });
    case "upsert_link":
      return agentFetch("POST", null, { action: "upsert_link", ...args });
    case "delete_link":
      return agentFetch("POST", null, {
        action: "delete_link",
        handle: args.handle,
        linkId: args.linkId,
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

let buffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;
    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }
    const length = Number(match[1]);
    const total = headerEnd + 4 + length;
    if (buffer.length < total) break;
    const raw = buffer.slice(headerEnd + 4, total).toString("utf8");
    buffer = buffer.slice(total);

    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      continue;
    }

    void (async () => {
      if (message.method === "initialize") {
        send({
          jsonrpc: "2.0",
          id: message.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "linkbio", version: "0.2.0" },
          },
        });
        return;
      }

      if (message.method === "notifications/initialized") return;

      if (message.method === "tools/list") {
        send({
          jsonrpc: "2.0",
          id: message.id,
          result: { tools },
        });
        return;
      }

      if (message.method === "tools/call") {
        try {
          const result = await callTool(
            message.params.name,
            message.params.arguments || {},
          );
          send({
            jsonrpc: "2.0",
            id: message.id,
            result: {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            },
          });
        } catch (error) {
          send({
            jsonrpc: "2.0",
            id: message.id,
            result: {
              isError: true,
              content: [
                {
                  type: "text",
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            },
          });
        }
        return;
      }

      if (message.id != null) {
        send({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32601, message: `Method not found: ${message.method}` },
        });
      }
    })();
  }
});

process.stdin.resume();
