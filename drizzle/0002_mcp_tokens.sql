-- Personal MCP tokens (page-scoped)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS mcp_token_hash text;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS mcp_token_prefix varchar(24);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS mcp_token_created_at timestamptz;
