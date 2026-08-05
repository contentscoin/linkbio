import "server-only";

import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function getMcpApiKey() {
  return process.env.MCP_API_KEY?.trim() || "";
}

export function requireMcpAuth(request: NextRequest) {
  const expected = getMcpApiKey();
  if (!expected || expected.length < 24) {
    return {
      ok: false as const,
      status: 503,
      error: "MCP_API_KEY is not configured on the server.",
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-mcp-key")?.trim() ?? "";
  const provided = bearer || alt;

  if (!provided || !safeEqual(provided, expected)) {
    return { ok: false as const, status: 401, error: "Unauthorized." };
  }

  return { ok: true as const };
}
