import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const email = process.env.SEED_EMAIL ?? "qa@linkbio.local";
const password = process.env.SEED_PASSWORD ?? "verification-password";
const handle = process.env.SEED_HANDLE ?? "bolbanjang";

const sql = neon(url);

const links = [
  ["Lesson package guide", "https://fmgmembers.com/?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball"],
  ["Kakao consultation", "https://pf.kakao.com/_example/chat?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball"],
  ["Luckyball order", "https://smartstore.naver.com/?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball"],
  ["Team printing inquiry", "https://forms.gle/example?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball"],
  ["FMGmembers", "https://fmgmembers.com/?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball_members"],
];

const hash = await bcrypt.hash(password, 12);

const [user] = await sql`
  insert into users (email, password_hash)
  values (${email}, ${hash})
  on conflict (email) do update set password_hash = excluded.password_hash
  returning id
`;

const [page] = await sql`
  insert into pages (
    user_id, handle, display_name, bio, avatar_initials, theme, published, is_published
  )
  values (
    ${user.id},
    ${handle},
    ${"Golf Luckyball"},
    ${"Lesson packages, custom balls, and team printing links in one place."},
    ${"Go"},
    ${"fairway"},
    true,
    true
  )
  on conflict (handle) do update set
    display_name = excluded.display_name,
    bio = excluded.bio,
    avatar_initials = excluded.avatar_initials,
    theme = excluded.theme,
    published = true,
    is_published = true,
    updated_at = now()
  returning id
`;

await sql`delete from links where page_id = ${page.id}`;

let order = 0;
for (const [label, linkUrl] of links) {
  await sql`
    insert into links (page_id, label, url, sort_order, position, visible, is_visible)
    values (${page.id}, ${label}, ${linkUrl}, ${order}, ${order}, true, true)
  `;
  order += 1;
}

console.log(`SEED_OK handle=/${handle} email=${email}`);
