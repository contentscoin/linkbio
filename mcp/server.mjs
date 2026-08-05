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
    description: "Fetch a page summary: profile, links, and design.",
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
  {
    name: "start_profile_wizard",
    description:
      "Start the profile creation helper (Q&A). Call this after MCP connect.",
    inputSchema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "answer_profile_wizard",
    description: "Submit an answer to the current (or given) wizard step.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        answer: { type: "string" },
        stepId: { type: "string" },
      },
      required: ["handle", "answer"],
      additionalProperties: false,
    },
  },
  {
    name: "get_profile_wizard_status",
    description: "Get current profile wizard progress and next question.",
    inputSchema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "list_design_templates",
    description: "List design templates (theme + layout + CSS presets).",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "apply_design_template",
    description: "Apply a named design template to the page.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        templateId: { type: "string" },
        accent: { type: "string" },
        keepAvatar: { type: "boolean" },
        keepBackground: { type: "boolean" },
      },
      required: ["handle", "templateId"],
      additionalProperties: false,
    },
  },
  {
    name: "set_avatar_image",
    description: "Set or clear the profile avatar image (https URL).",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        imageUrl: { type: "string" },
        clear: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "set_background_image",
    description: "Set or clear background image and optional scrim.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        imageUrl: { type: "string" },
        scrim: { type: "number" },
        clear: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "set_custom_css",
    description: "Insert or clear custom CSS for the public page design.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        css: { type: "string" },
        clear: { type: "boolean" },
      },
      required: ["handle"],
      additionalProperties: false,
    },
  },
  {
    name: "update_design",
    description:
      "Update design fields: layout, pattern, motion, effect, card, size, radius, font.",
    inputSchema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        theme: { type: "string" },
        accent: { type: "string" },
        layout: { type: "string" },
        pattern: { type: "string" },
        motion: { type: "string" },
        effect: { type: "string" },
        card: { type: "string" },
        size: { type: "string" },
        radius: { type: "string" },
        font: { type: "string" },
        effectCard: { type: "string" },
        scrim: { type: "number" },
        templateId: { type: "string" },
      },
      required: ["handle"],
      additionalProperties: false,
    },
  },
];

const postActions = new Set([
  "update_profile",
  "upsert_link",
  "delete_link",
  "start_profile_wizard",
  "answer_profile_wizard",
  "get_profile_wizard_status",
  "apply_design_template",
  "set_avatar_image",
  "set_background_image",
  "set_custom_css",
  "update_design",
]);

const server = new Server(
  { name: "omo-bio", version: "0.2.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  let result;

  if (name === "get_page") {
    result = await agentFetch("GET", {
      action: "page",
      handle: args.handle,
    });
  } else if (name === "list_design_templates") {
    result = await agentFetch("GET", { action: "list_design_templates" });
  } else if (postActions.has(name)) {
    result = await agentFetch("POST", null, { action: name, ...args });
  } else {
    throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
