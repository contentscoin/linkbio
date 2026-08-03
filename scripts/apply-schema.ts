import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const existing = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `;
  console.log(
    "before:",
    existing.map((row) => String(row.table_name)),
  );

  // Base schema (idempotent-ish via IF NOT EXISTS)
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      email varchar(320) NOT NULL,
      password_hash text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users USING btree (email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS pages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
      handle varchar(32) NOT NULL,
      display_name varchar(80) NOT NULL,
      bio varchar(280) DEFAULT '' NOT NULL,
      avatar_initials varchar(4) DEFAULT 'LB' NOT NULL,
      theme varchar(24) DEFAULT 'field' NOT NULL,
      contact_email varchar(320) DEFAULT '' NOT NULL,
      show_share boolean DEFAULT true NOT NULL,
      show_contact boolean DEFAULT true NOT NULL,
      design jsonb DEFAULT '{}'::jsonb NOT NULL,
      is_published boolean DEFAULT true NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS pages_user_id_unique ON pages USING btree (user_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS pages_handle_unique ON pages USING btree (handle)`;

  // Upgrade columns if base table existed without them
  await sql`ALTER TABLE pages ADD COLUMN IF NOT EXISTS contact_email varchar(320) DEFAULT '' NOT NULL`;
  await sql`ALTER TABLE pages ADD COLUMN IF NOT EXISTS show_share boolean DEFAULT true NOT NULL`;
  await sql`ALTER TABLE pages ADD COLUMN IF NOT EXISTS show_contact boolean DEFAULT true NOT NULL`;
  await sql`ALTER TABLE pages ADD COLUMN IF NOT EXISTS design jsonb DEFAULT '{}'::jsonb NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS links (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      page_id uuid NOT NULL REFERENCES pages(id) ON DELETE cascade,
      label varchar(80) NOT NULL,
      url text NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      is_visible boolean DEFAULT true NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS social_channels (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      page_id uuid NOT NULL REFERENCES pages(id) ON DELETE cascade,
      platform varchar(24) NOT NULL,
      handle varchar(80) DEFAULT '' NOT NULL,
      url text NOT NULL,
      title varchar(120) DEFAULT '' NOT NULL,
      description varchar(280) DEFAULT '' NOT NULL,
      image_url text DEFAULT '' NOT NULL,
      site_name varchar(80) DEFAULT '' NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      is_visible boolean DEFAULT true NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS social_channels_page_url_unique ON social_channels (page_id, url)`;

  const after = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `;
  console.log(
    "after:",
    after.map((row) => String(row.table_name)),
  );
  console.log("SCHEMA_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
