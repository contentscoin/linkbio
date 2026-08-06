#!/usr/bin/env node
/**
 * Add/upgrade link card columns + assets table for P0 grid/upload.
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
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS arrow_style text NOT NULL DEFAULT 'plain'`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS arrow_position text NOT NULL DEFAULT 'trailing'`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS show_divider boolean NOT NULL DEFAULT false`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS leading_icon_url text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS secondary_text text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS trailing_icon text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS card_padding text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS card_min_height integer NOT NULL DEFAULT 0`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS card_height integer NOT NULL DEFAULT 0`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS aspect_ratio text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS row_span integer NOT NULL DEFAULT 1`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS trailing_text text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS subtitle_placement text NOT NULL DEFAULT 'body'`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS object_fit text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS image_size integer NOT NULL DEFAULT 0`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS image_position text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS mobile_card_min_height integer NOT NULL DEFAULT 0`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS mobile_card_height integer NOT NULL DEFAULT 0`;
await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS mobile_card_padding text NOT NULL DEFAULT ''`;

await sql`CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  mime_type text NOT NULL,
  content_base64 text NOT NULL,
  byte_size integer NOT NULL DEFAULT 0,
  purpose text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
)`;
await sql`CREATE INDEX IF NOT EXISTS assets_page_id_idx ON assets(page_id)`;

console.log("links P0 grid/upload columns + assets table ready");
