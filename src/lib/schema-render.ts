import type { Link } from "@/db/schema";
import {
  designAttrs,
  parsePageDesign,
  type PageDesign,
} from "@/lib/page-design";
import {
  flattenSchemaLinks,
  isSchemaDrivenTemplate,
  parsePageSchema,
  schemaToDesignPatch,
  themeTokens,
  type PageSchema,
} from "@/lib/page-schema";

export type PublicRenderMode = "schema" | "legacy";

export type ResolvedPublicRender = {
  mode: PublicRenderMode;
  schema: PageSchema | null;
  schemaVersionId: string | null;
  design: PageDesign;
  attrs: ReturnType<typeof designAttrs>;
  /** Theme for data-theme (navy-lime etc.) */
  theme: string;
  accent: string;
  /** Links overlaid from schema when schema-driven */
  links: Link[];
  footer: {
    label: string;
    url: string;
    style: "fmgs" | "omo" | "none";
  };
  skipFairwayScene: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Prefer published pageSchema for FMGS-* (and related) templates.
 * Rebuilds design attrs from schema so legacy Fairway fields cannot override.
 */
export function resolvePublicRender(input: {
  designRaw: unknown;
  pageLinks: Link[];
  pageTheme?: string | null;
  pageAccent?: string | null;
  displayName?: string;
}): ResolvedPublicRender {
  const raw = asRecord(input.designRaw);
  const schema =
    parsePageSchema(raw.pageSchema) ||
    parsePageSchema(raw.pageSchemaDraft);
  const templateId =
    schema?.templateId ||
    (typeof raw.templateId === "string" ? raw.templateId : "");
  const schemaVersionId =
    typeof raw.publishedSchemaVersionId === "string"
      ? raw.publishedSchemaVersionId
      : null;

  const schemaDriven =
    Boolean(schema) && isSchemaDrivenTemplate(templateId || schema?.templateId);

  if (!schemaDriven || !schema) {
    const design = parsePageDesign(input.designRaw);
    return {
      mode: "legacy",
      schema: schema,
      schemaVersionId,
      design,
      attrs: designAttrs(design),
      theme: input.pageTheme || "fairway",
      accent: input.pageAccent || "#2d6a4f",
      links: input.pageLinks,
      footer: {
        label: "OMO Bio로 만든 페이지",
        url: "/",
        style: "omo",
      },
      skipFairwayScene: false,
    };
  }

  const patch = schemaToDesignPatch(schema);
  // Merge: schema patch wins over stored design (single source of truth)
  const design = parsePageDesign({
    ...raw,
    ...patch,
    pageSchema: schema,
    customCss: undefined,
  });
  const attrs = designAttrs(design);
  const tokens = themeTokens(schema.theme);
  const flat = flattenSchemaLinks(schema);

  const byKey = new Map(input.pageLinks.map((l) => [l.section, l]));
  const links: Link[] = flat.map((item, index) => {
    const existing = byKey.get(item.key);
    const base = existing || input.pageLinks[0];
    const id = existing?.id || `schema:${item.key}`;
    return {
      ...(base || ({} as Link)),
      id,
      pageId: existing?.pageId || "",
      section: item.key,
      label: item.label,
      sublabel: item.sublabel || "",
      url: item.url,
      featured: Boolean(item.featured),
      visible: true,
      isVisible: true,
      sortOrder: index,
      position: index,
      span: item.span,
      mobileSpan: item.mobileSpan,
      variant: (item.variant as Link["variant"]) || "card",
      layout: "horizontal",
      iconPlacement: "leading",
      iconSize: item.featured ? 28 : 22,
      iconKey: item.iconKey || "",
      iconUrl: "",
      iconImageUrl: item.iconImageUrl || "",
      badge: item.badge || "",
      showArrow: item.showArrow !== false,
      arrowStyle: (item.arrowStyle as Link["arrowStyle"]) || "plain",
      arrowPosition: "trailing",
      showDivider: Boolean(item.showDivider),
      leadingIconUrl: item.leadingIconUrl || "",
      secondaryText: item.secondaryText || "",
      trailingIcon: "",
      cardPadding: "",
      cardMinHeight: item.cardMinHeight || (item.featured ? 0 : 140),
      cardHeight: item.cardHeight || 0,
      aspectRatio: "",
      rowSpan: 1,
      trailingText: item.trailingText || "",
      subtitlePlacement:
        (item.subtitlePlacement as Link["subtitlePlacement"]) || "body",
      objectFit: "",
      imageSize: 0,
      imagePosition: "",
      mobileCardMinHeight: 0,
      mobileCardHeight: 0,
      mobileCardPadding: "",
      clickCount: existing?.clickCount || 0,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: existing?.updatedAt || new Date(),
      kind: existing?.kind || "link",
      size: existing?.size || "auto",
    } as Link;
  });

  const footerSection = schema.sections.find((s) => s.type === "footer");
  const footer =
    schema.footer ||
    (footerSection && footerSection.type === "footer"
      ? {
          label: footerSection.label,
          url: footerSection.url,
          style: footerSection.style,
        }
      : undefined);

  return {
    mode: "schema",
    schema,
    schemaVersionId,
    design,
    attrs,
    theme: schema.theme || "navy-lime",
    accent: tokens.accent || input.pageAccent || "#C9F232",
    links,
    footer: {
      label:
        footer?.label ||
        schema.brand?.displayName ||
        input.displayName ||
        "FMGS",
      url: footer?.url || "https://fmgs.co.kr",
      style: footer?.style || "fmgs",
    },
    skipFairwayScene: true,
  };
}
