import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, type Page } from "@/db/schema";
import {
  applyTemplateToDesign,
  getDesignTemplate,
} from "@/lib/design-templates";
import { parsePageDesign } from "@/lib/page-design";

export type ApplyTemplateResult =
  | { ok: true; handle: string; templateId: string }
  | { ok: false; error: string };

/** Shared apply path for admin form + API (avoids Server Action ID skew). */
export async function applyDesignTemplateToPage(
  page: Page,
  templateIdRaw: string,
  accentOverride?: string,
): Promise<ApplyTemplateResult> {
  const templateId = templateIdRaw.trim();
  const template = getDesignTemplate(templateId);
  if (!template) {
    return { ok: false, error: "디자인 템플릿을 선택하세요." };
  }

  const current = parsePageDesign(page.design);
  const design = parsePageDesign(
    applyTemplateToDesign(template, {
      keepAvatar: true,
      keepBackground: true,
      current,
    }),
  );
  if (current.wizard) {
    design.wizard = current.wizard;
  }

  const accent = (accentOverride?.trim() || template.accent).slice(0, 32);

  try {
    await getDb()
      .update(pages)
      .set({
        theme: template.theme,
        accent,
        design,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, page.id));
  } catch (error) {
    console.error("applyDesignTemplateToPage failed", error);
    return {
      ok: false,
      error: "템플릿 적용에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }

  return { ok: true, handle: page.handle, templateId: template.id };
}
