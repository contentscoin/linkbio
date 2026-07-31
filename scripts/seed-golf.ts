import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { golfLinks, readSeedConfig } from "./seed-config";

const config = readSeedConfig(process.env);
const sql = neon(config.databaseUrl);
const passwordHash = await bcrypt.hash(config.password, 12);

const userRows = (await sql`
  insert into users (email, password_hash)
  values (${config.email}, ${passwordHash})
  on conflict (email) do update set password_hash = excluded.password_hash
  returning id
`) as Array<{ id: string }>;
const [user] = userRows;

if (!user) {
  throw new Error("Seed failed to create a user.");
}

const pageRows = (await sql`
  insert into pages (user_id, handle, display_name, bio, avatar_initials, theme, is_published)
  values (
    ${user.id},
    ${config.handle},
    'Golf Luckyball',
    'Lesson packages, custom balls, and team printing links in one place.',
    'GL',
    'field',
    true
  )
  on conflict (user_id) do update set
    handle = excluded.handle,
    display_name = excluded.display_name,
    bio = excluded.bio,
    avatar_initials = excluded.avatar_initials,
    theme = excluded.theme,
    is_published = excluded.is_published,
    updated_at = now()
  returning id
`) as Array<{ id: string }>;
const [page] = pageRows;

if (!page) {
  throw new Error("Seed failed to create a page.");
}

await sql`delete from links where page_id = ${page.id}`;

for (const [index, link] of golfLinks.entries()) {
  await sql`
    insert into links (page_id, label, url, sort_order, is_visible)
    values (${page.id}, ${link.label}, ${link.url}, ${index}, true)
  `;
}

console.log(`Seeded ${config.handle} with ${golfLinks.length} links for ${config.email}.`);
