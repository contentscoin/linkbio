import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages, type Link, type Page } from "@/db/schema";

export async function getPageByHandle(handle: string) {
  const [page] = await getDb()
    .select()
    .from(pages)
    .where(eq(pages.handle, handle.toLowerCase()))
    .limit(1);
  return page ?? null;
}

export async function getPageLinks(pageId: string) {
  return getDb()
    .select()
    .from(links)
    .where(eq(links.pageId, pageId))
    .orderBy(asc(links.sortOrder), asc(links.createdAt));
}

export function summarizePageBundle(page: Page, pageLinks: Link[]) {
  return {
    id: page.id,
    handle: page.handle,
    displayName: page.displayName,
    bio: page.bio,
    avatarInitials: page.avatarInitials,
    theme: page.theme,
    accent: page.accent,
    design: page.design,
    published: page.published || page.isPublished,
    links: pageLinks.map((link) => ({
      id: link.id,
      label: link.label,
      sublabel: link.sublabel,
      url: link.url,
      featured: link.featured,
      visible: link.visible && link.isVisible,
      sortOrder: link.sortOrder,
    })),
  };
}
