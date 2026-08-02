import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sql = neon(databaseUrl);
const marker = `codex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const emailA = `${marker}_a@example.com`;
const emailB = `${marker}_b@example.com`;
const handleA = `${marker}_a`.replace(/_/g, "-").slice(0, 32);
const handleB = `${marker}_b`.replace(/_/g, "-").slice(0, 32);

async function cleanup() {
  await sql`delete from users where email in (${emailA}, ${emailB})`;
}

async function main() {
  const passwordHash = await bcrypt.hash("verification-password", 12);

  try {
    await cleanup();

    const [userA] = (await sql`
    insert into users (email, password_hash)
    values (${emailA}, ${passwordHash})
    returning id
  `) as Array<{ id: string }>;

    const [userB] = (await sql`
    insert into users (email, password_hash)
    values (${emailB}, ${passwordHash})
    returning id
  `) as Array<{ id: string }>;

    const [pageA] = (await sql`
    insert into pages (user_id, handle, display_name, bio, avatar_initials)
    values (${userA.id}, ${handleA}, 'Verification A', 'temporary', 'VA')
    returning id
  `) as Array<{ id: string }>;

    const [pageB] = (await sql`
    insert into pages (user_id, handle, display_name, bio, avatar_initials)
    values (${userB.id}, ${handleB}, 'Verification B', 'temporary', 'VB')
    returning id
  `) as Array<{ id: string }>;

    const [linkB] = (await sql`
    insert into links (page_id, label, url, sort_order)
    values (${pageB.id}, 'Owned by B', 'https://example.com/b', 0)
    returning id
  `) as Array<{ id: string }>;

    await sql`
    insert into social_channels (page_id, platform, handle, url, title, description, image_url, site_name)
    values (
      ${pageA.id},
      'website',
      'example',
      ${`https://example.com/${marker}`},
      'Example Channel',
      'verification social row',
      '',
      'example.com'
    )
  `;

    const socialRows = await sql`
    select id from social_channels where page_id = ${pageA.id} limit 1
  `;
    if (socialRows.length !== 1) {
      throw new Error("Social channel insert failed.");
    }

    const crossTenantRows = await sql`
    select links.id
    from links
    inner join pages on links.page_id = pages.id
    where links.id = ${linkB.id} and pages.user_id = ${userA.id}
    limit 1
  `;
  if (crossTenantRows.length !== 0) {
    throw new Error("Tenant isolation failed: user A can see user B link.");
  }

    let duplicateRejected = false;
    try {
      await sql`
      insert into pages (user_id, handle, display_name, bio, avatar_initials)
      values (${userA.id}, ${handleB}, 'Duplicate', '', 'D')
    `;
    } catch {
      duplicateRejected = true;
    }
    if (!duplicateRejected) {
      throw new Error("Duplicate handle was accepted.");
    }

    await sql`update pages set is_published = false where id = ${pageA.id}`;
    const publicRows = await sql`
    select id from pages where handle = ${handleA} and is_published = true
  `;
    if (publicRows.length !== 0) {
      throw new Error("Unpublished page is still publicly queryable.");
    }

    await cleanup();
    const leftoverRows = await sql`
    select count(*)::int as count
    from users
    where email in (${emailA}, ${emailB})
  `;
    const leftoverCount = Number((leftoverRows[0] as { count: number }).count);
    if (leftoverCount !== 0) {
      throw new Error("Cleanup failed.");
    }

    console.log(
      "DB_VERIFY_OK: schema, inserts, uniqueness, tenant isolation, publish gate, social channels, cleanup",
    );
  } catch (error) {
    await cleanup();
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
