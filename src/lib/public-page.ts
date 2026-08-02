import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages, socialChannels } from "@/db/schema";
import { resolveDesign } from "@/lib/templates";

export async function getPublicPage(handle: string) {
  const db = getDb();
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.handle, handle), eq(pages.isPublished, true)))
    .limit(1);

  if (!page) {
    return null;
  }

  const pageLinks = await db
    .select()
    .from(links)
    .where(and(eq(links.pageId, page.id), eq(links.isVisible, true)))
    .orderBy(asc(links.sortOrder), asc(links.createdAt));

  const channels = await db
    .select()
    .from(socialChannels)
    .where(and(eq(socialChannels.pageId, page.id), eq(socialChannels.isVisible, true)))
    .orderBy(asc(socialChannels.sortOrder), asc(socialChannels.createdAt));

  return {
    page,
    links: pageLinks,
    channels,
    design: resolveDesign(page.theme, page.design),
  };
}
