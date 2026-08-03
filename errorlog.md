# Error log

[2026-08-03 16:05 KST] Error details:
- Error: MCP `tools/call` `get_page` surfaced `Unexpected end of JSON input`
- Location: `mcp/server.mjs` `agentFetch` → `response.json()`
- Cause: agent API returned HTTP 500 with empty body (no Neon DB in smoke env); JSON parse threw
- Fix: read `response.text()`, parse safely, map empty/non-JSON to clear `isError` messages; validate MCP_API_KEY length client-side
- Result: empty 500 → `HTTP 500 with empty body`; `list_templates` still OK

[2026-08-03 16:05 KST] Config inconsistency:
- `mcp/mcp.json.example` pointed at `server.mjs` while README / `.cursor/mcp.json.example` use `run.mjs`
- Fix: align example + `npm run mcp` to `mcp/run.mjs`
