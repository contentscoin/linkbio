"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { links, pages } from "@/db/schema";
import { requireUserPage } from "@/lib/current";
import { logoutAction as logout } from "@/app/login/actions";
import {
  displayNameSchema,
  initialsFromName,
  urlSchema,
} from "@/lib/validation";

export { logout as logoutAction };

export async function updateProfileAction(formData: FormData) {
  const { page } = await requireUserPage();
  const displayName = displayNameSchema.safeParse(formData.get("displayName"));
  const bio = String(formData.get("bio") ?? "").slice(0, 280);
  const published = formData.get("published") === "on";

  if (!displayName.success) {
    redirect("/admin?error=" + encodeURIComponent(displayName.error.issues[0]?.message ?? "이름 오류"));
  }

  const db = getDb();
  const initials = initialsFromName(displayName.data);
  await db
    .update(pages)
    .set({
      displayName: displayName.data,
      bio,
      avatarText: initials,
      avatarInitials: initials,
      published,
      isPublished: published,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, page.id));

  revalidatePath(`/${page.handle}`);
  redirect("/admin?saved=1");
}

export async function createLinkAction(formData: FormData) {
  const { page } = await requireUserPage();
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const url = urlSchema.safeParse(formData.get("url"));

  if (!label) {
    redirect("/admin?error=" + encodeURIComponent("버튼 제목을 입력하세요."));
  }
  if (!url.success) {
    redirect("/admin?error=" + encodeURIComponent(url.error.issues[0]?.message ?? "URL 오류"));
  }

  const db = getDb();
  const existing = await db.select().from(links).where(eq(links.pageId, page.id));
  const sortOrder = existing.length;

  await db.insert(links).values({
    pageId: page.id,
    label,
    url: url.data,
    sortOrder,
    position: sortOrder,
    visible: true,
    isVisible: true,
  });

  revalidatePath(`/${page.handle}`);
  redirect("/admin?saved=1");
}

export async function deleteLinkAction(formData: FormData) {
  const { page } = await requireUserPage();
  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) redirect("/admin");

  const db = getDb();
  await db
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.pageId, page.id)));

  revalidatePath(`/${page.handle}`);
  redirect("/admin?saved=1");
}
