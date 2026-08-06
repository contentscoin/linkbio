#!/usr/bin/env node
/**
 * Add link icon/badge columns used by P1 design features.
 * Safe to re-run (IF NOT EXISTS).
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = neon(url);

await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS icon_key text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS icon_url text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS badge text NOT NULL DEFAULT ''`;

console.log("links.icon_key / icon_url / badge ready");
