import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { findPageByMcpToken } from "@/lib/mcp-token";
import { isPersonalMcpToken } from "@/lib/mcp-token-core";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function getMcpApiKey() {
  return process.env.MCP_API_KEY?.trim() || "";
}

export function extractMcpCredential(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-mcp-key")?.trim() ?? "";
  return bearer || alt;
}

export type McpAuthResult =
  | { ok: false; status: number; error: string }
  | { ok: true; scope: "global" }
  | { ok: true; scope: "page"; pageId: string; handle: string };

export async function authenticateMcpRequest(
  request: NextRequest,
): Promise<McpAuthResult> {
  const provided = extractMcpCredential(request);
  if (!provided) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }

  if (isPersonalMcpToken(provided)) {
    const page = await findPageByMcpToken(provided);
    if (!page) {
      return { ok: false, status: 401, error: "Unauthorized." };
    }
    return { ok: true, scope: "page", pageId: page.id, handle: page.handle };
  }

  const expected = getMcpApiKey();
  if (!expected || expected.length < 24) {
    return {
      ok: false,
      status: 503,
      error: "MCP_API_KEY is not configured on the server.",
    };
  }

  if (!safeEqual(provided, expected)) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }

  return { ok: true, scope: "global" };
}

export function assertPageScopedHandle(
  auth: Extract<McpAuthResult, { ok: true }>,
  handle: string,
) {
  if (auth.scope === "global") return null;
  if (auth.handle === handle) return null;
  return "This token can only access its own page handle.";
}
