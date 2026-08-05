#!/usr/bin/env node
/**
 * OMO Bio MCP server (stdio) — proxies to /api/v1/agent
 *
 * Env:
 *   LINKBIO_BASE_URL  e.g. https://bio.omo.co.kr
 *   MCP_API_KEY       personal page token (lbmcp_…) or global MCP_API_KEY
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const baseUrl = (process.env.LINKBIO_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const apiKey = process.env.MCP_API_KEY || "";

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
    name: "get_page",
    description: "Fetch a page summary: profile and links.",
    inputSchema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "update_profile",
    description:
      "Update displayName, bio, theme, accent, and published flags.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        displayName: { type: "string" },
        bio: { type: "string" },
        theme: { type: "string" },
        accent: { type: "string" },
        isPublished: { type: "boolean" },
      },
      required: ["handle"],
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
        sublabel: { type: "string" },
        url: { type: "string" },
        featured: { type: "boolean" },
        isVisible: { type: "boolean" },
      },
      required: ["handle", "label", "url"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_link",
    description: "Delete a link button by linkId.",
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

const server = new Server(
  { name: "omo-bio", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  let result;

  switch (name) {
    case "get_page":
      result = await agentFetch("GET", {
        action: "page",
        handle: args.handle,
      });
      break;
    case "update_profile":
      result = await agentFetch("POST", null, {
        action: "update_profile",
        ...args,
      });
      break;
    case "upsert_link":
      result = await agentFetch("POST", null, {
        action: "upsert_link",
        ...args,
      });
      break;
    case "delete_link":
      result = await agentFetch("POST", null, {
        action: "delete_link",
        ...args,
      });
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
