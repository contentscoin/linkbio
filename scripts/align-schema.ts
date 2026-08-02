import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());
const sql = neon(process.env.DATABASE_URL!);

async function ensureColumn(
  table: string,
  column: string,
  definition: string,
) {
  const rows = await sql`
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = ${table}
      and column_name = ${column}
    limit 1
  `;
  if (rows.length === 0) {
    await sql.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`added ${table}.${column}`);
  } else {
    console.log(`ok ${table}.${column}`);
  }
}

async function main() {
  const cols = await sql`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'pages'
    order by ordinal_position
  `;
  console.log("pages columns:", cols);

  await ensureColumn("pages", "bio", "varchar(280) DEFAULT '' NOT NULL");
  await ensureColumn("pages", "avatar_initials", "varchar(4) DEFAULT 'LB' NOT NULL");
  await ensureColumn("pages", "theme", "varchar(24) DEFAULT 'field' NOT NULL");
  await ensureColumn("pages", "contact_email", "varchar(320) DEFAULT '' NOT NULL");
  await ensureColumn("pages", "show_share", "boolean DEFAULT true NOT NULL");
  await ensureColumn("pages", "show_contact", "boolean DEFAULT true NOT NULL");
  await ensureColumn("pages", "design", "jsonb DEFAULT '{}'::jsonb NOT NULL");
  await ensureColumn("pages", "is_published", "boolean DEFAULT true NOT NULL");
  await ensureColumn("pages", "created_at", "timestamptz DEFAULT now() NOT NULL");
  await ensureColumn("pages", "updated_at", "timestamptz DEFAULT now() NOT NULL");

  await ensureColumn("links", "sort_order", "integer DEFAULT 0 NOT NULL");
  await ensureColumn("links", "is_visible", "boolean DEFAULT true NOT NULL");
  await ensureColumn("links", "created_at", "timestamptz DEFAULT now() NOT NULL");
  await ensureColumn("links", "updated_at", "timestamptz DEFAULT now() NOT NULL");

  console.log("ALIGN_OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
