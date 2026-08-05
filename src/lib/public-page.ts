import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages } from "@/db/schema";

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

  return { page, links: pageLinks };
}
