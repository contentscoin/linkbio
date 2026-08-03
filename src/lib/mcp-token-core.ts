import { createHash, randomBytes } from "crypto";

export const MCP_TOKEN_PREFIX = "lbmcp_";
const TOKEN_BYTES = 32;

export function generateMcpToken() {
  const secret = randomBytes(TOKEN_BYTES).toString("base64url");
  return `${MCP_TOKEN_PREFIX}${secret}`;
}

export function hashMcpToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getMcpTokenDisplayPrefix(token: string) {
  if (!token.startsWith(MCP_TOKEN_PREFIX)) return "";
  const secret = token.slice(MCP_TOKEN_PREFIX.length);
  return `${MCP_TOKEN_PREFIX}${secret.slice(0, 8)}`;
}

export function isPersonalMcpToken(token: string) {
  return token.startsWith(MCP_TOKEN_PREFIX) && token.length > MCP_TOKEN_PREFIX.length + 8;
}
