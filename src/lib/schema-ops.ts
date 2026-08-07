import type { PageDesign } from "@/lib/page-design";
import { parsePageDesign } from "@/lib/page-design";
import {
  type PageSchema,
  type PageValidationIssue,
  type PageVersionSnapshot,
  type SchemaSection,
  flattenSchemaLinks,
  parsePageSchema,
  schemaToDesignPatch,
  validatePageSchema,
} from "@/lib/page-schema";
import {
  cloneTemplateSchema,
  getSchemaTemplate,
  listSchemaTemplates,
} from "@/lib/schema-templates";

export type DesignWithSchema = PageDesign & {
  pageSchema?: PageSchema | null;
  pageSchemaDraft?: PageSchema | null;
  schemaVersions?: PageVersionSnapshot[];
  publishedSchemaVersionId?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nowIso() {
  return new Date().toISOString();
}

function versionId() {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptySchema(): PageSchema {
  return (
    cloneTemplateSchema("minimal-link") ?? {
      version: 1,
      templateId: "minimal-link",
      theme: "fairway",
      contentWidth: "mobile",
      sections: [],
    }
  );
}

export function getStoredSchema(design: unknown): PageSchema | null {
  const d = asRecord(design);
  return parsePageSchema(d.pageSchema ?? d.pageSchemaDraft);
}

export function getDraftSchema(design: unknown): PageSchema | null {
  const d = asRecord(design);
  return parsePageSchema(d.pageSchemaDraft) ?? parsePageSchema(d.pageSchema);
}

export function listTemplatesOp() {
  return {
    templates: listSchemaTemplates().map((t) => ({
      ...t,
      defaultTheme: t.theme,
      sectionTypes: getSchemaTemplate(t.id)?.schema.sections.map((s) => s.type) ?? [],
    })),
  };
}

export function getTemplateOp(templateId: string) {
  const t = getSchemaTemplate(templateId);
  if (!t) throw new Error(`Unknown template: ${templateId}`);
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    thumbnail: t.thumbnail,
    responsiveRules: t.responsiveRules,
    schema: t.schema,
    validation: validatePageSchema(t.schema),
  };
}

export function createPageFromTemplateOp(input: {
  templateId: string;
  displayName?: string;
  headline?: string;
  theme?: string;
  logoUrl?: string;
}) {
  const schema = cloneTemplateSchema(input.templateId);
  if (!schema) throw new Error(`Unknown template: ${input.templateId}`);
  if (input.theme) schema.theme = input.theme;
  if (input.displayName || input.logoUrl) {
    schema.brand = {
      ...(schema.brand || {}),
      ...(input.displayName ? { displayName: input.displayName } : {}),
      ...(input.logoUrl ? { logoUrl: input.logoUrl } : {}),
    };
  }
  if (input.headline) {
    const hero = schema.sections.find((s) => s.type === "hero");
    if (hero && hero.type === "hero") {
      hero.headline = input.headline;
      delete hero.headlineSegments;
    }
  }
  return {
    schema,
    designPatch: schemaToDesignPatch(schema),
    links: flattenSchemaLinks(schema),
    validation: validatePageSchema(schema),
    message:
      "Template cloned. Call save_draft / publish_page / create_page_from_template(persist) to apply.",
  };
}

export function getPageSchemaOp(design: unknown) {
  const d = asRecord(design) as DesignWithSchema;
  const published = parsePageSchema(d.pageSchema);
  const draft = parsePageSchema(d.pageSchemaDraft);
  const active = draft ?? published;
  return {
    published,
    draft: active,
    versions: Array.isArray(d.schemaVersions)
      ? (d.schemaVersions as PageVersionSnapshot[]).map((v) => ({
          id: v.id,
          label: v.label,
          savedAt: v.savedAt,
          published: Boolean(v.published),
        }))
      : [],
    publishedSchemaVersionId: d.publishedSchemaVersionId ?? null,
    validation: active ? validatePageSchema(active) : ([] as PageValidationIssue[]),
  };
}

export function mergePageContent(
  current: PageSchema | null,
  content: Record<string, unknown>,
): PageSchema {
  const base = current ?? emptySchema();
  const next: PageSchema = {
    ...base,
    ...(typeof content.templateId === "string"
      ? { templateId: content.templateId.slice(0, 64) }
      : {}),
    ...(typeof content.theme === "string"
      ? { theme: content.theme.slice(0, 64) }
      : {}),
    ...(content.contentWidth !== undefined
      ? {
          contentWidth: content.contentWidth as PageSchema["contentWidth"],
        }
      : {}),
    brand:
      content.brand && typeof content.brand === "object"
        ? {
            ...(base.brand || {}),
            ...(content.brand as PageSchema["brand"]),
          }
        : base.brand,
    designOptions:
      content.designOptions && typeof content.designOptions === "object"
        ? {
            ...(base.designOptions || {}),
            ...(content.designOptions as PageSchema["designOptions"]),
          }
        : base.designOptions,
    sections: Array.isArray(content.sections)
      ? (content.sections as SchemaSection[])
      : base.sections,
    canvas:
      content.canvas === null
        ? undefined
        : content.canvas && typeof content.canvas === "object"
          ? (content.canvas as PageSchema["canvas"])
          : base.canvas,
    footer:
      content.footer === null
        ? undefined
        : content.footer && typeof content.footer === "object"
          ? {
              ...(base.footer || {}),
              ...(content.footer as PageSchema["footer"]),
            }
          : base.footer,
  };
  return next;
}

function sectionKey(section: SchemaSection, index: number): string {
  if ("id" in section && typeof section.id === "string" && section.id) {
    return section.id;
  }
  return `${section.type}:${index}`;
}

export function updateSectionInSchema(
  schema: PageSchema,
  sectionId: string,
  patch: Record<string, unknown>,
): PageSchema {
  let found = false;
  const sections = schema.sections.map((section, index) => {
    const key = sectionKey(section, index);
    if (key !== sectionId && section.type !== sectionId) return section;
    found = true;
    const { type: _t, ...rest } = patch;
    return { ...section, ...rest, type: section.type } as SchemaSection;
  });
  if (!found) throw new Error(`Section not found: ${sectionId}`);
  return { ...schema, sections };
}

export function upsertComponentInSchema(
  schema: PageSchema,
  input: {
    sectionId: string;
    componentId?: string;
    component: Record<string, unknown>;
  },
): PageSchema {
  let found = false;
  const sections = schema.sections.map((section, index) => {
    const key = sectionKey(section, index);
    if (key !== input.sectionId && section.type !== input.sectionId) {
      return section;
    }
    found = true;
    if (
      section.type !== "serviceGrid" &&
      section.type !== "shortcuts" &&
      section.type !== "social"
    ) {
      throw new Error(`Section ${section.type} does not support upsert_component`);
    }
    const items = [...section.items];
    const id = String(
      input.componentId ?? input.component.id ?? `item_${Date.now().toString(36)}`,
    );
    const idx = items.findIndex((it) => it.id === id);
    const nextItem = {
      ...(idx >= 0 ? items[idx] : { id, label: "", url: "" }),
      ...input.component,
      id,
      label: String(input.component.label ?? (idx >= 0 ? items[idx]!.label : id)),
      url: String(input.component.url ?? (idx >= 0 ? items[idx]!.url : "")),
    };
    if (idx >= 0) items[idx] = nextItem;
    else items.push(nextItem);
    return { ...section, items } as SchemaSection;
  });
  if (!found) throw new Error(`Section not found: ${input.sectionId}`);
  return { ...schema, sections };
}

export function reorderComponentsInSchema(
  schema: PageSchema,
  sectionId: string,
  orderedIds: string[],
): PageSchema {
  let found = false;
  const sections = schema.sections.map((section, index) => {
    const key = sectionKey(section, index);
    if (key !== sectionId && section.type !== sectionId) return section;
    found = true;
    if (
      section.type !== "serviceGrid" &&
      section.type !== "shortcuts" &&
      section.type !== "social"
    ) {
      throw new Error(`Reorder not supported for ${section.type}`);
    }
    const byId = new Map(section.items.map((it) => [it.id, it]));
    const next = orderedIds
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof section.items;
    for (const it of section.items) {
      if (!orderedIds.includes(it.id)) next.push(it);
    }
    return { ...section, items: next } as SchemaSection;
  });
  if (!found) throw new Error(`Section not found: ${sectionId}`);
  return { ...schema, sections };
}

export function applySchemaToDesign(
  currentDesign: unknown,
  schema: PageSchema,
  opts?: { asDraft?: boolean; versionLabel?: string; publish?: boolean },
): DesignWithSchema {
  const base = parsePageDesign(currentDesign) as DesignWithSchema;
  const raw = asRecord(currentDesign) as DesignWithSchema;
  const patch = schemaToDesignPatch(schema);
  const versions = Array.isArray(raw.schemaVersions)
    ? ([...raw.schemaVersions] as PageVersionSnapshot[])
    : Array.isArray(base.schemaVersions)
      ? ([...base.schemaVersions] as PageVersionSnapshot[])
      : [];

  const entry: PageVersionSnapshot = {
    id: versionId(),
    label: opts?.versionLabel ?? (opts?.publish ? "publish" : "draft"),
    savedAt: nowIso(),
    schema,
    published: Boolean(opts?.publish),
  };
  versions.unshift(entry);
  if (versions.length > 30) versions.length = 30;

  const next: DesignWithSchema = {
    ...base,
    ...patch,
    pageSchema: raw.pageSchema ?? base.pageSchema,
    pageSchemaDraft: raw.pageSchemaDraft ?? base.pageSchemaDraft,
    schemaVersions: versions,
    publishedSchemaVersionId:
      raw.publishedSchemaVersionId ?? base.publishedSchemaVersionId,
  };

  // schemaToDesignPatch already sets pageSchema; override for draft-only
  if (opts?.asDraft && !opts?.publish) {
    next.pageSchemaDraft = schema;
    // keep published schema if present
    if (raw.pageSchema) next.pageSchema = raw.pageSchema;
    else next.pageSchema = schema;
  } else if (opts?.publish) {
    next.pageSchema = schema;
    next.pageSchemaDraft = schema;
    next.publishedSchemaVersionId = entry.id;
  } else {
    next.pageSchema = schema;
    next.pageSchemaDraft = schema;
  }

  // Discourage freeform CSS on schema pages
  delete next.customCss;

  return next;
}

export function restoreSchemaVersion(
  currentDesign: unknown,
  versionIdToRestore: string,
): DesignWithSchema {
  const raw = asRecord(currentDesign) as DesignWithSchema;
  const versions = Array.isArray(raw.schemaVersions)
    ? (raw.schemaVersions as PageVersionSnapshot[])
    : [];
  const found = versions.find((v) => v.id === versionIdToRestore);
  if (!found) throw new Error(`Version not found: ${versionIdToRestore}`);
  return applySchemaToDesign(currentDesign, found.schema, {
    publish: true,
    versionLabel: `restore:${found.id}`,
  });
}

export function validateDesignSchema(design: unknown): PageValidationIssue[] {
  const schema = getDraftSchema(design);
  if (!schema) {
    return [
      {
        level: "error",
        code: "no_schema",
        message: "pageSchema가 없습니다. create_page_from_template 또는 list_templates로 시작하세요.",
      },
    ];
  }
  return validatePageSchema(schema);
}

export function renderPreviewPayload(input: {
  handle: string;
  design: unknown;
  origin?: string;
}) {
  const schema = getDraftSchema(input.design);
  const validation = schema
    ? validatePageSchema(schema)
    : validateDesignSchema(input.design);
  const origin = (input.origin ?? "https://bio.omo.co.kr").replace(/\/$/, "");
  return {
    handle: input.handle,
    schema,
    validation,
    previewUrl: `${origin}/${encodeURIComponent(input.handle)}?preview=1`,
    designerUrl: `${origin}/designer?handle=${encodeURIComponent(input.handle)}&embed=1`,
    publicUrl: `${origin}/${encodeURIComponent(input.handle)}`,
    widgetUri: "ui://bioomo/profile-designer.html",
  };
}

export { flattenSchemaLinks };
