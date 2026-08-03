import test from "node:test";
import assert from "node:assert/strict";
import {
  generateMcpToken,
  getMcpTokenDisplayPrefix,
  hashMcpToken,
  isPersonalMcpToken,
  MCP_TOKEN_PREFIX,
} from "../src/lib/mcp-token-core";

test("generates lbmcp_ prefixed tokens", () => {
  const token = generateMcpToken();
  assert.ok(token.startsWith(MCP_TOKEN_PREFIX));
  assert.ok(token.length > MCP_TOKEN_PREFIX.length + 16);
});

test("hashes tokens deterministically", () => {
  const token = `${MCP_TOKEN_PREFIX}abc123xyz`;
  assert.equal(hashMcpToken(token), hashMcpToken(token));
  assert.notEqual(hashMcpToken(token), hashMcpToken(`${token}x`));
});

test("builds a stable display prefix", () => {
  const token = `${MCP_TOKEN_PREFIX}abcdefghijklmnop`;
  assert.equal(getMcpTokenDisplayPrefix(token), `${MCP_TOKEN_PREFIX}abcdefgh`);
});

test("detects personal MCP tokens", () => {
  assert.equal(isPersonalMcpToken(`${MCP_TOKEN_PREFIX}1234567890abcdef`), true);
  assert.equal(isPersonalMcpToken("global-server-key-0123456789"), false);
  assert.equal(isPersonalMcpToken(MCP_TOKEN_PREFIX), false);
});
