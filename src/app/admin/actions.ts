"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { links, pages, socialChannels } from "@/db/schema";
import { requireCurrentUserPage } from "@/lib/current";
import { redirectWithMessage } from "@/lib/messages";
import {
  applyTemplateToPage,
  importSocialChannel,
  updatePageDesign,
} from "@/lib/page-service";
import { issuePageMcpToken, revokePageMcpToken } from "@/lib/mcp-token";
import { getTemplate } from "@/lib/templates";
import {
  checkboxValue,
  validateBio,
  validateDesignForm,
  validateDisplayName,
  validateExternalUrl,
  validateHandle,
  validateInitials,
  validateLinkLabel,
  validateOptionalContactEmail,
  validateSortOrder,
  validateTheme,
  validateUuid,
} from "@/lib/validation";

function adminFail(message: string): never {
  redirect(redirectWithMessage("/admin", "error", message));
}

function adminSaved(message: string): never {
  redirect(redirectWithMessage("/admin", "saved", message));
}

function revalidatePage(handle: string, previous?: string) {
  revalidatePath("/admin");
  revalidatePath(`/${handle}`);
  if (previous && previous !== handle) {
    revalidatePath(`/${previous}`);
  }
}

export async function updateProfileAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const displayName = validateDisplayName(formData.get("displayName"));
  if (!displayName.ok) adminFail(displayName.message);

  const bio = validateBio(formData.get("bio"));
  if (!bio.ok) adminFail(bio.message);

  const handle = validateHandle(formData.get("handle"));
  if (!handle.ok) adminFail(handle.message);

  const initials = validateInitials(formData.get("avatarInitials"));
  if (!initials.ok) adminFail(initials.message);

  const contactEmail = validateOptionalContactEmail(formData.get("contactEmail"));
  if (!contactEmail.ok) adminFail(contactEmail.message);

  const db = getDb();

  try {
    await db
      .update(pages)
      .set({
        handle: handle.value,
        displayName: displayName.value,
        bio: bio.value,
        avatarInitials: initials.value,
        contactEmail: contactEmail.value,
        showShare: checkboxValue(formData.get("showShare")),
        showContact: checkboxValue(formData.get("showContact")),
        isPublished: checkboxValue(formData.get("isPublished")),
        updatedAt: new Date(),
      })
      .where(and(eq(pages.id, current.page.id), eq(pages.userId, current.user.id)));
  } catch {
    adminFail("Could not save the profile. The handle may already be taken.");
  }

  revalidatePage(handle.value, current.page.handle);
  adminSaved("profile");
}

export async function applyTemplateAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const theme = validateTheme(formData.get("theme"));
  if (!theme.ok) adminFail(theme.message);

  await applyTemplateToPage(current.page.id, theme.value);
  revalidatePage(current.page.handle);
  adminSaved(`template:${getTemplate(theme.value).name}`);
}

export async function updateDesignAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const design = validateDesignForm(formData);
  if (!design.ok) adminFail(design.message);

  await updatePageDesign(current.page.id, design.value);
  revalidatePage(current.page.handle);
  adminSaved("design");
}

export async function importSocialAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const url = validateExternalUrl(formData.get("url"));
  if (!url.ok) adminFail(url.message);

  try {
    await importSocialChannel(current.page.id, url.value);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not import channel metadata.";
    adminFail(message);
  }

  revalidatePage(current.page.handle);
  adminSaved("social");
}

export async function deleteSocialAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const channelId = validateUuid(formData.get("channelId"));
  if (!channelId.ok) adminFail(channelId.message);

  const db = getDb();
  const [owned] = await db
    .select({ id: socialChannels.id })
    .from(socialChannels)
    .innerJoin(pages, eq(socialChannels.pageId, pages.id))
    .where(and(eq(socialChannels.id, channelId.value), eq(pages.userId, current.user.id)))
    .limit(1);

  if (!owned) adminFail("Social channel not found.");

  await db.delete(socialChannels).where(eq(socialChannels.id, owned.id));
  revalidatePage(current.page.handle);
  adminSaved("social");
}

export async function createLinkAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const label = validateLinkLabel(formData.get("label"));
  if (!label.ok) adminFail(label.message);

  const url = validateExternalUrl(formData.get("url"));
  if (!url.ok) adminFail(url.message);

  const db = getDb();
  const [lastLink] = await db
    .select({ sortOrder: links.sortOrder })
    .from(links)
    .where(eq(links.pageId, current.page.id))
    .orderBy(desc(links.sortOrder))
    .limit(1);

  await db.insert(links).values({
    pageId: current.page.id,
    label: label.value,
    url: url.value,
    sortOrder: (lastLink?.sortOrder ?? -1) + 1,
  });

  revalidatePage(current.page.handle);
  adminSaved("link");
}

async function findOwnedLink(userId: string, linkId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: links.id, pageId: links.pageId })
    .from(links)
    .innerJoin(pages, eq(links.pageId, pages.id))
    .where(and(eq(links.id, linkId), eq(pages.userId, userId)))
    .orderBy(asc(links.sortOrder))
    .limit(1);
  return row ?? null;
}

export async function updateLinkAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const linkId = validateUuid(formData.get("linkId"));
  if (!linkId.ok) adminFail(linkId.message);

  const label = validateLinkLabel(formData.get("label"));
  if (!label.ok) adminFail(label.message);

  const url = validateExternalUrl(formData.get("url"));
  if (!url.ok) adminFail(url.message);

  const sortOrder = validateSortOrder(formData.get("sortOrder"));
  if (!sortOrder.ok) adminFail(sortOrder.message);

  const ownedLink = await findOwnedLink(current.user.id, linkId.value);
  if (!ownedLink) {
    adminFail("Link not found.");
  }

  await getDb()
    .update(links)
    .set({
      label: label.value,
      url: url.value,
      sortOrder: sortOrder.value,
      isVisible: checkboxValue(formData.get("isVisible")),
      updatedAt: new Date(),
    })
    .where(eq(links.id, ownedLink.id));

  revalidatePage(current.page.handle);
  adminSaved("link");
}

export async function deleteLinkAction(formData: FormData) {
  const current = await requireCurrentUserPage();
  const linkId = validateUuid(formData.get("linkId"));
  if (!linkId.ok) adminFail(linkId.message);

  const ownedLink = await findOwnedLink(current.user.id, linkId.value);
  if (!ownedLink) {
    adminFail("Link not found.");
  }

  await getDb().delete(links).where(eq(links.id, ownedLink.id));

  revalidatePage(current.page.handle);
  adminSaved("link");
}

export async function issueMcpTokenAction() {
  const current = await requireCurrentUserPage();
  const { token } = await issuePageMcpToken(current.page.id);
  revalidatePage(current.page.handle);
  redirect(
    redirectWithMessage("/admin", "saved", "mcp-token") +
      `&mcp_token=${encodeURIComponent(token)}`,
  );
}

export async function revokeMcpTokenAction() {
  const current = await requireCurrentUserPage();
  await revokePageMcpToken(current.page.id);
  revalidatePage(current.page.handle);
  adminSaved("mcp-revoked");
}
