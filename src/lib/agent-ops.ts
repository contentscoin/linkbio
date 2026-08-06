import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages, type Page } from "@/db/schema";
import { parseDataUri, parseBase64Payload, storePageAsset } from "@/lib/assets";
import { computedLinkSpan } from "@/lib/link-sections";
import { publicPageUrl, siteOrigin } from "@/lib/site-url";
import {
  applyTemplateToDesign,
  getDesignTemplate,
  listDesignTemplates,
} from "@/lib/design-templates";
import type { McpAuthResult } from "@/lib/mcp-auth";
import { assertPageScopedHandle } from "@/lib/mcp-auth";
import {
  getPageByHandle,
  getPageLinks,
  summarizePageBundle,
} from "@/lib/page-bundle";
import { coerceIconKey, LINK_ICON_KEYS } from "@/lib/link-icons";
import {
  mergePageDesign,
  parseDesignSection,
  parsePageDesign,
  sanitizeCustomCss,
  sanitizeHttpsUrl,
  type PageDesign,
} from "@/lib/page-design";
import {
  getWizardStep,
  nextWizardStepId,
  normalizeWizardAnswer,
  parseFirstLinkAnswer,
  startWizardState,
  wizardInstruction,
  wizardProgress,
  WIZARD_STEPS,
} from "@/lib/profile-wizard";
import {
  displayNameSchema,
  handleSchema,
  initialsFromName,
  urlSchema,
} from "@/lib/validation";

export type AgentOk = { ok: true; page?: ReturnType<typeof summarizePageBundle>; [key: string]: unknown };
export type AgentErr = { ok: false; error: string; status?: number };
export type AgentResult = AgentOk | AgentErr;

function err(error: string, status = 400): AgentErr {
  return { ok: false, error, status };
}

function parseLinkLayout(value: unknown): "horizontal" | "vertical" | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "horizontal" || value === "vertical") return value;
  return undefined;
}

function parseIconPlacement(
  value: unknown,
): "leading" | "top" | "trailing" | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "leading" || value === "top" || value === "trailing") {
    return value;
  }
  return undefined;
}

function parseIconSize(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(96, Math.max(12, Math.floor(value)));
}

function parseArrowStyle(value: unknown): "plain" | "circle" | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "plain" || value === "circle") return value;
  return undefined;
}

function parseArrowPosition(
  value: unknown,
): "trailing" | "top-right" | "end" | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "trailing" || value === "top-right" || value === "end") {
    return value;
  }
  return undefined;
}


function parseSubtitlePlacement(value: unknown): "body" | "trailing" | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "body" || value === "trailing") return value;
  return undefined;
}

function parseObjectFit(value: unknown): "contain" | "cover" | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "contain" || value === "cover") return value;
  return undefined;
}

function applyLinkVisualFields(
  target: Partial<typeof links.$inferInsert>,
  body: Record<string, unknown>,
): string | null {
  const spanRaw = body.span ?? body.colSpan;
  if (typeof spanRaw === "number" && Number.isFinite(spanRaw)) {
    target.span = Math.min(3, Math.max(1, Math.floor(spanRaw)));
  }
  if (typeof body.mobileSpan === "number" && Number.isFinite(body.mobileSpan)) {
    target.mobileSpan = Math.min(3, Math.max(1, Math.floor(body.mobileSpan)));
  }
  if (typeof body.rowSpan === "number" && Number.isFinite(body.rowSpan)) {
    target.rowSpan = Math.min(3, Math.max(1, Math.floor(body.rowSpan)));
  }
  if (body.trailingText !== undefined) {
    target.trailingText =
      body.trailingText === null
        ? ""
        : typeof body.trailingText === "string"
          ? body.trailingText.trim().slice(0, 160)
          : "";
  }
  const subtitlePlacement = parseSubtitlePlacement(body.subtitlePlacement);
  if (subtitlePlacement) target.subtitlePlacement = subtitlePlacement;
  const objectFit = parseObjectFit(body.objectFit);
  if (objectFit) target.objectFit = objectFit;
  else if (body.objectFit === null || body.objectFit === "") {
    target.objectFit = "";
  }
  if (typeof body.imageSize === "number" && Number.isFinite(body.imageSize)) {
    target.imageSize = Math.min(96, Math.max(0, Math.floor(body.imageSize)));
  }
  if (typeof body.imagePosition === "string") {
    const pos = body.imagePosition.trim();
    target.imagePosition =
      pos === "top" || pos === "leading" || pos === "trailing" ? pos : "";
  } else if (body.imagePosition === null) {
    target.imagePosition = "";
  }
  if (typeof body.cardHeight === "number" && Number.isFinite(body.cardHeight)) {
    target.cardHeight = Math.min(640, Math.max(0, Math.floor(body.cardHeight)));
  }
  if (typeof body.height === "number" && Number.isFinite(body.height)) {
    target.cardHeight = Math.min(640, Math.max(0, Math.floor(body.height)));
  }
  if (typeof body.minHeight === "number" && Number.isFinite(body.minHeight)) {
    target.cardMinHeight = Math.min(480, Math.max(0, Math.floor(body.minHeight)));
  }
  if (typeof body.cardMinHeight === "number" && Number.isFinite(body.cardMinHeight)) {
    target.cardMinHeight = Math.min(480, Math.max(0, Math.floor(body.cardMinHeight)));
  }
  if (body.aspectRatio !== undefined) {
    target.aspectRatio =
      body.aspectRatio === null
        ? ""
        : typeof body.aspectRatio === "string"
          ? body.aspectRatio.trim().slice(0, 24)
          : "";
  }
  if (typeof body.mobileCardMinHeight === "number" && Number.isFinite(body.mobileCardMinHeight)) {
    target.mobileCardMinHeight = Math.min(480, Math.max(0, Math.floor(body.mobileCardMinHeight)));
  }
  if (typeof body.mobileCardHeight === "number" && Number.isFinite(body.mobileCardHeight)) {
    target.mobileCardHeight = Math.min(640, Math.max(0, Math.floor(body.mobileCardHeight)));
  }
  if (body.mobileCardPadding !== undefined) {
    target.mobileCardPadding =
      body.mobileCardPadding === null
        ? ""
        : typeof body.mobileCardPadding === "string"
          ? body.mobileCardPadding.trim().slice(0, 32)
          : "";
  }
  if (body.padding !== undefined && typeof body.padding === "string") {
    target.cardPadding = body.padding.trim().slice(0, 32);
  }
  return null;
}


function parseHandle(raw: unknown) {
  return handleSchema.safeParse(typeof raw === "string" ? raw : "");
}

export function resolveHandle(
  auth: Extract<McpAuthResult, { ok: true }>,
  rawHandle: unknown,
): { ok: true; handle: string } | AgentErr {
  if (auth.scope === "page") {
    if (typeof rawHandle === "string" && rawHandle.trim()) {
      const parsed = parseHandle(rawHandle);
      if (!parsed.success) {
        return err(parsed.error.issues[0]?.message ?? "Invalid handle.");
      }
      const scopeError = assertPageScopedHandle(auth, parsed.data);
      if (scopeError) return err(scopeError, 403);
      return { ok: true, handle: parsed.data };
    }
    return { ok: true, handle: auth.handle };
  }

  const parsed = parseHandle(rawHandle);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid handle.");
  }
  return { ok: true, handle: parsed.data };
}

async function loadScopedPage(
  auth: Extract<McpAuthResult, { ok: true }>,
  rawHandle: unknown,
) {
  const handleResult = resolveHandle(auth, rawHandle);
  if (!handleResult.ok) return handleResult;
  const page = await getPageByHandle(handleResult.handle);
  if (!page) return err("Page not found.", 404);
  return { ok: true as const, handle: handleResult.handle, page };
}

function summarize(page: Page) {
  return getPageLinks(page.id).then((pageLinks) =>
    summarizePageBundle(page, pageLinks),
  );
}

export async function agentHealth(auth: Extract<McpAuthResult, { ok: true }>) {
  return {
    ok: true as const,
    service: "omo-bio-mcp",
    scope: auth.scope,
    handle: auth.scope === "page" ? auth.handle : undefined,
    tools: [
      "get_page",
      "update_profile",
      "upsert_link",
      "delete_link",
      "list_design_capabilities",
      "start_profile_wizard",
      "answer_profile_wizard",
      "get_profile_wizard_status",
      "list_design_templates",
      "apply_design_template",
      "set_avatar_image",
      "set_background_image",
      "set_custom_css",
      "update_design",
      "upsert_section",
      "upload_asset",
      "get_preview_url",
    ],
  };
}

export async function agentGetPage(
  auth: Extract<McpAuthResult, { ok: true }>,
  rawHandle: unknown,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, rawHandle);
  if (!loaded.ok) return loaded;
  const pageLinks = await getPageLinks(loaded.page.id);
  const design = parsePageDesign(loaded.page.design);
  const sections = design.sections ?? [];
  const layoutDebug = sections.map((section) => {
    const columns = section.columns ?? 1;
    const items = (section.items ?? [])
      .map((key) => pageLinks.find((l) => l.id === key || l.section === key))
      .filter(Boolean)
      .map((link) => ({
        id: link!.id,
        label: link!.label,
        ...computedLinkSpan(link!, columns),
      }));
    return {
      sectionId: section.id,
      title: section.title,
      columns,
      mobileColumns: section.mobileColumns ?? columns,
      gap: section.gap,
      rowGap: section.rowGap,
      columnGap: section.columnGap,
      items,
    };
  });
  const previewUrl = publicPageUrl(loaded.handle);
  return {
    ok: true,
    previewUrl,
    publicUrl: previewUrl,
    layoutDebug,
    page: {
      ...summarizePageBundle(loaded.page, pageLinks),
      design,
    },
  };
}

export async function agentUpdateProfile(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const { page } = loaded;
  const db = getDb();
  const patch: Partial<typeof pages.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (typeof body.displayName === "string") {
    const name = displayNameSchema.safeParse(body.displayName);
    if (!name.success) {
      return err(name.error.issues[0]?.message ?? "Invalid displayName.");
    }
    patch.displayName = name.data;
    const initials = initialsFromName(name.data);
    patch.avatarText = initials;
    patch.avatarInitials = initials;
  }
  if (typeof body.bio === "string") {
    patch.bio = body.bio.slice(0, 280);
  }
  if (typeof body.theme === "string") {
    patch.theme = body.theme.slice(0, 32);
  }
  if (typeof body.accent === "string") {
    patch.accent = body.accent.slice(0, 32);
  }
  if (typeof body.isPublished === "boolean") {
    patch.published = body.isPublished;
    patch.isPublished = body.isPublished;
  }
  if (typeof body.published === "boolean") {
    patch.published = body.published;
    patch.isPublished = body.published;
  }

  await db.update(pages).set(patch).where(eq(pages.id, page.id));
  const fresh = (await getPageByHandle(loaded.handle)) ?? page;
  return { ok: true, page: await summarize(fresh) };
}

export async function agentUpsertLink(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const { page } = loaded;
  const db = getDb();
  const linkId =
    typeof body.linkId === "string" && body.linkId.trim()
      ? body.linkId.trim()
      : undefined;

  // --- Partial update (MCP editing): linkId only requires changed fields ---
  if (linkId) {
    const [existing] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.pageId, page.id)))
      .limit(1);
    if (!existing) return err("Link not found.", 404);

    const patch: Partial<typeof links.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.label === "string") {
      const label = body.label.trim().slice(0, 80);
      if (!label) return err("Invalid label.");
      patch.label = label;
    }
    if (body.url !== undefined) {
      const url = urlSchema.safeParse(body.url);
      if (!url.success) {
        return err(url.error.issues[0]?.message ?? "Invalid URL.");
      }
      patch.url = url.data;
    }
    if (typeof body.sublabel === "string") {
      patch.sublabel = body.sublabel.trim().slice(0, 160);
    } else if (body.sublabel === null) {
      patch.sublabel = "";
    }
    if (typeof body.featured === "boolean") {
      patch.featured = body.featured;
    }
    if (typeof body.isVisible === "boolean") {
      patch.visible = body.isVisible;
      patch.isVisible = body.isVisible;
    } else if (typeof body.visible === "boolean") {
      patch.visible = body.visible;
      patch.isVisible = body.visible;
    }
    if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
      patch.sortOrder = Math.max(0, Math.floor(body.sortOrder));
      patch.position = patch.sortOrder;
    }
    if (typeof body.span === "number" && Number.isFinite(body.span)) {
      patch.span = Math.min(3, Math.max(1, Math.floor(body.span)));
    }
    if (typeof body.mobileSpan === "number" && Number.isFinite(body.mobileSpan)) {
      patch.mobileSpan = Math.min(3, Math.max(1, Math.floor(body.mobileSpan)));
    }
    if (typeof body.variant === "string") {
      patch.variant = body.variant.trim().slice(0, 32) || "card";
    } else if (body.variant === null) {
      patch.variant = "card";
    }
    const layout = parseLinkLayout(body.layout ?? body.cardLayout);
    if (layout) patch.layout = layout;
    const iconPlacement = parseIconPlacement(body.iconPlacement);
    if (iconPlacement) patch.iconPlacement = iconPlacement;
    const iconSize = parseIconSize(body.iconSize);
    if (typeof iconSize === "number") patch.iconSize = iconSize;
    const section =
      typeof body.section === "string"
        ? body.section
        : typeof body.groupId === "string"
          ? body.groupId
          : undefined;
    if (typeof section === "string") {
      patch.section = section.trim().slice(0, 64);
    } else if (body.section === null || body.groupId === null) {
      patch.section = "";
    }
    if (body.iconKey !== undefined) {
      patch.iconKey =
        body.iconKey === null ? "" : coerceIconKey(body.iconKey);
    }
    if (body.iconUrl !== undefined) {
      if (body.iconUrl === null || body.iconUrl === "") {
        patch.iconUrl = "";
      } else if (typeof body.iconUrl === "string") {
        const safe = sanitizeHttpsUrl(body.iconUrl);
        if (!safe) return err("iconUrl은 https URL이어야 합니다.");
        patch.iconUrl = safe;
      }
    }
    if (body.iconImageUrl !== undefined) {
      if (body.iconImageUrl === null || body.iconImageUrl === "") {
        patch.iconImageUrl = "";
      } else if (typeof body.iconImageUrl === "string") {
        const safe = sanitizeHttpsUrl(body.iconImageUrl);
        if (!safe) return err("iconImageUrl은 https URL이어야 합니다.");
        patch.iconImageUrl = safe;
      }
    }
    if (body.leadingIconUrl !== undefined) {
      if (body.leadingIconUrl === null || body.leadingIconUrl === "") {
        patch.leadingIconUrl = "";
      } else if (typeof body.leadingIconUrl === "string") {
        const safe = sanitizeHttpsUrl(body.leadingIconUrl);
        if (!safe) return err("leadingIconUrl은 https URL이어야 합니다.");
        patch.leadingIconUrl = safe;
      }
    }
    if (body.leadingIcon !== undefined && body.leadingIconUrl === undefined) {
      if (body.leadingIcon === null || body.leadingIcon === "") {
        patch.leadingIconUrl = "";
      } else if (typeof body.leadingIcon === "string") {
        const safe = sanitizeHttpsUrl(body.leadingIcon);
        if (!safe) return err("leadingIcon은 https URL이어야 합니다.");
        patch.leadingIconUrl = safe;
      }
    }
    if (body.secondaryText !== undefined) {
      patch.secondaryText =
        body.secondaryText === null
          ? ""
          : typeof body.secondaryText === "string"
            ? body.secondaryText.trim().slice(0, 160)
            : "";
    }
    if (body.badge !== undefined) {
      patch.badge =
        body.badge === null
          ? ""
          : typeof body.badge === "string"
            ? body.badge.trim().slice(0, 24)
            : "";
    }
    if (typeof body.showArrow === "boolean") {
      patch.showArrow = body.showArrow;
    }
    if (typeof body.showDivider === "boolean") {
      patch.showDivider = body.showDivider;
    }
    const arrowStyle = parseArrowStyle(body.arrowStyle);
    if (arrowStyle) patch.arrowStyle = arrowStyle;
    const arrowPosition = parseArrowPosition(body.arrowPosition);
    if (arrowPosition) patch.arrowPosition = arrowPosition;
    if (body.trailingIcon !== undefined) {
      patch.trailingIcon =
        body.trailingIcon === null
          ? ""
          : typeof body.trailingIcon === "string"
            ? body.trailingIcon.trim().slice(0, 48)
            : "";
    }
    if (body.cardPadding !== undefined) {
      patch.cardPadding =
        body.cardPadding === null
          ? ""
          : typeof body.cardPadding === "string"
            ? body.cardPadding.trim().slice(0, 32)
            : "";
    }
    if (typeof body.cardMinHeight === "number" && Number.isFinite(body.cardMinHeight)) {
      patch.cardMinHeight = Math.min(480, Math.max(0, Math.floor(body.cardMinHeight)));
    }
    applyLinkVisualFields(patch, body);

    const keys = Object.keys(patch).filter((k) => k !== "updatedAt");
    if (keys.length === 0) {
      return err(
        "수정할 필드가 없습니다. iconKey/badge/span/variant/featured 등을 지정하세요.",
      );
    }

    await db
      .update(links)
      .set(patch)
      .where(and(eq(links.id, linkId), eq(links.pageId, page.id)));

    const fresh = (await getPageByHandle(loaded.handle)) ?? page;
    const previewUrl = publicPageUrl(loaded.handle);
    return {
      ok: true,
      updatedFields: keys,
      previewUrl,
      page: await summarize(fresh),
    };
  }

  // --- Create: label + url required ---
  const label =
    typeof body.label === "string" ? body.label.trim().slice(0, 80) : "";
  const url = urlSchema.safeParse(body.url);
  if (!label) return err("새 링크 생성 시 label이 필요합니다.");
  if (!url.success) {
    return err(url.error.issues[0]?.message ?? "Invalid URL.");
  }
  const sublabel =
    typeof body.sublabel === "string" ? body.sublabel.trim().slice(0, 160) : "";
  const featured = body.featured === true;
  const visible = body.isVisible !== false && body.visible !== false;

  const values: typeof links.$inferInsert = {
    pageId: page.id,
    label,
    sublabel,
    url: url.data,
    featured,
    visible,
    isVisible: visible,
    updatedAt: new Date(),
  };

  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    values.sortOrder = Math.max(0, Math.floor(body.sortOrder));
    values.position = values.sortOrder;
  }
  if (typeof body.span === "number" && Number.isFinite(body.span)) {
    values.span = Math.min(3, Math.max(1, Math.floor(body.span)));
  }
  if (typeof body.mobileSpan === "number" && Number.isFinite(body.mobileSpan)) {
    values.mobileSpan = Math.min(3, Math.max(1, Math.floor(body.mobileSpan)));
  }
  if (typeof body.variant === "string" && body.variant.trim()) {
    values.variant = body.variant.trim().slice(0, 32);
  }
  const layout = parseLinkLayout(body.layout ?? body.cardLayout);
  if (layout) values.layout = layout;
  const iconPlacement = parseIconPlacement(body.iconPlacement);
  if (iconPlacement) values.iconPlacement = iconPlacement;
  const iconSize = parseIconSize(body.iconSize);
  if (typeof iconSize === "number") values.iconSize = iconSize;
  const section =
    typeof body.section === "string"
      ? body.section
      : typeof body.groupId === "string"
        ? body.groupId
        : undefined;
  if (typeof section === "string") {
    values.section = section.trim().slice(0, 64);
  }
  if (body.iconKey !== undefined) {
    values.iconKey =
      body.iconKey === null ? "" : coerceIconKey(body.iconKey);
  }
  if (body.iconUrl !== undefined) {
    if (body.iconUrl === null || body.iconUrl === "") {
      values.iconUrl = "";
    } else if (typeof body.iconUrl === "string") {
      const safe = sanitizeHttpsUrl(body.iconUrl);
      if (!safe) return err("iconUrl은 https URL이어야 합니다.");
      values.iconUrl = safe;
    }
  }
  if (body.iconImageUrl !== undefined) {
    if (body.iconImageUrl === null || body.iconImageUrl === "") {
      values.iconImageUrl = "";
    } else if (typeof body.iconImageUrl === "string") {
      const safe = sanitizeHttpsUrl(body.iconImageUrl);
      if (!safe) return err("iconImageUrl은 https URL이어야 합니다.");
      values.iconImageUrl = safe;
    }
  }
  if (body.leadingIconUrl !== undefined) {
    if (body.leadingIconUrl === null || body.leadingIconUrl === "") {
      values.leadingIconUrl = "";
    } else if (typeof body.leadingIconUrl === "string") {
      const safe = sanitizeHttpsUrl(body.leadingIconUrl);
      if (!safe) return err("leadingIconUrl은 https URL이어야 합니다.");
      values.leadingIconUrl = safe;
    }
  }
  if (body.secondaryText !== undefined) {
    values.secondaryText =
      body.secondaryText === null
        ? ""
        : typeof body.secondaryText === "string"
          ? body.secondaryText.trim().slice(0, 160)
          : "";
  }
  if (body.badge !== undefined) {
    values.badge =
      body.badge === null
        ? ""
        : typeof body.badge === "string"
          ? body.badge.trim().slice(0, 24)
          : "";
  }
  if (typeof body.showArrow === "boolean") {
    values.showArrow = body.showArrow;
  }
  if (typeof body.showDivider === "boolean") {
    values.showDivider = body.showDivider;
  }
  const arrowStyle = parseArrowStyle(body.arrowStyle);
  if (arrowStyle) values.arrowStyle = arrowStyle;
  const arrowPosition = parseArrowPosition(body.arrowPosition);
  if (arrowPosition) values.arrowPosition = arrowPosition;
  if (body.trailingIcon !== undefined) {
    values.trailingIcon =
      body.trailingIcon === null
        ? ""
        : typeof body.trailingIcon === "string"
          ? body.trailingIcon.trim().slice(0, 48)
          : "";
  }
  if (body.cardPadding !== undefined) {
    values.cardPadding =
      body.cardPadding === null
        ? ""
        : typeof body.cardPadding === "string"
          ? body.cardPadding.trim().slice(0, 32)
          : "";
  }
  if (typeof body.cardMinHeight === "number" && Number.isFinite(body.cardMinHeight)) {
    values.cardMinHeight = Math.min(480, Math.max(0, Math.floor(body.cardMinHeight)));
  }
  applyLinkVisualFields(values, body);

  if (typeof values.sortOrder !== "number") {
    const [last] = await db
      .select({ sortOrder: links.sortOrder })
      .from(links)
      .where(eq(links.pageId, page.id))
      .orderBy(desc(links.sortOrder))
      .limit(1);
    const sortOrder = (last?.sortOrder ?? -1) + 1;
    values.sortOrder = sortOrder;
    values.position = sortOrder;
  }

  await db.insert(links).values({
    ...values,
    span: typeof values.span === "number" ? values.span : 1,
    variant: typeof values.variant === "string" ? values.variant : "card",
    section: typeof values.section === "string" ? values.section : "",
    iconKey: typeof values.iconKey === "string" ? values.iconKey : "",
    iconUrl: typeof values.iconUrl === "string" ? values.iconUrl : "",
    iconImageUrl:
      typeof values.iconImageUrl === "string" ? values.iconImageUrl : "",
    badge: typeof values.badge === "string" ? values.badge : "",
    mobileSpan: typeof values.mobileSpan === "number" ? values.mobileSpan : 1,
    layout: typeof values.layout === "string" ? values.layout : "horizontal",
    iconPlacement:
      typeof values.iconPlacement === "string" ? values.iconPlacement : "leading",
    iconSize: typeof values.iconSize === "number" ? values.iconSize : 20,
    showArrow: typeof values.showArrow === "boolean" ? values.showArrow : true,
    arrowStyle:
      typeof values.arrowStyle === "string" ? values.arrowStyle : "plain",
    arrowPosition:
      typeof values.arrowPosition === "string"
        ? values.arrowPosition
        : "trailing",
    showDivider:
      typeof values.showDivider === "boolean" ? values.showDivider : false,
    leadingIconUrl:
      typeof values.leadingIconUrl === "string" ? values.leadingIconUrl : "",
    secondaryText:
      typeof values.secondaryText === "string" ? values.secondaryText : "",
    trailingIcon:
      typeof values.trailingIcon === "string" ? values.trailingIcon : "",
    cardPadding: typeof values.cardPadding === "string" ? values.cardPadding : "",
    cardMinHeight:
      typeof values.cardMinHeight === "number" ? values.cardMinHeight : 0,
    cardHeight: typeof values.cardHeight === "number" ? values.cardHeight : 0,
    aspectRatio: typeof values.aspectRatio === "string" ? values.aspectRatio : "",
    rowSpan: typeof values.rowSpan === "number" ? values.rowSpan : 1,
    trailingText:
      typeof values.trailingText === "string" ? values.trailingText : "",
    subtitlePlacement:
      typeof values.subtitlePlacement === "string"
        ? values.subtitlePlacement
        : "body",
    objectFit: typeof values.objectFit === "string" ? values.objectFit : "",
    imageSize: typeof values.imageSize === "number" ? values.imageSize : 0,
    imagePosition:
      typeof values.imagePosition === "string" ? values.imagePosition : "",
    mobileCardMinHeight:
      typeof values.mobileCardMinHeight === "number"
        ? values.mobileCardMinHeight
        : 0,
    mobileCardHeight:
      typeof values.mobileCardHeight === "number" ? values.mobileCardHeight : 0,
    mobileCardPadding:
      typeof values.mobileCardPadding === "string"
        ? values.mobileCardPadding
        : "",
  });

  const fresh = (await getPageByHandle(loaded.handle)) ?? page;
  return {
    ok: true,
    previewUrl: publicPageUrl(loaded.handle),
    page: await summarize(fresh),
  };
}

export async function agentDeleteLink(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  if (typeof body.linkId !== "string" || !body.linkId) {
    return err("linkId required.");
  }
  await getDb()
    .delete(links)
    .where(and(eq(links.id, body.linkId), eq(links.pageId, loaded.page.id)));
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return { ok: true, page: await summarize(fresh) };
}

async function saveDesign(page: Page, design: PageDesign, extra?: Partial<typeof pages.$inferInsert>) {
  await getDb()
    .update(pages)
    .set({
      design,
      updatedAt: new Date(),
      ...extra,
    })
    .where(eq(pages.id, page.id));
}

export async function agentStartProfileWizard(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const wizard = startWizardState();
  const design = mergePageDesign(loaded.page.design, { wizard });
  await saveDesign(loaded.page, design);
  const step = WIZARD_STEPS[0]!;
  return {
    ok: true,
    wizard: {
      active: true,
      stepId: step.id,
      progress: wizardProgress(step.id),
      question: step.question,
      hint: step.hint,
      choices: step.choices,
    },
    instruction: wizardInstruction(step),
    page: await summarize((await getPageByHandle(loaded.handle)) ?? loaded.page),
  };
}

export async function agentGetProfileWizardStatus(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const design = parsePageDesign(loaded.page.design);
  const wizard = design.wizard;
  if (!wizard?.active) {
    return {
      ok: true,
      wizard: { active: false },
      instruction:
        "프로필생성도우미가 꺼져 있습니다. start_profile_wizard를 호출하세요.",
    };
  }
  const step = getWizardStep(wizard.stepId) ?? WIZARD_STEPS[0]!;
  return {
    ok: true,
    wizard: {
      active: true,
      stepId: step.id,
      answers: wizard.answers,
      progress: wizardProgress(step.id),
      question: step.question,
      hint: step.hint,
      choices: step.choices,
    },
    instruction: wizardInstruction(step),
  };
}

export async function agentAnswerProfileWizard(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const answerRaw = typeof body.answer === "string" ? body.answer : "";
  if (!answerRaw.trim()) return err("answer가 필요합니다.");

  let design = parsePageDesign(loaded.page.design);
  if (!design.wizard?.active) {
    const wizard = startWizardState();
    design = mergePageDesign(design, { wizard });
  }

  const step =
    getWizardStep(
      typeof body.stepId === "string" && body.stepId
        ? body.stepId
        : design.wizard!.stepId,
    ) ?? null;
  if (!step) return err("알 수 없는 wizard stepId 입니다.");

  const normalized = normalizeWizardAnswer(step, answerRaw);
  if (!normalized.ok) return err(normalized.error);

  const answers = {
    ...(design.wizard?.answers ?? {}),
    [step.field]: normalized.value,
  };
  const applied: Record<string, unknown> = { [step.field]: normalized.value };
  const db = getDb();
  const pagePatch: Partial<typeof pages.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (step.id === "displayName" && normalized.value) {
    pagePatch.displayName = normalized.value;
    const initials = initialsFromName(normalized.value);
    pagePatch.avatarText = initials;
    pagePatch.avatarInitials = initials;
  }
  if (step.id === "bio") {
    pagePatch.bio = normalized.value;
  }
  if (step.id === "template" && normalized.value) {
    const template = getDesignTemplate(normalized.value);
    if (!template) return err("템플릿을 찾을 수 없습니다.");
    design = {
      ...applyTemplateToDesign(template, {
        keepAvatar: true,
        keepBackground: true,
        current: design,
      }),
      wizard: design.wizard,
    };
    pagePatch.theme = template.theme;
    pagePatch.accent = template.accent;
    applied.theme = template.theme;
    applied.accent = template.accent;
    applied.templateId = template.id;
  }
  if (step.id === "accent" && normalized.value) {
    pagePatch.accent = normalized.value.slice(0, 32);
  }
  if (step.id === "avatar") {
    design = mergePageDesign(design, {
      avatarImageUrl: normalized.value || undefined,
    });
    if (!normalized.value) {
      design = { ...design, avatarImageUrl: undefined };
      delete design.avatarImageUrl;
    }
  }
  if (step.id === "firstLink" && normalized.value) {
    const parsed = parseFirstLinkAnswer(normalized.value);
    if (!parsed.skip && "label" in parsed && parsed.label && parsed.url) {
      const [last] = await db
        .select({ sortOrder: links.sortOrder })
        .from(links)
        .where(eq(links.pageId, loaded.page.id))
        .orderBy(desc(links.sortOrder))
        .limit(1);
      const sortOrder = (last?.sortOrder ?? -1) + 1;
      await db.insert(links).values({
        pageId: loaded.page.id,
        label: parsed.label,
        sublabel: "",
        url: parsed.url,
        featured: true,
        visible: true,
        isVisible: true,
        sortOrder,
        position: sortOrder,
      });
      applied.link = { label: parsed.label, url: parsed.url };
    }
  }
  if (step.id === "publish") {
    const published = normalized.value !== "no";
    pagePatch.published = published;
    pagePatch.isPublished = published;
    applied.published = published;
  }

  const nextStepId = nextWizardStepId(step.id);
  if (nextStepId) {
    design = mergePageDesign(design, {
      wizard: { active: true, stepId: nextStepId, answers },
    });
    pagePatch.design = design;
    await db.update(pages).set(pagePatch).where(eq(pages.id, loaded.page.id));
    const nextStep = getWizardStep(nextStepId)!;
    return {
      ok: true,
      done: false,
      applied,
      wizard: {
        active: true,
        stepId: nextStep.id,
        progress: wizardProgress(nextStep.id),
        question: nextStep.question,
        hint: nextStep.hint,
        choices: nextStep.choices,
      },
      instruction: wizardInstruction(nextStep),
      page: await summarize(
        (await getPageByHandle(loaded.handle)) ?? loaded.page,
      ),
    };
  }

  design = mergePageDesign(design, {
    wizard: { active: false, stepId: step.id, answers },
  });
  pagePatch.design = design;
  await db.update(pages).set(pagePatch).where(eq(pages.id, loaded.page.id));
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    done: true,
    applied,
    summary: `프로필 생성이 완료되었습니다. 공개 페이지: /${fresh.handle}`,
    instruction:
      "사용자에게 완료를 알리고 공개 페이지 URL을 안내하세요. 추가 수정은 update_profile / apply_design_template / set_avatar_image / set_custom_css 를 사용하세요.",
    page: await summarize(fresh),
  };
}

export function agentListDesignTemplates(): AgentResult {
  return { ok: true, templates: listDesignTemplates() };
}

export async function agentApplyDesignTemplate(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const templateId = typeof body.templateId === "string" ? body.templateId : "";
  const template = getDesignTemplate(templateId);
  if (!template) {
    return err(
      `알 수 없는 templateId. 사용 가능: ${listDesignTemplates()
        .map((t) => t.id)
        .join(", ")}`,
    );
  }
  const current = parsePageDesign(loaded.page.design);
  const design = applyTemplateToDesign(template, {
    keepAvatar: body.keepAvatar !== false,
    keepBackground: body.keepBackground !== false,
    current,
  });
  await getDb()
    .update(pages)
    .set({
      theme: template.theme,
      accent:
        typeof body.accent === "string" && body.accent.trim()
          ? body.accent.trim().slice(0, 32)
          : template.accent,
      design,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, loaded.page.id));
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    template: { id: template.id, name: template.name },
    page: {
      ...(await summarize(fresh)),
      design: parsePageDesign(fresh.design),
    },
  };
}

export async function agentSetAvatarImage(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const clear = body.clear === true || body.imageUrl === null;
  let avatarImageUrl: string | undefined;
  if (!clear) {
    const raw = typeof body.imageUrl === "string" ? body.imageUrl : "";
    avatarImageUrl = sanitizeHttpsUrl(raw);
    if (!avatarImageUrl) return err("https 이미지 URL이 필요합니다.");
  }
  const design = parsePageDesign(loaded.page.design);
  if (clear) {
    delete design.avatarImageUrl;
  } else {
    design.avatarImageUrl = avatarImageUrl;
  }
  await saveDesign(loaded.page, design);
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    design: parsePageDesign(fresh.design),
    page: await summarize(fresh),
  };
}

export async function agentSetBackgroundImage(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const clear = body.clear === true || body.imageUrl === null;
  let backgroundImageUrl: string | undefined;
  if (!clear) {
    const raw = typeof body.imageUrl === "string" ? body.imageUrl : "";
    backgroundImageUrl = sanitizeHttpsUrl(raw);
    if (!backgroundImageUrl) return err("https 이미지 URL이 필요합니다.");
  }
  const design = parsePageDesign(loaded.page.design);
  if (clear) {
    delete design.backgroundImageUrl;
  } else {
    design.backgroundImageUrl = backgroundImageUrl;
  }
  if (typeof body.scrim === "number" && Number.isFinite(body.scrim)) {
    design.scrim = Math.min(0.85, Math.max(0, body.scrim));
  }
  await saveDesign(loaded.page, design);
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    design: parsePageDesign(fresh.design),
    page: await summarize(fresh),
  };
}

export async function agentSetCustomCss(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const design = parsePageDesign(loaded.page.design);
  if (body.clear === true || body.css === null) {
    delete design.customCss;
  } else {
    const raw = typeof body.css === "string" ? body.css : "";
    try {
      const css = sanitizeCustomCss(raw);
      if (!css) return err("css가 비어 있습니다. 제거하려면 clear=true.");
      design.customCss = css;
    } catch (e) {
      return err(e instanceof Error ? e.message : "Invalid CSS.");
    }
  }
  await saveDesign(loaded.page, design);
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    design: parsePageDesign(fresh.design),
    page: await summarize(fresh),
  };
}

export async function agentUpdateDesign(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const patch: Partial<PageDesign> = {};
  const keys = [
    "layout",
    "pattern",
    "motion",
    "effect",
    "card",
    "buttonStyle",
    "buttonShadow",
    "buttonFill",
    "buttonText",
    "featuredFill",
    "featuredText",
    "featuredBorder",
    "size",
    "radius",
    "font",
    "effectCard",
  ] as const;
  for (const key of keys) {
    if (typeof body[key] === "string") {
      (patch as Record<string, string>)[key] = body[key] as string;
    }
  }
  if (body.buttonFill === null) patch.buttonFill = undefined;
  if (body.buttonText === null) patch.buttonText = undefined;
  if (body.featuredFill === null) patch.featuredFill = undefined;
  if (body.featuredText === null) patch.featuredText = undefined;
  if (body.featuredBorder === null) patch.featuredBorder = undefined;
  if (typeof body.scrim === "number") patch.scrim = body.scrim;
  if (typeof body.templateId === "string") patch.templateId = body.templateId;
  if (body.showHandle === false) patch.showHandle = false;
  if (body.showHandle === true) patch.showHandle = true;
  if (body.showAvatar === false) patch.showAvatar = false;
  if (body.showAvatar === true) patch.showAvatar = true;

  if (body.tokens && typeof body.tokens === "object" && !Array.isArray(body.tokens)) {
    patch.tokens = body.tokens as PageDesign["tokens"];
  }
  if (Array.isArray(body.sections)) {
    patch.sections = body.sections as PageDesign["sections"];
  }
  if (Array.isArray(body.proofItems)) {
    patch.proofItems = body.proofItems as PageDesign["proofItems"];
  } else if (body.proofItems === null) {
    patch.proofItems = [];
  }
  const logoInput =
    body.logoUrl ?? body.brandLogoUrl ?? body.logoImageUrl;
  if (typeof logoInput === "string") {
    patch.logoUrl = logoInput;
    patch.logoImageUrl = logoInput;
  } else if (
    body.logoUrl === null ||
    body.brandLogoUrl === null ||
    body.logoImageUrl === null
  ) {
    patch.logoUrl = undefined;
    patch.logoImageUrl = undefined;
  }
  if (typeof body.logoWidth === "number" && Number.isFinite(body.logoWidth)) {
    patch.logoWidth = Math.min(480, Math.max(24, Math.floor(body.logoWidth)));
  }
  if (typeof body.logoHeight === "number" && Number.isFinite(body.logoHeight)) {
    patch.logoHeight = Math.min(240, Math.max(16, Math.floor(body.logoHeight)));
  }
  if (typeof body.logoAlign === "string") {
    patch.logoAlign = body.logoAlign as PageDesign["logoAlign"];
  }
  if (
    typeof body.contentMaxWidth === "number" &&
    Number.isFinite(body.contentMaxWidth)
  ) {
    patch.contentMaxWidth = Math.min(
      960,
      Math.max(320, Math.floor(body.contentMaxWidth)),
    );
  }
  if (typeof body.headline === "string") {
    patch.headline = body.headline;
  } else if (body.headline === null) {
    patch.headline = undefined;
  }
  if (typeof body.headlineHighlight === "string") {
    patch.headlineHighlight = body.headlineHighlight;
  } else if (body.headlineHighlight === null) {
    patch.headlineHighlight = undefined;
  }
  if (Array.isArray(body.headlineSegments)) {
    patch.headlineSegments =
      body.headlineSegments as PageDesign["headlineSegments"];
  } else if (body.headlineSegments === null) {
    patch.headlineSegments = [];
  }
  if (typeof body.headerAlign === "string") {
    patch.headerAlign = body.headerAlign as PageDesign["headerAlign"];
  }
  if (typeof body.heroGraphic === "string") {
    patch.heroGraphic = body.heroGraphic as PageDesign["heroGraphic"];
  }
  if (typeof body.heroGraphicUrl === "string") {
    patch.heroGraphicUrl = body.heroGraphicUrl;
  } else if (body.heroGraphicUrl === null) {
    patch.heroGraphicUrl = undefined;
  }
  if (typeof body.heroImageUrl === "string") {
    patch.heroGraphicUrl = body.heroImageUrl;
    patch.heroImageUrl = body.heroImageUrl;
  } else if (body.heroImageUrl === null) {
    patch.heroGraphicUrl = undefined;
    patch.heroImageUrl = undefined;
  }
  if (
    typeof body.heroGraphicSize === "number" &&
    Number.isFinite(body.heroGraphicSize)
  ) {
    patch.heroGraphicSize = Math.min(
      240,
      Math.max(24, Math.floor(body.heroGraphicSize)),
    );
  }
  if (typeof body.heroGraphicPosition === "string") {
    patch.heroGraphicPosition =
      body.heroGraphicPosition as PageDesign["heroGraphicPosition"];
  }

  let design: PageDesign;
  try {
    design = mergePageDesign(loaded.page.design, patch);
    if (patch.tokens) {
      design.tokens = parsePageDesign({ tokens: patch.tokens }).tokens;
    }
    if (patch.sections) {
      design.sections = parsePageDesign({ sections: patch.sections }).sections;
    }
    if (patch.proofItems) {
      design.proofItems = parsePageDesign({
        proofItems: patch.proofItems,
      }).proofItems;
    } else if (body.proofItems === null) {
      delete design.proofItems;
    }
    if (patch.headlineSegments) {
      design.headlineSegments = parsePageDesign({
        headlineSegments: patch.headlineSegments,
      }).headlineSegments;
    } else if (body.headlineSegments === null) {
      delete design.headlineSegments;
    }
    if (
      body.logoUrl === null ||
      body.brandLogoUrl === null ||
      body.logoImageUrl === null
    ) {
      delete design.logoUrl;
      delete design.logoImageUrl;
    }
    if (body.headline === null) delete design.headline;
    if (body.headlineHighlight === null) delete design.headlineHighlight;
    if (body.heroGraphicUrl === null) delete design.heroGraphicUrl;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Invalid design.");
  }

  const pagePatch: Partial<typeof pages.$inferInsert> = {
    design,
    updatedAt: new Date(),
  };
  if (typeof body.theme === "string") {
    pagePatch.theme = body.theme.slice(0, 32);
  }
  if (typeof body.accent === "string") {
    pagePatch.accent = body.accent.slice(0, 32);
  }

  await getDb().update(pages).set(pagePatch).where(eq(pages.id, loaded.page.id));
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    design: parsePageDesign(fresh.design),
    previewUrl: publicPageUrl(loaded.handle),
    page: await summarize(fresh),
  };
}

export async function agentUpsertSection(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;

  if (body.clear === true) {
    const design = parsePageDesign(loaded.page.design);
    delete design.sections;
    await saveDesign(loaded.page, design);
    const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
    return { ok: true, design: parsePageDesign(fresh.design), page: await summarize(fresh) };
  }

  const section = parseDesignSection(body);
  if (!section) {
    return err(
      "section id가 필요합니다. 예: { id, title, columns, mobileColumns, items, order }",
    );
  }

  const design = parsePageDesign(loaded.page.design);
  const current = [...(design.sections ?? [])];
  const idx = current.findIndex((s) => s.id === section.id);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...section };
  } else {
    current.push(section);
  }
  current.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  design.sections = current;
  await saveDesign(loaded.page, design);
  const fresh = (await getPageByHandle(loaded.handle)) ?? loaded.page;
  return {
    ok: true,
    sections: parsePageDesign(fresh.design).sections,
    design: parsePageDesign(fresh.design),
    previewUrl: publicPageUrl(loaded.handle),
    page: await summarize(fresh),
  };
}

export async function agentUploadAsset(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;

  const purpose =
    typeof body.purpose === "string" ? body.purpose.trim().slice(0, 32) : "general";
  let parsed:
    | { mimeType: string; buffer: Buffer }
    | null = null;

  if (typeof body.dataUri === "string" && body.dataUri.trim()) {
    parsed = parseDataUri(body.dataUri);
    if (!parsed) {
      return err(
        "dataUri 형식이 올바르지 않거나 지원하지 않는 이미지입니다. data:image/png;base64,...",
      );
    }
  } else if (typeof body.base64 === "string" && body.base64.trim()) {
    parsed = parseBase64Payload(
      body.base64,
      typeof body.mimeType === "string" ? body.mimeType : undefined,
    );
    if (!parsed) {
      return err("base64 이미지 디코딩 실패 또는 용량/형식 오류 (최대 1.5MB).");
    }
  } else if (typeof body.file === "string" && body.file.trim()) {
    // MCP clients may send file as dataUri in `file`
    parsed = parseDataUri(body.file) || parseBase64Payload(body.file, "image/png");
    if (!parsed) {
      return err("file은 dataUri 또는 base64 문자열이어야 합니다.");
    }
  } else {
    return err("dataUri | base64 | file 중 하나가 필요합니다.");
  }

  try {
    const asset = await storePageAsset({
      pageId: loaded.page.id,
      mimeType: parsed.mimeType,
      buffer: parsed.buffer,
      purpose,
    });
    return {
      ok: true,
      asset,
      httpsUrl: asset.url,
      url: asset.url,
      previewUrl: publicPageUrl(loaded.handle),
      note:
        "반환된 httpsUrl을 logoImageUrl / iconImageUrl / heroImageUrl / leadingIconUrl 에 넣으세요.",
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : "자산 업로드 실패");
  }
}

export async function agentGetPreviewUrl(
  auth: Extract<McpAuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  const loaded = await loadScopedPage(auth, body.handle);
  if (!loaded.ok) return loaded;
  const base =
    typeof body.baseUrl === "string" && body.baseUrl.trim()
      ? body.baseUrl.trim().replace(/\/$/, "")
      : siteOrigin();
  const url = publicPageUrl(loaded.handle, base);
  return {
    ok: true,
    handle: loaded.handle,
    previewUrl: url,
    publicUrl: url,
    note:
      "변경 후 이 URL을 새로고침해 확인하세요. 스크린샷 렌더는 아직 제공하지 않습니다 (get_preview_url).",
  };
}

/** Catalog of MCP-editable design/link fields — for agents, not page mutation. */
export async function agentListDesignCapabilities(): Promise<AgentResult> {
  return {
    ok: true,
    purpose:
      "페이지 디자인은 MCP 도구로 수정합니다. 이 목록은 편집 가능한 필드와 권장 워크플로입니다.",
    workflow: [
      "1) get_page 로 현재 design/links 확인",
      "2) list_design_capabilities 로 필드·아이콘 키 확인 (필요 시)",
      "3) update_design 으로 색/헤드라인/통계바/섹션 골격 설정",
      "4) upsert_section 으로 섹션 title/columns/items/gap 조정 (템플릿 nth-child 자동확장 없음)",
      "5) upsert_link(linkId + span/colSpan:1 등) 로 그리드·아이콘·CTA 슬롯 부분 수정",
      "6) upload_asset(dataUri) → httpsUrl 을 logoImageUrl/iconImageUrl/heroImageUrl에 연결",
      "7) get_page.layoutDebug 로 저장 span vs 계산 span 확인 후 get_preview_url 새로고침",
    ],
    designFields: {
      theme: "fairway|noir|aurora|bento|brutal|editorial|terminal|paper 등",
      accent: "CSS 색상 (예: #C9F232)",
      layout: "stack|bento|list",
      buttonStyle: "solid|soft|outline|ghost|glass|elevated|sticker",
      buttonFill: "일반 카드 배경 (featured 제외)",
      buttonText: "일반 카드 글자색",
      featuredFill: "CTA(featured) 배경만",
      featuredText: "CTA 글자색",
      featuredBorder: "CTA 테두리",
      tokens: {
        pageBackground: "페이지 배경",
        cardBackground: "카드 배경",
        cardText: "카드 글자",
        mutedText: "보조 글자",
        featuredBackground: "CTA 배경 토큰",
        featuredText: "CTA 글자 토큰",
        borderColor: "테두리",
      },
      proofItems: "[{ value, label }] 헤더 통계 바 (null이면 제거)",
      logoUrl: "브랜드 로고 https URL (null이면 제거)",
      brandLogoUrl: "logoUrl 별칭",
      logoImageUrl: "logoUrl 별칭 (워드마크 SVG/PNG)",
      logoWidth: "로고 너비 px",
      logoHeight: "로고 높이 px",
      logoAlign: "center|left|right",
      contentMaxWidth: "콘텐츠 폭 px (예: 765)",
      headline: "헤드라인 문자열",
      headlineHighlight: "headline 안에서 accent 강조할 부분",
      headlineSegments: "[{ text, accent?, breakAfter? }] 줄바꿈/강조 세그먼트",
      headerAlign: "center|left",
      heroGraphic: "none|golf",
      heroGraphicUrl: "커스텀 히어로 이미지 https",
      heroGraphicSize: "히어로 그래픽 px",
      heroGraphicPosition: "right|left|below|above",
      showHandle: "boolean",
      showAvatar: "boolean",
      sections: "upsert_section 또는 update_design.sections (mobileColumns 지원)",
      customCss:
        "set_custom_css — 8000자 초과 시 오류(절단 없음). [data-role=page-root] 기준",
      heroImageUrl: "heroGraphicUrl 별칭",
    },
    linkFields: {
      linkId: "부분 수정 시 필수. label/url 없이 필드만 패치 가능",
      label: "제목 (신규 생성 시 필수)",
      url: "URL (신규 생성 시 필수)",
      sublabel: "설명",
      secondaryText: "CTA 보조문구 (sublabel 대체 가능)",
      featured: "true면 CTA 역할 (featuredFill 적용)",
      iconKey: "내장 아이콘 키",
      iconUrl: "커스텀 아이콘 https (iconKey보다 우선)",
      iconImageUrl: "링크별 이미지 아이콘 https (SVG/PNG 권장)",
      leadingIconUrl: "CTA 전용 leading 아이콘 https",
      iconSize: "12~96 px",
      iconPlacement: "leading|top|trailing",
      badge: "카드 배지 텍스트 (예: 대표 서비스)",
      span: "1|2|3 — 그리드 가로 점유. featured여도 자동 확장하지 않음",
      colSpan: "span 별칭",
      rowSpan: "1|2|3",
      mobileSpan: "1|2|3",
      cardHeight: "카드 고정 높이 px",
      minHeight: "cardMinHeight 별칭",
      aspectRatio: "CSS aspect-ratio (예: 1/1)",
      trailingText: "CTA 우측 문구",
      subtitlePlacement: "body|trailing",
      objectFit: "contain|cover (아이콘 이미지)",
      imageSize: "아이콘 이미지 px",
      imagePosition: "top|leading|trailing",
      leadingIcon: "leadingIconUrl 별칭",
      showArrow: "우측 화살표",
      arrowStyle: "plain|circle",
      arrowPosition: "trailing|top-right|end",
      showDivider: "CTA 세로 구분선",
      cardPadding: "패딩 문자열",
      variant: "card|full|spotlight",
    },
    tools: {
      upload_asset: "dataUri|base64 → httpsUrl (/api/assets/:id)",
      get_page: "layoutDebug 포함 — 저장 span vs 계산 span",
      get_preview_url: "공개 Preview URL 반환",
    },
    designExtras: {
      heroImageUrl: "heroGraphicUrl 별칭",
      sectionGaps: "gap|rowGap|columnGap|mobileGap",
      customCss:
        "set_custom_css — 8000자 초과 시 절단하지 않고 오류",
    },
    rendererDataRoles: {
      "page-root": "[data-role='page-root']",
      "section-id": "[data-section-id]",
      "link-id": "[data-link-id]",
      "display-name": "[data-role='display-name']",
      headline: "[data-role='headline']",
      "proof-strip": "[data-role='proof-strip']",
      section: "[data-role='section']",
      card: "a[data-role='card'|'cta-card']",
      "link-icon": "[data-role='link-icon']",
      "link-content": "[data-role='link-content']",
      "link-title": "[data-role='link-title']",
      "link-sublabel": "[data-role='link-sublabel']",
      "link-trailing-text": "[data-role='link-trailing-text']",
      "link-arrow": "[data-role='link-arrow']",
      badge: "[data-role='badge']",
      divider: "[data-role='divider']",
    },
    recipes: {
      brandWordmarkAndHeadline:
        "upload_asset → update_design({ contentMaxWidth:765, logoImageUrl, headlineSegments, heroGraphic:'golf', proofItems, showHandle:false, showAvatar:false })",
      ctaBar:
        "update_design({ featuredFill, featuredText }) + upsert_link({ linkId, featured:true, leadingIconUrl, secondaryText, trailingText, showDivider:true, subtitlePlacement:'trailing', showArrow:true, arrowStyle:'circle', span:2 })",
      twoByTwoServices:
        "upsert_section({ id, title, columns:2, mobileColumns:2, gap:12, items:[...] }) + 각 링크 upsert_link({ linkId, span:1, mobileSpan:1, iconImageUrl, minHeight:140 }) — 빈칸/자동 전체폭 없음",
      shortcutsRow:
        "upsert_section({ id, title, columns:1, items:[...] }) + 각 링크 iconImageUrl/iconKey",
    },
    icons: [...LINK_ICON_KEYS],
    note: "페이지 콘텐츠를 임의로 바꾸지 말고, 사용자가 요청한 수정만 MCP 도구로 적용하세요.",
  };
}

export async function runAgentAction(
  auth: Extract<McpAuthResult, { ok: true }>,
  action: string,
  body: Record<string, unknown>,
): Promise<AgentResult> {
  switch (action) {
    case "health":
      return agentHealth(auth);
    case "page":
    case "get_page":
      return agentGetPage(auth, body.handle);
    case "update_profile":
      return agentUpdateProfile(auth, body);
    case "upsert_link":
      return agentUpsertLink(auth, body);
    case "delete_link":
      return agentDeleteLink(auth, body);
    case "list_design_capabilities":
      return agentListDesignCapabilities();
    case "start_profile_wizard":
      return agentStartProfileWizard(auth, body);
    case "answer_profile_wizard":
      return agentAnswerProfileWizard(auth, body);
    case "get_profile_wizard_status":
      return agentGetProfileWizardStatus(auth, body);
    case "list_design_templates":
      return agentListDesignTemplates();
    case "apply_design_template":
      return agentApplyDesignTemplate(auth, body);
    case "set_avatar_image":
      return agentSetAvatarImage(auth, body);
    case "set_background_image":
      return agentSetBackgroundImage(auth, body);
    case "set_custom_css":
      return agentSetCustomCss(auth, body);
    case "update_design":
      return agentUpdateDesign(auth, body);
    case "upsert_section":
      return agentUpsertSection(auth, body);
    case "upload_asset":
      return agentUploadAsset(auth, body);
    case "get_preview_url":
      return agentGetPreviewUrl(auth, body);
    default:
      return err(`Unknown action: ${action}`);
  }
}
