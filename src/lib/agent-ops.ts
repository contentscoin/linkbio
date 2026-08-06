import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { links, pages, type Page } from "@/db/schema";
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
import { publicPageUrl, siteOrigin } from "@/lib/site-url";
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
  return {
    ok: true,
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
    if (typeof body.variant === "string") {
      patch.variant = body.variant.trim().slice(0, 32) || "card";
    } else if (body.variant === null) {
      patch.variant = "card";
    }
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
    if (body.badge !== undefined) {
      patch.badge =
        body.badge === null
          ? ""
          : typeof body.badge === "string"
            ? body.badge.trim().slice(0, 24)
            : "";
    }

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
    return { ok: true, updatedFields: keys, page: await summarize(fresh) };
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
  if (typeof body.variant === "string" && body.variant.trim()) {
    values.variant = body.variant.trim().slice(0, 32);
  }
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
  if (body.badge !== undefined) {
    values.badge =
      body.badge === null
        ? ""
        : typeof body.badge === "string"
          ? body.badge.trim().slice(0, 24)
          : "";
  }

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
    badge: typeof values.badge === "string" ? values.badge : "",
  });

  const fresh = (await getPageByHandle(loaded.handle)) ?? page;
  return { ok: true, page: await summarize(fresh) };
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
  if (typeof body.logoUrl === "string") {
    patch.logoUrl = body.logoUrl;
  } else if (body.logoUrl === null) {
    patch.logoUrl = undefined;
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
  if (typeof body.headerAlign === "string") {
    patch.headerAlign = body.headerAlign as PageDesign["headerAlign"];
  }
  if (typeof body.heroGraphic === "string") {
    patch.heroGraphic = body.heroGraphic as PageDesign["heroGraphic"];
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
    if (body.logoUrl === null) delete design.logoUrl;
    if (body.headline === null) delete design.headline;
    if (body.headlineHighlight === null) delete design.headlineHighlight;
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
    return err("section id가 필요합니다. 예: { id, title, columns, items, order }");
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
    page: await summarize(fresh),
  };
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
      "4) upsert_section 으로 섹션 title/columns/items 조정",
      "5) upsert_link(linkId + 변경 필드만) 로 아이콘·배지·span·variant·featured 부분 수정",
      "6) get_preview_url 후 공개 URL 새로고침으로 확인",
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
      headline: "헤드라인 문자열",
      headlineHighlight: "headline 안에서 accent 강조할 부분",
      headerAlign: "center|left",
      heroGraphic: "none|golf",
      showHandle: "boolean",
      showAvatar: "boolean",
      sections: "upsert_section 또는 update_design.sections",
      customCss: "set_custom_css (최후 수단)",
    },
    linkFields: {
      linkId: "부분 수정 시 필수. label/url 없이 필드만 패치 가능",
      label: "제목 (신규 생성 시 필수)",
      url: "URL (신규 생성 시 필수)",
      sublabel: "설명",
      featured: "true면 라임 CTA 역할 (featuredFill 적용)",
      iconKey: "내장 아이콘 키",
      iconUrl: "커스텀 아이콘 https (iconKey보다 우선)",
      badge: "카드 배지 텍스트 (예: 대표 서비스)",
      span: "1|2|3 — 그리드에서 가로 점유. 2면 한 줄 전체",
      variant: "card|full|spotlight|featured",
      section: "섹션/그룹 id",
      sortOrder: "정렬 순서",
      isVisible: "노출 여부",
    },
    icons: [...LINK_ICON_KEYS],
    variants: {
      card: "기본 그리드/리스트 카드",
      full: "한 줄 전체 너비 (span:2와 유사)",
      spotlight: "강조 카드 (흰 배경+액센트 테두리, badge와 함께 사용)",
      featured: "링크 featured:true 권장 — CTA 색상 토큰 사용",
    },
    layoutRecipes: {
      "헤더+통계바":
        "update_design({ headline, headlineHighlight, heroGraphic:'golf', proofItems, showHandle:false, showAvatar:false })",
      "라임 CTA":
        "update_design({ featuredFill, featuredText }) + upsert_link({ linkId, featured:true, iconKey:'chat', span:2 })",
      "2열+일부전체":
        "upsert_section({ id, title, columns:2, items:[...] }) + 전체폭 링크는 upsert_link({ linkId, span:2 })",
      "1열 바로가기":
        "upsert_section({ id, title, columns:1, items:[...] }) + 각 링크 iconKey",
    },
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
    case "get_preview_url":
      return agentGetPreviewUrl(auth, body);
    default:
      return err(`Unknown action: ${action}`);
  }
}
