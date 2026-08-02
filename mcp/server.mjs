#!/usr/bin/env node
/**
 * LinkBio MCP server (stdio) — proxies to /api/v1/agent
 *
 * Env:
 *   LINKBIO_BASE_URL  e.g. http://localhost:3000
 *   MCP_API_KEY       same key as Next.js MCP_API_KEY
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
    description:
      "Apply a named template (field, studio, coral, dusk, fairway, ink, meadow, tournament).",
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
      "Patch page design: accentColor, backgroundKind/Value, buttonStyle, fontPair, layout, customCss.",
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

async function callTool(name, args = {}) {
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

const server = new Server(
  { name: "linkbio", version: "0.2.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await callTool(request.params.name, request.params.arguments || {});
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
