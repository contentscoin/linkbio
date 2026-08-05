"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { links, pages } from "@/db/schema";
import { requireUserPage } from "@/lib/current";
import { logoutAction as logout } from "@/app/login/actions";
import {
  applyTemplateToDesign,
  getDesignTemplate,
  THEME_OPTIONS,
} from "@/lib/design-templates";
import {
  mergePageDesign,
  parsePageDesign,
  sanitizeCustomCss,
  sanitizeHttpsUrl,
  type PageDesign,
} from "@/lib/page-design";
import {
  displayNameSchema,
  initialsFromName,
  urlSchema,
} from "@/lib/validation";

export { logout as logoutAction };

function adminError(message: string): never {
  redirect("/admin?error=" + encodeURIComponent(message));
}

function revalidatePage(handle: string) {
  revalidatePath(`/${handle}`);
  revalidatePath("/admin");
}

export async function updateProfileAction(formData: FormData) {
  const { page } = await requireUserPage();
  const displayName = displayNameSchema.safeParse(formData.get("displayName"));
  const bio = String(formData.get("bio") ?? "").slice(0, 280);
  const published = formData.get("published") === "on";

  if (!displayName.success) {
    adminError(displayName.error.issues[0]?.message ?? "이름 오류");
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

  revalidatePage(page.handle);
  redirect("/admin?saved=profile");
}

export async function applyDesignTemplateAction(formData: FormData) {
  const { page } = await requireUserPage();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const template = getDesignTemplate(templateId);
  if (!template) {
    adminError("디자인 템플릿을 선택하세요.");
  }

  const current = parsePageDesign(page.design);
  const design = applyTemplateToDesign(template, {
    keepAvatar: true,
    keepBackground: true,
    current,
  });
  const accentOverride = String(formData.get("accent") ?? "").trim();

  await getDb()
    .update(pages)
    .set({
      theme: template.theme,
      accent: (accentOverride || template.accent).slice(0, 32),
      design,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, page.id));

  revalidatePage(page.handle);
  redirect("/admin?saved=design");
}

export async function updateDesignAction(formData: FormData) {
  const { page } = await requireUserPage();
  const themeRaw = String(formData.get("theme") ?? "").trim();
  const themeOk = THEME_OPTIONS.some((t) => t.id === themeRaw);
  if (!themeOk) {
    adminError("테마를 선택하세요.");
  }

  const accent = String(formData.get("accent") ?? "").trim().slice(0, 32);
  const clearAvatar = formData.get("clearAvatar") === "on";
  const clearBackground = formData.get("clearBackground") === "on";
  const clearCss = formData.get("clearCss") === "on";

  const patch: Partial<PageDesign> = {
    layout: String(formData.get("layout") ?? "stack") as PageDesign["layout"],
    pattern: String(formData.get("pattern") ?? "none") as PageDesign["pattern"],
    card: String(formData.get("card") ?? "elevated") as PageDesign["card"],
    font: String(formData.get("font") ?? "sans") as PageDesign["font"],
    size: String(formData.get("size") ?? "normal") as PageDesign["size"],
    radius: String(formData.get("radius") ?? "round") as PageDesign["radius"],
    motion: String(formData.get("motion") ?? "none") as PageDesign["motion"],
    effect: String(formData.get("effect") ?? "none") as PageDesign["effect"],
    effectCard: String(
      formData.get("effectCard") ?? "lift",
    ) as PageDesign["effectCard"],
  };

  const avatarRaw = String(formData.get("avatarImageUrl") ?? "").trim();
  const bgRaw = String(formData.get("backgroundImageUrl") ?? "").trim();
  const cssRaw = String(formData.get("customCss") ?? "");

  if (clearAvatar) {
    patch.avatarImageUrl = undefined;
  } else if (avatarRaw) {
    const url = sanitizeHttpsUrl(avatarRaw);
    if (!url) adminError("프로필 이미지는 https URL만 가능합니다.");
    patch.avatarImageUrl = url;
  }

  if (clearBackground) {
    patch.backgroundImageUrl = undefined;
  } else if (bgRaw) {
    const url = sanitizeHttpsUrl(bgRaw);
    if (!url) adminError("배경 이미지는 https URL만 가능합니다.");
    patch.backgroundImageUrl = url;
  }

  const scrimRaw = String(formData.get("scrim") ?? "").trim();
  if (scrimRaw) {
    const scrim = Number(scrimRaw);
    if (!Number.isFinite(scrim) || scrim < 0 || scrim > 0.85) {
      adminError("스크림은 0~0.85 사이여야 합니다.");
    }
    patch.scrim = scrim;
  }

  let design: PageDesign;
  try {
    design = mergePageDesign(page.design, patch);
    if (clearAvatar) delete design.avatarImageUrl;
    if (clearBackground) delete design.backgroundImageUrl;
    if (clearCss) {
      delete design.customCss;
    } else if (cssRaw.trim()) {
      design.customCss = sanitizeCustomCss(cssRaw);
    }
  } catch (e) {
    adminError(e instanceof Error ? e.message : "디자인 값이 올바르지 않습니다.");
  }

  // Keep templateId only if theme still matches that template.
  const linked = design.templateId
    ? getDesignTemplate(design.templateId)
    : null;
  if (linked && linked.theme !== themeRaw) {
    delete design.templateId;
  }

  await getDb()
    .update(pages)
    .set({
      theme: themeRaw,
      accent,
      design,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, page.id));

  revalidatePage(page.handle);
  redirect("/admin?saved=design");
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
