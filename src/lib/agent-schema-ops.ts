import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { links, pages, type Page } from "@/db/schema";
import { coerceIconKey } from "@/lib/link-icons";
import type { McpAuthResult } from "@/lib/mcp-auth";
import { assertPageScopedHandle } from "@/lib/mcp-auth";
import {
  getPageByHandle,
  getPageLinks,
  summarizePageBundle,
} from "@/lib/page-bundle";
import { sanitizeHttpsUrl } from "@/lib/page-design";
import type { PageSchema } from "@/lib/page-schema";
import { parsePageSchema } from "@/lib/page-schema";
import {
  applySchemaToDesign,
  createPageFromTemplateOp,
  flattenSchemaLinks,
  getDraftSchema,
  getPageSchemaOp,
  getTemplateOp,
  listTemplatesOp,
  mergePageContent,
  reorderComponentsInSchema,
  renderPreviewPayload,
  restoreSchemaVersion,
  updateSectionInSchema,
  upsertComponentInSchema,
  validateDesignSchema,
} from "@/lib/schema-ops";
import { publicPageUrl, siteOrigin } from "@/lib/site-url";
import { handleSchema, urlSchema } from "@/lib/validation";

type AgentResult =
  | { ok: true; [key: string]: unknown }
  | { ok: false; error: string; status?: number; [key: string]: unknown };

type LoadFail = { ok: false; error: string; status?: number };
type LoadOk = { ok: true; handle: string; page: Page };
type LoadResult = LoadOk | LoadFail;

function fail(error: string, status = 400): LoadFail {
  return { ok: false, error, status };
}

function resolveHandle(
  auth: Extract<McpAuthResult, { ok: true }>,
  rawHandle: unknown,
): { ok: true; handle: string } | LoadFail {
  if (auth.scope === "page") {
    if (typeof rawHandle === "string" && rawHandle.trim()) {
      const denied = assertPageScopedHandle(auth, rawHandle.trim().toLowerCase());
      if (denied) return fail(denied, 403);
      return { ok: true, handle: rawHandle.trim().toLowerCase() };
    }
    return { ok: true, handle: auth.handle };
  }
  const parsed = handleSchema.safeParse(
    typeof rawHandle === "string" ? rawHandle : "",
  );
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid handle.");
  }
  return { ok: true, handle: parsed.data };
}

async function loadScopedPage(
  auth: Extract<McpAuthResult, { ok: true }>,
  rawHandle: unknown,
): Promise<LoadResult> {
  const handleResult = resolveHandle(auth, rawHandle);
  if (!handleResult.ok) return handleResult;
  const page = await getPageByHandle(handleResult.handle);
  if (!page) return fail("Page not found.", 404);
  return { ok: true, handle: handleResult.handle, page };
}

async function summarize(page: Page) {
  return summarizePageBundle(page, await getPageLinks(page.id));
}

function err(error: string, status = 400): AgentResult {
  return { ok: false, error, status };
}

export async function syncLinksFromSchema(page: Page, schema: PageSchema) {
  const db = getDb();
  const flat = flattenSchemaLinks(schema);
  const existing = await getPageLinks(page.id);
  const usedIds = new Set<string>();
  let sortOrder = 0;

  for (const item of flat) {
    const key = item.key.slice(0, 64);
    const match =
      existing.find((l) => l.section === key && !usedIds.has(l.id)) ||
      existing.find(
        (l) =>
          !usedIds.has(l.id) &&
          l.label.replace(/\s+/g, "-").toLowerCase() === key.toLowerCase(),
      );

    const urlParsed = urlSchema.safeParse(item.url);
    const url = urlParsed.success ? urlParsed.data : "https://example.com";
    const iconImage =
      (item.iconImageUrl && sanitizeHttpsUrl(item.iconImageUrl)) || "";
    const leading =
      (item.leadingIconUrl && sanitizeHttpsUrl(item.leadingIconUrl)) || "";

    const values = {
      section: key,
      label: (item.label || key).slice(0, 80),
      sublabel: (item.sublabel || "").slice(0, 160),
      url,
      featured: Boolean(item.featured),
      visible: true,
      isVisible: true,
      sortOrder,
      position: sortOrder,
      span: item.span || 1,
      mobileSpan: item.mobileSpan || item.span || 1,
      iconKey: item.iconKey ? coerceIconKey(item.iconKey) : "",
      iconImageUrl: iconImage,
      leadingIconUrl: leading,
      secondaryText: (item.secondaryText || "").slice(0, 160),
      trailingText: (item.trailingText || "").slice(0, 80),
      badge: (item.badge || "").slice(0, 24),
      showArrow: item.showArrow !== false,
      showDivider: Boolean(item.showDivider),
      arrowStyle: (item.arrowStyle as "plain" | "circle") || "plain",
      subtitlePlacement:
        (item.subtitlePlacement as "body" | "trailing") || "body",
      variant: (item.variant as "card" | "full" | "spotlight") || "card",
      layout: "horizontal" as const,
      iconPlacement: "leading" as const,
      cardMinHeight: item.cardMinHeight || (item.featured ? 0 : 140),
      cardHeight: item.cardHeight || 0,
      updatedAt: new Date(),
    };

    if (match) {
      usedIds.add(match.id);
      await db
        .update(links)
        .set(values)
        .where(and(eq(links.id, match.id), eq(links.pageId, page.id)));
    } else {
      const [created] = await db
        .insert(links)
        .values({ pageId: page.id, ...values })
        .returning({ id: links.id });
      if (created) usedIds.add(created.id);
    }
    sortOrder += 1;
  }

  for (const link of existing) {
    if (usedIds.has(link.id)) continue;
    await db
      .update(links)
      .set({ visible: false, isVisible: false, updatedAt: new Date() })
      .where(and(eq(links.id, link.id), eq(links.pageId, page.id)));
  }
}

async function persistSchema(
  page: Page,
  schema: PageSchema,
  opts: { asDraft?: boolean; publish?: boolean; versionLabel?: string },
) {
  const design = applySchemaToDesign(page.design, schema, opts);
  const tokens = (await import("@/lib/page-schema")).themeTokens(schema.theme);
  const pagePatch: Partial<typeof pages.$inferInsert> = {
    design,
    updatedAt: new Date(),
    // Schema theme drives public data-theme / accent (not Fairway default)
    theme: schema.theme.slice(0, 32),
    accent: tokens.accent.slice(0, 32),
  };
  if (schema.brand?.displayName) {
    pagePatch.displayName = schema.brand.displayName.slice(0, 80);
  }
  if (opts.publish) {
    pagePatch.published = true;
    pagePatch.isPublished = true;
  }
  await getDb().update(pages).set(pagePatch).where(eq(pages.id, page.id));
  await syncLinksFromSchema(page, schema);
  // Bust public page cache so schemaVersionId / design changes show immediately
  revalidatePath(`/${page.handle}`);
  revalidatePath("/admin");
}

export async function agentListTemplates(): Promise<AgentResult> {
  return { ok: true, ...listTemplatesOp() };
}

export async function agentGetTemplate(
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const id = typeof body.templateId === "string" ? body.templateId : "";
  if (!id) return err("templateId required.");
  try {
    return { ok: true, ...getTemplateOp(id) };
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown template.");
  }
}

export async function agentCreatePageFromTemplate(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const templateId =
    typeof body.templateId === "string" ? body.templateId : "";
  if (!templateId) return err("templateId required.");

  let created;
  try {
    created = createPageFromTemplateOp({
      templateId,
      displayName:
        typeof body.displayName === "string" ? body.displayName : undefined,
      headline: typeof body.headline === "string" ? body.headline : undefined,
      theme: typeof body.theme === "string" ? body.theme : undefined,
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : undefined,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Template failed.");
  }

  const persist = body.persist !== false;
  if (!persist) {
    return { ok: true, ...created };
  }

  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  await persistSchema(loaded.page, created.schema, {
    asDraft: body.publish !== true,
    publish: body.publish === true,
    versionLabel: `template:${templateId}`,
  });
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    schema: created.schema,
    validation: created.validation,
    previewUrl: publicPageUrl(loaded.handle),
    page: await summarize(fresh),
  };
}

export async function agentGetPageSchema(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  return { ok: true, handle: loaded.handle, ...getPageSchemaOp(loaded.page.design) };
}

export async function agentUpdatePageContent(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const current = getDraftSchema(loaded.page.design);
  const content =
    body.schema && typeof body.schema === "object"
      ? (body.schema as Record<string, unknown>)
      : body;
  const schema =
    parsePageSchema(content) ??
    mergePageContent(current, content as Record<string, unknown>);
  await persistSchema(loaded.page, schema, {
    asDraft: body.publish !== true,
    publish: body.publish === true,
    versionLabel: "update_page_content",
  });
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    schema,
    validation: validateDesignSchema(fresh.design),
    previewUrl: publicPageUrl(loaded.handle),
    page: await summarize(fresh),
  };
}

export async function agentUpdateSection(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const current = getDraftSchema(loaded.page.design);
  if (!current) return err("No pageSchema. Use create_page_from_template first.");
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  if (!sectionId) return err("sectionId required.");
  const patch =
    body.patch && typeof body.patch === "object"
      ? (body.patch as Record<string, unknown>)
      : (body as Record<string, unknown>);
  try {
    const schema = updateSectionInSchema(current, sectionId, patch);
    await persistSchema(loaded.page, schema, {
      asDraft: true,
      versionLabel: `update_section:${sectionId}`,
    });
    const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
    return {
      ok: true,
      schema,
      validation: validateDesignSchema(fresh.design),
      page: await summarize(fresh),
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : "update_section failed.");
  }
}

export async function agentUpsertComponent(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const current = getDraftSchema(loaded.page.design);
  if (!current) return err("No pageSchema.");
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  if (!sectionId) return err("sectionId required.");
  const component =
    body.component && typeof body.component === "object"
      ? (body.component as Record<string, unknown>)
      : {};
  try {
    const schema = upsertComponentInSchema(current, {
      sectionId,
      componentId:
        typeof body.componentId === "string" ? body.componentId : undefined,
      component,
    });
    await persistSchema(loaded.page, schema, {
      asDraft: true,
      versionLabel: `upsert_component:${sectionId}`,
    });
    const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
    return {
      ok: true,
      schema,
      validation: validateDesignSchema(fresh.design),
      page: await summarize(fresh),
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : "upsert_component failed.");
  }
}

export async function agentReorderComponents(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const current = getDraftSchema(loaded.page.design);
  if (!current) return err("No pageSchema.");
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const orderedIds = Array.isArray(body.orderedIds)
    ? body.orderedIds.filter((v): v is string => typeof v === "string")
    : [];
  if (!sectionId || !orderedIds.length) {
    return err("sectionId and orderedIds required.");
  }
  try {
    const schema = reorderComponentsInSchema(current, sectionId, orderedIds);
    await persistSchema(loaded.page, schema, {
      asDraft: true,
      versionLabel: `reorder:${sectionId}`,
    });
    const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
    return { ok: true, schema, page: await summarize(fresh) };
  } catch (e) {
    return err(e instanceof Error ? e.message : "reorder_components failed.");
  }
}

export async function agentRenderPreview(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const origin =
    typeof body.baseUrl === "string" && body.baseUrl.trim()
      ? body.baseUrl.trim()
      : siteOrigin();
  return {
    ok: true,
    ...renderPreviewPayload({
      handle: loaded.handle,
      design: loaded.page.design,
      origin,
    }),
  };
}

export async function agentValidatePage(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const schema =
    (body.schema && parsePageSchema(body.schema)) ||
    getDraftSchema(loaded.page.design);
  const validation = schema
    ? validateDesignSchema({ pageSchemaDraft: schema })
    : validateDesignSchema(loaded.page.design);
  const errors = validation.filter((v) => v.level === "error");
  return {
    ok: true,
    valid: errors.length === 0,
    validation,
    schema,
  };
}

export async function agentSaveDraft(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const schema =
    parsePageSchema(body.schema) ?? getDraftSchema(loaded.page.design);
  if (!schema) return err("No schema to save.");
  await persistSchema(loaded.page, schema, {
    asDraft: true,
    versionLabel:
      typeof body.label === "string" ? body.label : "save_draft",
  });
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    draft: true,
    schema,
    validation: validateDesignSchema(fresh.design),
    previewUrl: publicPageUrl(loaded.handle),
    page: await summarize(fresh),
  };
}

export async function agentPublishPage(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const schema =
    parsePageSchema(body.schema) ?? getDraftSchema(loaded.page.design);
  if (!schema) return err("No schema to publish.");
  const validation = validateDesignSchema({ pageSchemaDraft: schema });
  const errors = validation.filter((v) => v.level === "error");
  if (errors.length && body.force !== true) {
    return {
      ok: false,
      error: "Validation failed. Fix errors or pass force:true.",
      status: 400,
      validation,
    } as AgentResult;
  }
  await persistSchema(loaded.page, schema, {
    publish: true,
    versionLabel:
      typeof body.label === "string" ? body.label : "publish",
  });
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    published: true,
    schema,
    validation,
    previewUrl: publicPageUrl(loaded.handle),
    page: await summarize(fresh),
  };
}

export async function agentRestoreVersion(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const versionId =
    typeof body.versionId === "string" ? body.versionId : "";
  if (!versionId) return err("versionId required.");
  try {
    const design = restoreSchemaVersion(loaded.page.design, versionId);
    const schema = getDraftSchema(design);
    if (!schema) return err("Restored version has no schema.");
    await getDb()
      .update(pages)
      .set({ design, updatedAt: new Date(), published: true, isPublished: true })
      .where(eq(pages.id, loaded.page.id));
    await syncLinksFromSchema(loaded.page, schema);
    const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
    return {
      ok: true,
      restored: versionId,
      schema,
      previewUrl: publicPageUrl(loaded.handle),
      page: await summarize(fresh),
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : "restore_version failed.");
  }
}

export async function agentOpenProfileDesigner(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const origin = siteOrigin();
  const step =
    typeof body.step === "string" && body.step.trim()
      ? body.step.trim()
      : "guide";
  const designerUrl = `${origin}/designer?handle=${encodeURIComponent(loaded.handle)}&embed=1&step=${encodeURIComponent(step)}`;
  const templates = listTemplatesOp().templates;
  const schemaInfo = getPageSchemaOp(loaded.page.design);
  return {
    ok: true,
    handle: loaded.handle,
    step,
    designerUrl,
    widgetUri: "ui://bioomo/profile-designer.html",
    templates,
    schema: schemaInfo.draft,
    validation: schemaInfo.validation,
    previewUrl: publicPageUrl(loaded.handle),
    message:
      "ChatGPT/MCP Apps 호스트는 ui://bioomo/profile-designer.html 위젯을 표시합니다. 템플릿 선택 → 콘텐츠 → 디자인 → 미리보기/게시 순으로 진행하세요. CSS 직접 입력은 사용하지 마세요.",
  };
}
