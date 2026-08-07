#!/usr/bin/env node
/**
 * Add the indexes backing our hot lookups. Safe to re-run (IF NOT EXISTS).
 *
 * There is no drizzle/ migrations directory — schema changes reach the database
 * through `db:push` or one-off scripts like this one, matching
 * scripts/migrate-link-icons.mjs.
 *
 * Plain CREATE INDEX briefly blocks writes to the table. That is fine at
 * current row counts; if these tables ever grow large, switch to
 * CREATE INDEX CONCURRENTLY (which cannot run inside a transaction, and leaves
 * an INVALID index behind if it fails — drop and retry in that case).
 *
 *   DATABASE_URL=... node scripts/add-indexes.mjs
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = neon(url);

// Read on every public page render and every admin/agent link listing:
// WHERE page_id = $1 ORDER BY sort_order, created_at.
// The sort columns are in the key so an ordered index scan can satisfy the
// ORDER BY too; the planner may still choose a bitmap scan plus a small sort
// at low row counts. Either way this removes a seq scan of the whole table.
await sql`CREATE INDEX IF NOT EXISTS links_page_id_sort_idx
          ON links (page_id, sort_order, created_at)`;

// Read on every authenticated MCP/agent request (findPageByMcpToken).
await sql`CREATE INDEX IF NOT EXISTS pages_mcp_token_hash_idx
          ON pages (mcp_token_hash)`;

// Already created by scripts/migrate-link-icons.mjs; repeated here so a fresh
// database ends up matching src/db/schema.ts. Backs the pages ON DELETE CASCADE.
await sql`CREATE INDEX IF NOT EXISTS assets_page_id_idx ON assets (page_id)`;

const rows = await sql`
  SELECT indexname FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'links_page_id_sort_idx',
      'pages_mcp_token_hash_idx',
      'assets_page_id_idx'
    )
  ORDER BY indexname`;

console.log("indexes present:", rows.map((r) => r.indexname).join(", "));
if (rows.length !== 3) {
  console.error(`expected 3 indexes, found ${rows.length}`);
  process.exit(1);
}
