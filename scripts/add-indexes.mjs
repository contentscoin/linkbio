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

/**
 * Preflight: refuse to write to a database that is not this project.
 *
 * This exists because these indexes were once applied to a different project's
 * production database that happened to share the users/pages/links/assets
 * shape. The giveaway was the extra tables, so that is what we check: this
 * schema defines exactly four, and anything beyond them means a different app.
 * Pass --force to proceed anyway (e.g. after this repo legitimately adds one).
 */
const EXPECTED_TABLES = ["assets", "links", "pages", "users"];
const force = process.argv.includes("--force");

const found = (
  await sql`SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name`
).map((r) => r.table_name);

const missing = EXPECTED_TABLES.filter((t) => !found.includes(t));
const unexpected = found.filter((t) => !EXPECTED_TABLES.includes(t));

console.log(`target tables: ${found.join(", ") || "(none)"}`);

if (missing.length || unexpected.length) {
  const why = [
    missing.length ? `missing: ${missing.join(", ")}` : "",
    unexpected.length ? `unexpected: ${unexpected.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  if (!force) {
    console.error(
      `\nThis does not look like the linkbio database (${why}).\n` +
        `Refusing to write. Re-run with --force if you are certain.`,
    );
    process.exit(1);
  }
  console.warn(`\nWARNING: schema mismatch (${why}) — proceeding due to --force`);
}

// Read on every public page render and every admin/agent link listing:
// WHERE page_id = $1 ORDER BY sort_order, created_at.
// The sort columns are in the key so an ordered index scan can satisfy the
// ORDER BY too; the planner may still choose a bitmap scan plus a small sort
// at low row counts. Either way this removes a seq scan of the whole table.
await sql`CREATE INDEX IF NOT EXISTS links_page_id_sort_idx
          ON links (page_id, sort_order, created_at)`;

// Read on every authenticated MCP/agent request (findPageByMcpToken).
// Unique: that lookup does .limit(1), so two pages sharing a token hash would
// resolve to an arbitrary one. Multiple NULLs are still allowed. If this fails
// on a duplicate, investigate before forcing it — duplicate token hashes would
// mean two pages are reachable with one credential.
await sql`CREATE UNIQUE INDEX IF NOT EXISTS pages_mcp_token_hash_unique
          ON pages (mcp_token_hash)`;

// Also created by scripts/migrate-link-icons.mjs; repeated here so a fresh
// database ends up matching src/db/schema.ts. Backs the pages ON DELETE CASCADE.
await sql`CREATE INDEX IF NOT EXISTS assets_page_id_idx ON assets (page_id)`;

const rows = await sql`
  SELECT indexname FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'links_page_id_sort_idx',
      'pages_mcp_token_hash_unique',
      'assets_page_id_idx'
    )
  ORDER BY indexname`;

console.log("indexes present:", rows.map((r) => r.indexname).join(", "));
if (rows.length !== 3) {
  console.error(`expected 3 indexes, found ${rows.length}`);
  process.exit(1);
}
