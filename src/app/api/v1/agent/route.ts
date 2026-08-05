import { NextRequest, NextResponse } from "next/server";
import { authenticateMcpRequest } from "@/lib/mcp-auth";
import { runAgentAction } from "@/lib/agent-ops";
import { enforceRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function gate(request: NextRequest) {
  const auth = await authenticateMcpRequest(request);
  if (!auth.ok) return auth;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const allowed = await enforceRateLimit(`mcp:agent:${ip}`, 120, 60_000);
  if (!allowed) {
    return { ok: false as const, status: 429, error: "Rate limit exceeded." };
  }
  return auth;
}

export async function GET(request: NextRequest) {
  const auth = await gate(request);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "page";
  const body: Record<string, unknown> = {
    handle: searchParams.get("handle") ?? undefined,
  };

  const result = await runAgentAction(auth, action, body);
  if (!result.ok) {
    return jsonError(result.status ?? 400, result.error);
  }
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await gate(request);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const action = typeof body.action === "string" ? body.action : "";
  if (!action) {
    return jsonError(400, "action required.");
  }

  const result = await runAgentAction(auth, action, body);
  if (!result.ok) {
    return jsonError(result.status ?? 400, result.error);
  }
  return NextResponse.json(result);
}
