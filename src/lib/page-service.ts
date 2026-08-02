import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages, socialChannels, type Page } from "@/db/schema";
import { sanitizeCustomCss } from "@/lib/design";
import { fetchOgPreview } from "@/lib/og-fetch";
import {
  detectPlatform,
  extractHandleHint,
  platformLabel,
} from "@/lib/social-platforms";
import { getTemplate, resolveDesign, type PageDesign, type TemplateId } from "@/lib/templates";

export async function getOwnedPageByHandle(handle: string) {
  const db = getDb();
  const [page] = await db.select().from(pages).where(eq(pages.handle, handle)).limit(1);
  return page ?? null;
}

export async function getPageBundle(page: Page) {
  const db = getDb();
  const pageLinks = await db
    .select()
    .from(links)
    .where(eq(links.pageId, page.id))
    .orderBy(asc(links.sortOrder), asc(links.createdAt));
  const channels = await db
    .select()
    .from(socialChannels)
    .where(eq(socialChannels.pageId, page.id))
    .orderBy(asc(socialChannels.sortOrder), asc(socialChannels.createdAt));

  return {
    page,
    links: pageLinks,
    channels,
    design: resolveDesign(page.theme, page.design),
    template: getTemplate(page.theme),
  };
}

export async function applyTemplateToPage(pageId: string, theme: TemplateId) {
  const template = getTemplate(theme);
  await getDb()
    .update(pages)
    .set({
      theme,
      design: template.design,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}

export async function updatePageDesign(pageId: string, design: PageDesign) {
  await getDb()
    .update(pages)
    .set({
      design: {
        ...design,
        customCss: sanitizeCustomCss(design.customCss),
      },
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}

export async function importSocialChannel(pageId: string, rawUrl: string) {
  const preview = await fetchOgPreview(rawUrl);
  const platform = detectPlatform(preview.url);
  const handle = extractHandleHint(preview.url, platform);
  const db = getDb();

  const [last] = await db
    .select({ sortOrder: socialChannels.sortOrder })
    .from(socialChannels)
    .where(eq(socialChannels.pageId, pageId))
    .orderBy(desc(socialChannels.sortOrder))
    .limit(1);

  const [existing] = await db
    .select()
    .from(socialChannels)
    .where(and(eq(socialChannels.pageId, pageId), eq(socialChannels.url, preview.url)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(socialChannels)
      .set({
        platform,
        handle,
        title: preview.title || platformLabel(platform),
        description: preview.description,
        imageUrl: preview.imageUrl,
        siteName: preview.siteName,
        updatedAt: new Date(),
      })
      .where(eq(socialChannels.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(socialChannels)
    .values({
      pageId,
      platform,
      handle,
      url: preview.url,
      title: preview.title || platformLabel(platform),
      description: preview.description,
      imageUrl: preview.imageUrl,
      siteName: preview.siteName,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    })
    .returning();

  return created;
}

export function summarizePageBundle(bundle: Awaited<ReturnType<typeof getPageBundle>>) {
  return {
    handle: bundle.page.handle,
    displayName: bundle.page.displayName,
    bio: bundle.page.bio,
    theme: bundle.page.theme,
    templateName: bundle.template.name,
    contactEmail: bundle.page.contactEmail,
    showShare: bundle.page.showShare,
    showContact: bundle.page.showContact,
    isPublished: bundle.page.isPublished,
    design: bundle.design,
    links: bundle.links.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      sortOrder: link.sortOrder,
      isVisible: link.isVisible,
    })),
    channels: bundle.channels.map((channel) => ({
      id: channel.id,
      platform: channel.platform,
      handle: channel.handle,
      url: channel.url,
      title: channel.title,
      description: channel.description,
      imageUrl: channel.imageUrl,
      isVisible: channel.isVisible,
    })),
  };
}
