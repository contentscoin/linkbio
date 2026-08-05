import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateMcpRequest } from "@/lib/mcp-auth";
import { createOmoBioMcpServer } from "@/lib/mcp-server";
import { enforceRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-MCP-Key, mcp-session-id, Last-Event-ID, mcp-protocol-version, Accept",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonError(status: number, error: string) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      error: { code: -32000, message: error },
      id: null,
    },
    { status, headers: CORS_HEADERS },
  );
}

async function gate(request: NextRequest) {
  const auth = await authenticateMcpRequest(request);
  if (!auth.ok) return auth;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const allowed = await enforceRateLimit(`mcp:http:${ip}`, 180, 60_000);
  if (!allowed) {
    return { ok: false as const, status: 429, error: "Rate limit exceeded." };
  }
  return auth;
}

async function handleMcp(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const auth = await gate(request);
  if (!auth.ok) return jsonError(auth.status, auth.error);

  const server = createOmoBioMcpServer(auth);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return withCors(response);
  } catch (error) {
    console.error("MCP HTTP error:", error);
    return jsonError(500, "Internal MCP server error.");
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}

export async function GET(request: NextRequest) {
  return handleMcp(request);
}

export async function POST(request: NextRequest) {
  return handleMcp(request);
}

export async function DELETE(request: NextRequest) {
  return handleMcp(request);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
