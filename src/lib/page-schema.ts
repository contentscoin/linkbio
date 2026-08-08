/**
 * Structured Page Schema — GPT/MCP passes this; Bioomo renderer owns CSS.
 * Prefer schema fields over customCss.
 */

export type SchemaContentWidth = "mobile" | "tablet" | "desktop" | number;

export type SchemaProofItem = { value: string; label: string };

export type SchemaLinkItem = {
  id: string;
  label: string;
  url: string;
  sublabel?: string;
  iconImageUrl?: string;
  iconKey?: string;
  badge?: string;
  span?: 1 | 2 | 3;
  mobileSpan?: 1 | 2 | 3;
  /** card | full | spotlight */
  variant?: "card" | "full" | "spotlight";
  cardMinHeight?: number;
  cardHeight?: number;
};

export type SchemaCta = {
  label: string;
  url: string;
  secondaryText?: string;
  trailingText?: string;
  leadingIconUrl?: string;
  iconKey?: string;
  subtitlePlacement?: "body" | "trailing";
  showDivider?: boolean;
  showArrow?: boolean;
  arrowStyle?: "plain" | "circle";
  cardMinHeight?: number;
  cardHeight?: number;
};

export type SchemaSection =
  | {
      type: "hero";
      headline?: string;
      headlineSegments?: Array<{
        text: string;
        accent?: boolean;
        breakAfter?: boolean;
      }>;
      stats?: SchemaProofItem[];
      heroGraphic?: "none" | "golf";
      heroImageUrl?: string;
      /** Alias of heroImageUrl */
      heroGraphicUrl?: string;
      /** Header/headline alignment — overrides designOptions.headerAlign */
      align?: "left" | "center";
    }
  | {
      type: "serviceGrid";
      id?: string;
      title?: string;
      columns: 1 | 2 | 3;
      mobileColumns: 1 | 2 | 3;
      gap?: number;
      items: SchemaLinkItem[];
    }
  | {
      type: "cta";
      id?: string;
      item: SchemaCta;
    }
  | {
      type: "shortcuts";
      id?: string;
      title?: string;
      columns?: 1 | 2 | 3;
      mobileColumns?: 1 | 2 | 3;
      items: SchemaLinkItem[];
    }
  | {
      type: "social";
      id?: string;
      title?: string;
      items: SchemaLinkItem[];
    }
  | {
      type: "footer";
      id?: string;
      label?: string;
      url?: string;
      style?: "fmgs" | "omo" | "none";
    };

export type SchemaDesignOptions = {
  palette?: string;
  font?: "sans" | "serif" | "mono";
  cardStyle?: string;
  radius?: "sharp" | "soft" | "round" | "pill";
  buttonStyle?: string;
  effect?: string;
  backgroundImageUrl?: string;
  desktopFontSize?: number;
  mobileFontSize?: number;
  lineHeight?: number;
  letterSpacing?: string;
  /** Card grid layout for the whole page */
  layout?: "stack" | "bento" | "list";
  headerAlign?: "left" | "center";
  logoWidth?: number;
  logoHeight?: number;
  headlineFontSize?: number;
  headlineMobileFontSize?: number;
  /** Hero graphic width in px (24–480). Height follows the 4:3 artwork ratio. */
  heroGraphicSize?: number;
  heroGraphicPosition?: "right" | "left" | "above" | "below";
  /** Header(hero) top padding in px — renderer default 46 */
  heroPaddingTop?: number;
  /** Proof/stats bar max width in px — renderer default 420 */
  proofWidth?: number;
  /** Vertical gap between sections in px — renderer default 30 */
  sectionGap?: number;
  /** Artboard width in px — falls back to canvas.width */
  canvasWidth?: number;
  /** Artboard height in px — falls back to canvas.height */
  canvasHeight?: number;
  /**
   * fluid(default) — responsive rendering.
   * fixed — keep the canvas ratio: screens narrower than canvasWidth scale the
   * whole artboard down, so a 853×1844 시안 renders at the same proportions.
   */
  canvasFit?: "fluid" | "fixed";
};

/** Custom palette — overrides theme preset token by token. */
export type SchemaThemeTokens = {
  accent?: string;
  pageBackground?: string;
  cardBackground?: string;
  cardText?: string;
  mutedText?: string;
  borderColor?: string;
  featuredBackground?: string;
  featuredText?: string;
};

export type PageSchema = {
  version: 1;
  templateId: string;
  theme: string;
  contentWidth: SchemaContentWidth;
  /** Optional artboard hint (e.g. FMGS exact 853×1844) */
  canvas?: { width: number; height: number };
  brand?: {
    logoUrl?: string;
    displayName?: string;
    showHandle?: boolean;
    showAvatar?: boolean;
  };
  sections: SchemaSection[];
  designOptions?: SchemaDesignOptions;
  /** Custom colors — theme can be any name when tokens are provided */
  themeTokens?: SchemaThemeTokens;
  footer?: {
    label?: string;
    url?: string;
    style?: "fmgs" | "omo" | "none";
  };
};

export type PageValidationIssue = {
  level: "error" | "warn" | "info";
  code: string;
  message: string;
  path?: string;
};

export type PageVersionSnapshot = {
  id: string;
  savedAt: string;
  label: string;
  schema: PageSchema;
  published?: boolean;
};

const THEME_TOKENS: Record<
  string,
  { accent: string; featuredFill: string; featuredText: string; pageBg?: string }
> = {
  "navy-lime": {
    accent: "#C9F232",
    featuredFill: "#C9F232",
    featuredText: "#0B1F33",
    pageBg: "#0B1F33",
  },
  fairway: {
    accent: "#2d6a4f",
    featuredFill: "#2d6a4f",
    featuredText: "#ffffff",
  },
  noir: {
    accent: "#e8c547",
    featuredFill: "#1a1a1a",
    featuredText: "#f5f5f5",
  },
  corporate: {
    accent: "#1e4fd6",
    featuredFill: "#1e4fd6",
    featuredText: "#ffffff",
  },
};

export function contentWidthToPx(width: SchemaContentWidth): number {
  if (typeof width === "number" && Number.isFinite(width)) {
    return Math.min(960, Math.max(320, Math.floor(width)));
  }
  if (width === "tablet") return 720;
  if (width === "desktop") return 880;
  return 765; // mobile-first premium default (FMGS)
}

export function parsePageSchema(raw: unknown): PageSchema | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Record<string, unknown>;
  if (data.version !== 1) return null;
  if (typeof data.templateId !== "string" || !data.templateId.trim()) return null;
  if (typeof data.theme !== "string" || !data.theme.trim()) return null;
  if (!Array.isArray(data.sections)) return null;

  const contentWidth =
    typeof data.contentWidth === "number"
      ? data.contentWidth
      : data.contentWidth === "tablet" ||
          data.contentWidth === "desktop" ||
          data.contentWidth === "mobile"
        ? data.contentWidth
        : "mobile";

  return {
    version: 1,
    templateId: data.templateId.trim().slice(0, 64),
    theme: data.theme.trim().slice(0, 64),
    contentWidth,
    brand:
      data.brand && typeof data.brand === "object" && !Array.isArray(data.brand)
        ? (data.brand as PageSchema["brand"])
        : undefined,
    canvas:
      data.canvas && typeof data.canvas === "object" && !Array.isArray(data.canvas)
        ? (data.canvas as PageSchema["canvas"])
        : undefined,
    sections: data.sections as SchemaSection[],
    designOptions:
      data.designOptions &&
      typeof data.designOptions === "object" &&
      !Array.isArray(data.designOptions)
        ? (data.designOptions as SchemaDesignOptions)
        : undefined,
    themeTokens:
      data.themeTokens &&
      typeof data.themeTokens === "object" &&
      !Array.isArray(data.themeTokens)
        ? (data.themeTokens as SchemaThemeTokens)
        : undefined,
    footer:
      data.footer && typeof data.footer === "object" && !Array.isArray(data.footer)
        ? (data.footer as PageSchema["footer"])
        : undefined,
  };
}

export function themeTokens(theme: string) {
  return THEME_TOKENS[theme] || THEME_TOKENS["navy-lime"]!;
}

/** Preset tokens merged with schema.themeTokens overrides — full palette. */
export function resolveThemeTokens(schema: PageSchema): Required<
  Pick<SchemaThemeTokens, "accent" | "featuredBackground" | "featuredText">
> &
  SchemaThemeTokens {
  const preset = themeTokens(schema.theme);
  const custom = schema.themeTokens || {};
  return {
    accent: custom.accent || preset.accent,
    featuredBackground: custom.featuredBackground || preset.featuredFill,
    featuredText: custom.featuredText || preset.featuredText,
    pageBackground: custom.pageBackground || preset.pageBg,
    cardBackground: custom.cardBackground,
    cardText: custom.cardText,
    mutedText: custom.mutedText,
    borderColor: custom.borderColor,
  };
}

/** Validate schema for mobile overflow / missing links / grid rules. */
export function validatePageSchema(schema: PageSchema): PageValidationIssue[] {
  const issues: PageValidationIssue[] = [];
  if (!schema.sections.length) {
    issues.push({
      level: "error",
      code: "empty_sections",
      message: "섹션이 없습니다.",
    });
  }

  let hasCta = false;
  for (const [i, section] of schema.sections.entries()) {
    const path = `sections[${i}]`;
    if (section.type === "cta") {
      hasCta = true;
      if (!section.item?.label || !section.item?.url) {
        issues.push({
          level: "error",
          code: "cta_incomplete",
          message: "CTA에 label/url이 필요합니다.",
          path,
        });
      }
    }
    if (section.type === "serviceGrid") {
      if (section.columns !== 2 || section.mobileColumns !== 2) {
        issues.push({
          level: "warn",
          code: "service_grid_columns",
          message:
            "FMGS형 서비스 그리드는 columns=2, mobileColumns=2 권장입니다.",
          path,
        });
      }
      if (!section.items?.length) {
        issues.push({
          level: "error",
          code: "service_grid_empty",
          message: "서비스 카드가 비어 있습니다.",
          path,
        });
      }
      for (const item of section.items || []) {
        if (!item.url) {
          issues.push({
            level: "error",
            code: "link_url_missing",
            message: `서비스 '${item.label || item.id}' URL이 없습니다.`,
            path,
          });
        }
        if ((item.label || "").length > 28) {
          issues.push({
            level: "warn",
            code: "label_overflow",
            message: `'${item.label}' 제목이 길어서 모바일에서 잘릴 수 있습니다.`,
            path,
          });
        }
        if (item.span && item.span !== 1) {
          issues.push({
            level: "warn",
            code: "service_span",
            message: "서비스 카드는 span:1로 동일 높이 2×2를 유지하세요.",
            path,
          });
        }
      }
    }
    if (
      section.type === "serviceGrid" ||
      section.type === "shortcuts" ||
      section.type === "social"
    ) {
      for (const item of section.items || []) {
        if (
          item.variant &&
          !["card", "full", "spotlight"].includes(item.variant)
        ) {
          issues.push({
            level: "warn",
            code: "unknown_variant",
            message: `'${item.label || item.id}' variant '${item.variant}'는 지원되지 않습니다 (card|full|spotlight). footer는 top-level footer 필드를 사용하세요.`,
            path,
          });
        }
      }
    }
    if (section.type === "shortcuts") {
      for (const item of section.items || []) {
        if (!item.url) {
          issues.push({
            level: "error",
            code: "shortcut_url_missing",
            message: `바로가기 '${item.label || item.id}' URL이 없습니다.`,
            path,
          });
        }
      }
    }
    if (section.type === "hero") {
      const headline =
        section.headline ||
        section.headlineSegments?.map((s) => s.text).join("") ||
        "";
      if (!headline) {
        issues.push({
          level: "warn",
          code: "headline_missing",
          message: "히어로 헤드라인이 비어 있습니다.",
          path,
        });
      }
    }
  }

  const opts = schema.designOptions || {};
  if (
    opts.canvasFit === "fixed" &&
    !(opts.canvasWidth || schema.canvas?.width) &&
    !(opts.canvasHeight || schema.canvas?.height)
  ) {
    issues.push({
      level: "warn",
      code: "canvas_missing",
      message:
        "canvasFit:'fixed'에는 canvas { width, height }(또는 designOptions.canvasWidth/Height)가 필요합니다.",
      path: "designOptions",
    });
  }

  if (!hasCta) {
    issues.push({
      level: "info",
      code: "cta_missing",
      message: "CTA 섹션이 없습니다. 전환율이 낮을 수 있습니다.",
    });
  }

  return issues;
}

export function schemaToDesignPatch(schema: PageSchema): Record<string, unknown> {
  const tokens = resolveThemeTokens(schema);
  const opts = schema.designOptions || {};
  const hero = schema.sections.find((s) => s.type === "hero");
  const proofItems =
    hero && hero.type === "hero" ? hero.stats : undefined;
  const headline =
    hero && hero.type === "hero"
      ? hero.headline ||
        hero.headlineSegments?.map((s) => s.text).join("") ||
        undefined
      : undefined;
  const headlineSegments =
    hero && hero.type === "hero" ? hero.headlineSegments : undefined;
  const heroGraphic =
    hero && hero.type === "hero" ? hero.heroGraphic : undefined;
  const heroImageUrl =
    hero && hero.type === "hero"
      ? hero.heroImageUrl || hero.heroGraphicUrl
      : undefined;

  const isFmgs = schema.templateId.startsWith("fmgs-");

  const designSections = schema.sections
    .filter(
      (s) =>
        s.type === "serviceGrid" ||
        s.type === "shortcuts" ||
        s.type === "social" ||
        s.type === "cta",
    )
    .map((s, order) => {
      if (s.type === "cta") {
        return {
          id: s.id || "cta",
          title: undefined,
          columns: 1 as const,
          mobileColumns: 1 as const,
          order,
          items: ["cta"],
        };
      }
      if (s.type === "serviceGrid") {
        return {
          id: s.id || "services",
          title: s.title || "핵심 서비스",
          columns: s.columns,
          mobileColumns: s.mobileColumns,
          gap: s.gap ?? 12,
          order,
          items: s.items.map((it) => it.id),
        };
      }
      if (s.type === "shortcuts") {
        const columns = (s.columns ?? 1) as 1 | 2 | 3;
        const mobileColumns = (s.mobileColumns ?? 1) as 1 | 2 | 3;
        return {
          id: s.id || "shortcuts",
          title: s.title,
          columns,
          mobileColumns,
          order,
          items: s.items.map((it) => it.id),
        };
      }
      return {
        id: s.id || s.type,
        title: s.title,
        columns: 1 as const,
        mobileColumns: 1 as const,
        order,
        items: s.items.map((it) => it.id),
      };
    });

  return {
    pageSchema: schema,
    templateId: schema.templateId,
    contentMaxWidth: contentWidthToPx(schema.contentWidth),
    layout: opts.layout ?? (isFmgs ? "bento" : undefined),
    accent: tokens.accent,
    featuredFill: tokens.featuredBackground,
    featuredText: tokens.featuredText,
    tokens: {
      pageBackground: tokens.pageBackground || undefined,
      cardBackground: tokens.cardBackground || (isFmgs ? "#132a42" : undefined),
      cardText: tokens.cardText || (isFmgs ? "#f2f6fb" : undefined),
      mutedText: tokens.mutedText || (isFmgs ? "#9fb0c3" : undefined),
      borderColor: tokens.borderColor || (isFmgs ? "#1e3a55" : undefined),
      featuredBackground: tokens.featuredBackground,
      featuredText: tokens.featuredText,
    },
    logoImageUrl: schema.brand?.logoUrl,
    logoUrl: schema.brand?.logoUrl,
    logoWidth: opts.logoWidth ?? (isFmgs ? 140 : undefined),
    logoHeight: opts.logoHeight ?? (isFmgs ? 40 : undefined),
    showHandle: schema.brand?.showHandle === true,
    showAvatar: schema.brand?.showAvatar === true,
    headline,
    headlineSegments,
    proofItems,
    heroGraphic: heroGraphic || (heroImageUrl ? undefined : "none"),
    heroGraphicUrl: heroImageUrl,
    heroImageUrl,
    heroGraphicSize: opts.heroGraphicSize ?? (isFmgs ? 96 : undefined),
    heroGraphicPosition:
      opts.heroGraphicPosition ?? (isFmgs ? "right" : undefined),
    heroPaddingTop: opts.heroPaddingTop,
    proofWidth: opts.proofWidth,
    sectionGap: opts.sectionGap,
    canvasWidth: opts.canvasWidth ?? schema.canvas?.width,
    canvasHeight: opts.canvasHeight ?? schema.canvas?.height,
    canvasFit: opts.canvasFit,
    headerAlign:
      (hero && hero.type === "hero" ? hero.align : undefined) ??
      opts.headerAlign ??
      (isFmgs ? "left" : undefined),
    headlineFontSize:
      opts.headlineFontSize ?? (isFmgs ? 28 : opts.desktopFontSize),
    headlineMobileFontSize:
      opts.headlineMobileFontSize ?? (isFmgs ? 22 : opts.mobileFontSize),
    sections: designSections,
    font: opts.font || (isFmgs ? "sans" : undefined),
    radius: opts.radius || (isFmgs ? "round" : undefined),
    buttonStyle: opts.buttonStyle || (isFmgs ? "elevated" : undefined),
    effect: opts.effect,
    backgroundImageUrl: opts.backgroundImageUrl,
    desktopFontSize: opts.desktopFontSize ?? (isFmgs ? 15 : undefined),
    mobileFontSize: opts.mobileFontSize ?? (isFmgs ? 14 : undefined),
    lineHeight: opts.lineHeight ?? (isFmgs ? 1.45 : undefined),
    letterSpacing: opts.letterSpacing ?? (isFmgs ? "-0.02em" : undefined),
    customCss: undefined,
  };
}

export function flattenSchemaLinks(schema: PageSchema): Array<{
  key: string;
  label: string;
  url: string;
  sublabel?: string;
  featured?: boolean;
  section: string;
  span: number;
  mobileSpan: number;
  iconImageUrl?: string;
  iconKey?: string;
  badge?: string;
  leadingIconUrl?: string;
  secondaryText?: string;
  trailingText?: string;
  subtitlePlacement?: string;
  showDivider?: boolean;
  showArrow?: boolean;
  arrowStyle?: string;
  variant?: string;
  cardMinHeight?: number;
  cardHeight?: number;
}> {
  const out: ReturnType<typeof flattenSchemaLinks> = [];
  for (const section of schema.sections) {
    if (section.type === "cta") {
      out.push({
        key: "cta",
        label: section.item.label,
        url: section.item.url,
        featured: true,
        section: section.id || "cta",
        span: 2,
        mobileSpan: 2,
        leadingIconUrl: section.item.leadingIconUrl,
        iconKey: section.item.iconKey,
        secondaryText: section.item.secondaryText,
        trailingText: section.item.trailingText,
        subtitlePlacement: section.item.subtitlePlacement || "trailing",
        showDivider: section.item.showDivider !== false,
        showArrow: section.item.showArrow !== false,
        arrowStyle: section.item.arrowStyle || "circle",
        variant: "full",
        cardMinHeight: section.item.cardMinHeight,
        cardHeight: section.item.cardHeight,
      });
    } else if (
      section.type === "serviceGrid" ||
      section.type === "shortcuts" ||
      section.type === "social"
    ) {
      const sectionId =
        section.id ||
        (section.type === "serviceGrid"
          ? "services"
          : section.type === "shortcuts"
            ? "shortcuts"
            : "social");
      const isShortcuts = section.type === "shortcuts";
      for (const item of section.items) {
        const defaultFull =
          isShortcuts && (item.variant === "full" || !item.variant);
        out.push({
          key: item.id,
          label: item.label,
          url: item.url,
          sublabel: item.sublabel,
          section: sectionId,
          span: item.span || (defaultFull ? 2 : 1),
          mobileSpan: item.mobileSpan || item.span || (defaultFull ? 2 : 1),
          iconImageUrl: item.iconImageUrl,
          iconKey: item.iconKey,
          badge: item.badge,
          showArrow: true,
          arrowStyle: section.type === "serviceGrid" ? "circle" : "plain",
          variant: item.variant || (isShortcuts ? "full" : "card"),
          cardMinHeight: item.cardMinHeight,
          cardHeight: item.cardHeight,
        });
      }
    }
  }
  return out;
}

/**
 * True when public page should render from pageSchema only (no legacy mix).
 * Any template with a valid pageSchema is schema-driven — GPT can invent
 * custom templateIds and compose designs entirely via MCP.
 */
export function isSchemaDrivenTemplate(templateId: string | undefined | null) {
  return Boolean(templateId && templateId.trim());
}
