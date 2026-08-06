#!/usr/bin/env node
/**
 * Add/upgrade link card columns used by renderer slot features.
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
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS icon_image_url text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS badge text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS mobile_span integer NOT NULL DEFAULT 1`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS layout text NOT NULL DEFAULT 'horizontal'`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS icon_placement text NOT NULL DEFAULT 'leading'`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS icon_size integer NOT NULL DEFAULT 20`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS show_arrow boolean NOT NULL DEFAULT true`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS trailing_icon text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS card_padding text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS card_min_height integer NOT NULL DEFAULT 0`;

console.log("links card renderer columns ready");
