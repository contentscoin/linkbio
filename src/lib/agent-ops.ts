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
import {
  mergePageDesign,
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
      "start_profile_wizard",
      "answer_profile_wizard",
      "get_profile_wizard_status",
      "list_design_templates",
      "apply_design_template",
      "set_avatar_image",
      "set_background_image",
      "set_custom_css",
      "update_design",
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

  const label =
    typeof body.label === "string" ? body.label.trim().slice(0, 80) : "";
  const url = urlSchema.safeParse(body.url);
  if (!label) return err("Invalid label.");
  if (!url.success) {
    return err(url.error.issues[0]?.message ?? "Invalid URL.");
  }
  const sublabel =
    typeof body.sublabel === "string" ? body.sublabel.trim().slice(0, 160) : "";
  const featured = body.featured === true;
  const visible = body.isVisible !== false && body.visible !== false;

  if (typeof body.linkId === "string" && body.linkId) {
    await db
      .update(links)
      .set({
        label,
        sublabel,
        url: url.data,
        featured,
        visible,
        isVisible: visible,
        updatedAt: new Date(),
      })
      .where(and(eq(links.id, body.linkId), eq(links.pageId, page.id)));
  } else {
    const [last] = await db
      .select({ sortOrder: links.sortOrder })
      .from(links)
      .where(eq(links.pageId, page.id))
      .orderBy(desc(links.sortOrder))
      .limit(1);
    const sortOrder = (last?.sortOrder ?? -1) + 1;
    await db.insert(links).values({
      pageId: page.id,
      label,
      sublabel,
      url: url.data,
      featured,
      visible,
      isVisible: visible,
      sortOrder,
      position: sortOrder,
    });
  }

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
  if (typeof body.scrim === "number") patch.scrim = body.scrim;
  if (typeof body.templateId === "string") patch.templateId = body.templateId;

  let design: PageDesign;
  try {
    design = mergePageDesign(loaded.page.design, patch);
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
    default:
      return err(`Unknown action: ${action}`);
  }
}
