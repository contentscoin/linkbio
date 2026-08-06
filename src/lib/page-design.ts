export type BioLayout = "stack" | "bento" | "list";
export type BioPattern =
  | "none"
  | "dots"
  | "grid"
  | "stripes"
  | "checks"
  | "waves"
  | "hex"
  | "grain"
  | "crosshatch";
export type BioMotion = "none" | "float" | "drift" | "pulse" | "scan" | "sway";
export type BioEffect =
  | "none"
  | "vignette"
  | "glow"
  | "spotlight"
  | "scanlines"
  | "grain";
export type BioCard =
  | "solid"
  | "outline"
  | "glass"
  | "elevated"
  | "flat"
  | "sticker";
/** Linkstory-style button fill/look. Prefer this over raw `card`. */
export type BioButtonStyle =
  | "solid"
  | "soft"
  | "outline"
  | "ghost"
  | "glass"
  | "elevated"
  | "sticker";
export type BioButtonShadow = "none" | "soft" | "hard" | "float";
export type BioSize = "compact" | "normal" | "roomy";
export type BioRadius = "sharp" | "soft" | "round" | "pill";
export type BioFont = "sans" | "serif" | "mono";
export type BioEffectCard =
  | "none"
  | "lift"
  | "glow"
  | "tilt"
  | "shine"
  | "beam"
  | "press"
  | "wipe";

export type WizardState = {
  active: boolean;
  stepId: string;
  answers: Record<string, string>;
};

/** Page-level color tokens — separate from per-button fills. */
export type DesignTokens = {
  pageBackground?: string;
  cardBackground?: string;
  cardText?: string;
  mutedText?: string;
  featuredBackground?: string;
  featuredText?: string;
  borderColor?: string;
};

export type DesignSection = {
  id: string;
  title?: string;
  /** 1 = full width stack, 2+ = grid columns */
  columns?: 1 | 2 | 3;
  /** Mobile columns override (default: columns fallback) */
  mobileColumns?: 1 | 2 | 3;
  layout?: "full" | "grid" | "stack";
  order?: number;
  /** Link ids (preferred) or stable keys matched via link.section */
  items?: string[];
  gap?: number;
  /** gap alias */
  sectionGap?: number;
  rowGap?: number;
  columnGap?: number;
  mobileGap?: number;
};

export type ProofItem = {
  value: string;
  label: string;
};

export type HeaderAlign = "center" | "left";
export type HeroGraphic = "none" | "golf";
export type LogoAlign = "center" | "left" | "right";
export type HeroGraphicPosition = "right" | "left" | "below" | "above";

export type HeadlineSegment = {
  text: string;
  accent?: boolean;
  breakAfter?: boolean;
};

export type PageDesign = {
  templateId?: string;
  layout?: BioLayout;
  pattern?: BioPattern;
  motion?: BioMotion;
  effect?: BioEffect;
  /** @deprecated prefer buttonStyle — kept for older pages */
  card?: BioCard;
  buttonStyle?: BioButtonStyle;
  buttonShadow?: BioButtonShadow;
  /** Default (non-featured) button background */
  buttonFill?: string;
  /** Default (non-featured) button label color */
  buttonText?: string;
  /** Featured CTA background — does NOT affect normal cards */
  featuredFill?: string;
  /** Featured CTA label color */
  featuredText?: string;
  /** Featured CTA border color */
  featuredBorder?: string;
  tokens?: DesignTokens;
  sections?: DesignSection[];
  proofItems?: ProofItem[];
  /** Brand wordmark / logo image (https) — separate from avatar */
  logoUrl?: string;
  /** logoUrl alias */
  logoImageUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoAlign?: LogoAlign;
  /** Content column max width in px (e.g. 765) */
  contentMaxWidth?: number;
  /** Optional display headline (falls back to page.bio first line) */
  headline?: string;
  /** Substring inside headline to accent-color highlight */
  headlineHighlight?: string;
  /** Explicit multi-part headline (overrides highlight parsing when set) */
  headlineSegments?: HeadlineSegment[];
  headerAlign?: HeaderAlign;
  heroGraphic?: HeroGraphic;
  heroGraphicUrl?: string;
  /** Alias of heroGraphicUrl */
  heroImageUrl?: string;
  heroGraphicSize?: number;
  heroGraphicPosition?: HeroGraphicPosition;
  /** Page typography controls */
  desktopFontSize?: number;
  mobileFontSize?: number;
  lineHeight?: number;
  letterSpacing?: string;
  headlineFontSize?: number;
  headlineMobileFontSize?: number;
  showHandle?: boolean;
  showAvatar?: boolean;
  size?: BioSize;
  radius?: BioRadius;
  font?: BioFont;
  effectCard?: BioEffectCard;
  backgroundImageUrl?: string;
  scrim?: number;
  avatarImageUrl?: string;
  customCss?: string;
  wizard?: WizardState;
};

const LAYOUTS = new Set<BioLayout>(["stack", "bento", "list"]);
const PATTERNS = new Set<BioPattern>([
  "none",
  "dots",
  "grid",
  "stripes",
  "checks",
  "waves",
  "hex",
  "grain",
  "crosshatch",
]);
const MOTIONS = new Set<BioMotion>([
  "none",
  "float",
  "drift",
  "pulse",
  "scan",
  "sway",
]);
const EFFECTS = new Set<BioEffect>([
  "none",
  "vignette",
  "glow",
  "spotlight",
  "scanlines",
  "grain",
]);
const CARDS = new Set<BioCard>([
  "solid",
  "outline",
  "glass",
  "elevated",
  "flat",
  "sticker",
]);
const BUTTON_STYLES = new Set<BioButtonStyle>([
  "solid",
  "soft",
  "outline",
  "ghost",
  "glass",
  "elevated",
  "sticker",
]);
const BUTTON_SHADOWS = new Set<BioButtonShadow>([
  "none",
  "soft",
  "hard",
  "float",
]);
const SIZES = new Set<BioSize>(["compact", "normal", "roomy"]);
const RADII = new Set<BioRadius>(["sharp", "soft", "round", "pill"]);
const FONTS = new Set<BioFont>(["sans", "serif", "mono"]);
const EFFECT_CARDS = new Set<BioEffectCard>([
  "none",
  "lift",
  "glow",
  "tilt",
  "shine",
  "beam",
  "press",
  "wipe",
]);

export const BUTTON_STYLE_OPTIONS: Array<{
  id: BioButtonStyle;
  label: string;
  hint: string;
}> = [
  { id: "solid", label: "솔리드", hint: "포인트 컬러로 채움" },
  { id: "soft", label: "소프트", hint: "연한 틴트 배경" },
  { id: "outline", label: "아웃라인", hint: "테두리만" },
  { id: "ghost", label: "고스트", hint: "투명·얇은 선" },
  { id: "glass", label: "글래스", hint: "반투명 블러" },
  { id: "elevated", label: "입체", hint: "카드형 그림자" },
  { id: "sticker", label: "스티커", hint: "두꺼운 그림자" },
];

export const BUTTON_SHADOW_OPTIONS: Array<{
  id: BioButtonShadow;
  label: string;
}> = [
  { id: "none", label: "없음" },
  { id: "soft", label: "소프트" },
  { id: "hard", label: "하드" },
  { id: "float", label: "플로트" },
];

export const BUTTON_RADIUS_OPTIONS: Array<{ id: BioRadius; label: string }> = [
  { id: "sharp", label: "각짐" },
  { id: "soft", label: "약간 둥글게" },
  { id: "round", label: "둥글게" },
  { id: "pill", label: "알약형" },
];

export const BUTTON_SIZE_OPTIONS: Array<{ id: BioSize; label: string }> = [
  { id: "compact", label: "컴팩트" },
  { id: "normal", label: "보통" },
  { id: "roomy", label: "크게" },
];

export const BUTTON_HOVER_OPTIONS: Array<{
  id: BioEffectCard;
  label: string;
}> = [
  { id: "none", label: "없음" },
  { id: "lift", label: "리프트" },
  { id: "glow", label: "글로우" },
  { id: "tilt", label: "틸트" },
  { id: "shine", label: "샤인" },
  { id: "beam", label: "빔" },
  { id: "press", label: "프레스" },
  { id: "wipe", label: "와이프" },
];

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function pickEnum<T extends string>(value: unknown, allowed: Set<T>) {
  const raw = asString(value);
  return allowed.has(raw as T) ? (raw as T) : undefined;
}

function sanitizeCssColor(value: string): string | undefined {
  const trimmed = value.trim().slice(0, 64);
  if (!trimmed) return undefined;
  if (
    !/^(#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|[a-z]+|rgb(a)?\([^)]+\)|hsl(a)?\([^)]+\))$/i.test(
      trimmed,
    )
  ) {
    return undefined;
  }
  return trimmed;
}

function cardToButtonStyle(card: BioCard | undefined): BioButtonStyle | undefined {
  if (!card) return undefined;
  if (card === "flat") return "soft";
  if (BUTTON_STYLES.has(card as BioButtonStyle)) {
    return card as BioButtonStyle;
  }
  return undefined;
}

function buttonStyleToCard(style: BioButtonStyle | undefined): BioCard | undefined {
  if (!style) return undefined;
  if (style === "soft") return "flat";
  if (style === "ghost") return "outline";
  if (CARDS.has(style as BioCard)) return style as BioCard;
  return "elevated";
}

export function parsePageDesign(raw: unknown): PageDesign {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const data = raw as Record<string, unknown>;
  const wizardRaw =
    data.wizard && typeof data.wizard === "object" && !Array.isArray(data.wizard)
      ? (data.wizard as Record<string, unknown>)
      : null;

  const answers: Record<string, string> = {};
  if (
    wizardRaw?.answers &&
    typeof wizardRaw.answers === "object" &&
    !Array.isArray(wizardRaw.answers)
  ) {
    for (const [key, value] of Object.entries(
      wizardRaw.answers as Record<string, unknown>,
    )) {
      if (typeof value === "string") answers[key] = value.slice(0, 500);
    }
  }

  const scrim =
    typeof data.scrim === "number" && Number.isFinite(data.scrim)
      ? Math.min(0.85, Math.max(0, data.scrim))
      : undefined;

  const card = pickEnum(data.card, CARDS);
  const buttonStyle =
    pickEnum(data.buttonStyle, BUTTON_STYLES) ?? cardToButtonStyle(card);

  const tokensRaw =
    data.tokens && typeof data.tokens === "object" && !Array.isArray(data.tokens)
      ? (data.tokens as Record<string, unknown>)
      : null;
  const tokens: DesignTokens | undefined = tokensRaw
    ? {
        pageBackground: sanitizeCssColor(asString(tokensRaw.pageBackground)),
        cardBackground: sanitizeCssColor(asString(tokensRaw.cardBackground)),
        cardText: sanitizeCssColor(asString(tokensRaw.cardText)),
        mutedText: sanitizeCssColor(asString(tokensRaw.mutedText)),
        featuredBackground: sanitizeCssColor(
          asString(tokensRaw.featuredBackground),
        ),
        featuredText: sanitizeCssColor(asString(tokensRaw.featuredText)),
        borderColor: sanitizeCssColor(asString(tokensRaw.borderColor)),
      }
    : undefined;
  const hasToken = tokens && Object.values(tokens).some(Boolean);

  const sectionsRaw = Array.isArray(data.sections) ? data.sections : [];
  const sections: DesignSection[] = [];
  for (const raw of sectionsRaw.slice(0, 24)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const row = raw as Record<string, unknown>;
    const id = asString(row.id).slice(0, 64);
    if (!id) continue;
    const columnsRaw = typeof row.columns === "number" ? row.columns : 1;
    const columns = ([1, 2, 3] as const).includes(columnsRaw as 1 | 2 | 3)
      ? (columnsRaw as 1 | 2 | 3)
      : 1;
    const mobileColumnsRaw =
      typeof row.mobileColumns === "number" ? row.mobileColumns : columns;
    const mobileColumns = ([1, 2, 3] as const).includes(
      mobileColumnsRaw as 1 | 2 | 3,
    )
      ? (mobileColumnsRaw as 1 | 2 | 3)
      : columns;
    const layoutRaw = asString(row.layout);
    const layout =
      layoutRaw === "full" || layoutRaw === "grid" || layoutRaw === "stack"
        ? layoutRaw
        : columns > 1
          ? "grid"
          : "stack";
    const items = Array.isArray(row.items)
      ? row.items
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.slice(0, 80))
          .slice(0, 48)
      : undefined;
    const gapRaw =
      typeof row.gap === "number"
        ? row.gap
        : typeof row.sectionGap === "number"
          ? row.sectionGap
          : undefined;
    const gap =
      typeof gapRaw === "number" && Number.isFinite(gapRaw)
        ? Math.min(48, Math.max(0, Math.floor(gapRaw)))
        : undefined;
    const rowGap =
      typeof row.rowGap === "number" && Number.isFinite(row.rowGap)
        ? Math.min(48, Math.max(0, Math.floor(row.rowGap)))
        : undefined;
    const columnGap =
      typeof row.columnGap === "number" && Number.isFinite(row.columnGap)
        ? Math.min(48, Math.max(0, Math.floor(row.columnGap)))
        : undefined;
    const mobileGap =
      typeof row.mobileGap === "number" && Number.isFinite(row.mobileGap)
        ? Math.min(48, Math.max(0, Math.floor(row.mobileGap)))
        : undefined;
    sections.push({
      id,
      title: asString(row.title).slice(0, 80) || undefined,
      columns,
      mobileColumns,
      layout,
      order:
        typeof row.order === "number" && Number.isFinite(row.order)
          ? row.order
          : undefined,
      items: items && items.length > 0 ? items : undefined,
      gap,
      sectionGap: gap,
      rowGap,
      columnGap,
      mobileGap,
    });
  }

  const featuredFill =
    sanitizeCssColor(asString(data.featuredFill)) ||
    tokens?.featuredBackground;
  const featuredText =
    sanitizeCssColor(asString(data.featuredText)) || tokens?.featuredText;
  const featuredBorder = sanitizeCssColor(asString(data.featuredBorder));

  const proofItems: ProofItem[] = [];
  if (Array.isArray(data.proofItems)) {
    for (const raw of data.proofItems.slice(0, 6)) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const row = raw as Record<string, unknown>;
      const value = asString(row.value).slice(0, 32);
      const label = asString(row.label).slice(0, 48);
      if (!value && !label) continue;
      proofItems.push({ value: value || label, label: label || value });
    }
  }

  const headerAlignRaw = asString(data.headerAlign);
  const headerAlign: HeaderAlign | undefined =
    headerAlignRaw === "left" || headerAlignRaw === "center"
      ? headerAlignRaw
      : undefined;
  const heroGraphicRaw = asString(data.heroGraphic);
  const heroGraphic: HeroGraphic | undefined =
    heroGraphicRaw === "golf" || heroGraphicRaw === "none"
      ? heroGraphicRaw
      : undefined;
  const logoAlignRaw = asString(data.logoAlign);
  const logoAlign: LogoAlign | undefined =
    logoAlignRaw === "left" ||
    logoAlignRaw === "right" ||
    logoAlignRaw === "center"
      ? logoAlignRaw
      : undefined;
  const heroPosRaw = asString(data.heroGraphicPosition);
  const heroGraphicPosition: HeroGraphicPosition | undefined =
    heroPosRaw === "right" ||
    heroPosRaw === "left" ||
    heroPosRaw === "below" ||
    heroPosRaw === "above"
      ? heroPosRaw
      : undefined;

  const contentMaxWidth =
    typeof data.contentMaxWidth === "number" && Number.isFinite(data.contentMaxWidth)
      ? Math.min(960, Math.max(320, Math.floor(data.contentMaxWidth)))
      : undefined;
  const logoWidth =
    typeof data.logoWidth === "number" && Number.isFinite(data.logoWidth)
      ? Math.min(480, Math.max(24, Math.floor(data.logoWidth)))
      : undefined;
  const logoHeight =
    typeof data.logoHeight === "number" && Number.isFinite(data.logoHeight)
      ? Math.min(240, Math.max(16, Math.floor(data.logoHeight)))
      : undefined;
  const heroGraphicSize =
    typeof data.heroGraphicSize === "number" &&
    Number.isFinite(data.heroGraphicSize)
      ? Math.min(240, Math.max(24, Math.floor(data.heroGraphicSize)))
      : undefined;

  const headlineSegments: HeadlineSegment[] = [];
  if (Array.isArray(data.headlineSegments)) {
    for (const raw of data.headlineSegments.slice(0, 24)) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const row = raw as Record<string, unknown>;
      const text = asString(row.text).slice(0, 120);
      if (!text) continue;
      headlineSegments.push({
        text,
        accent: row.accent === true,
        breakAfter: row.breakAfter === true || row.break === true,
      });
    }
  }

  const logoUrl =
    sanitizeHttpsUrl(asString(data.logoUrl)) ||
    sanitizeHttpsUrl(asString(data.brandLogoUrl)) ||
    sanitizeHttpsUrl(asString(data.logoImageUrl));

  return {
    templateId: asString(data.templateId).slice(0, 64) || undefined,
    layout: pickEnum(data.layout, LAYOUTS),
    pattern: pickEnum(data.pattern, PATTERNS),
    motion: pickEnum(data.motion, MOTIONS),
    effect: pickEnum(data.effect, EFFECTS),
    card: card ?? buttonStyleToCard(buttonStyle),
    buttonStyle,
    buttonShadow: pickEnum(data.buttonShadow, BUTTON_SHADOWS),
    buttonFill:
      sanitizeCssColor(asString(data.buttonFill)) || tokens?.cardBackground,
    buttonText: sanitizeCssColor(asString(data.buttonText)) || tokens?.cardText,
    featuredFill,
    featuredText,
    featuredBorder,
    tokens: hasToken ? tokens : undefined,
    sections: sections.length > 0 ? sections : undefined,
    proofItems: proofItems.length > 0 ? proofItems : undefined,
    logoUrl,
    logoImageUrl: logoUrl,
    logoWidth,
    logoHeight,
    logoAlign,
    contentMaxWidth,
    headline: asString(data.headline).slice(0, 160) || undefined,
    headlineHighlight:
      asString(data.headlineHighlight).slice(0, 80) || undefined,
    headlineSegments:
      headlineSegments.length > 0 ? headlineSegments : undefined,
    headerAlign,
    heroGraphic,
    heroGraphicUrl:
      sanitizeHttpsUrl(asString(data.heroGraphicUrl)) ||
      sanitizeHttpsUrl(asString(data.heroImageUrl)),
    heroImageUrl:
      sanitizeHttpsUrl(asString(data.heroImageUrl)) ||
      sanitizeHttpsUrl(asString(data.heroGraphicUrl)),
    heroGraphicSize,
    heroGraphicPosition,
    desktopFontSize:
      typeof data.desktopFontSize === "number" &&
      Number.isFinite(data.desktopFontSize)
        ? Math.min(28, Math.max(12, Math.floor(data.desktopFontSize)))
        : undefined,
    mobileFontSize:
      typeof data.mobileFontSize === "number" &&
      Number.isFinite(data.mobileFontSize)
        ? Math.min(24, Math.max(11, Math.floor(data.mobileFontSize)))
        : undefined,
    lineHeight:
      typeof data.lineHeight === "number" && Number.isFinite(data.lineHeight)
        ? Math.min(2.2, Math.max(1, Number(data.lineHeight)))
        : undefined,
    letterSpacing:
      typeof data.letterSpacing === "string"
        ? data.letterSpacing.trim().slice(0, 16) || undefined
        : undefined,
    headlineFontSize:
      typeof data.headlineFontSize === "number" &&
      Number.isFinite(data.headlineFontSize)
        ? Math.min(48, Math.max(14, Math.floor(data.headlineFontSize)))
        : undefined,
    headlineMobileFontSize:
      typeof data.headlineMobileFontSize === "number" &&
      Number.isFinite(data.headlineMobileFontSize)
        ? Math.min(36, Math.max(14, Math.floor(data.headlineMobileFontSize)))
        : undefined,
    showHandle: data.showHandle === false ? false : undefined,
    showAvatar: data.showAvatar === false ? false : undefined,
    size: pickEnum(data.size, SIZES),
    radius: pickEnum(data.radius, RADII),
    font: pickEnum(data.font, FONTS),
    effectCard: pickEnum(data.effectCard, EFFECT_CARDS),
    backgroundImageUrl: sanitizeHttpsUrl(asString(data.backgroundImageUrl)),
    scrim,
    avatarImageUrl: sanitizeHttpsUrl(asString(data.avatarImageUrl)),
    customCss: safeParseStoredCss(asString(data.customCss)),
    wizard: wizardRaw
      ? {
          active: wizardRaw.active === true,
          stepId: asString(wizardRaw.stepId).slice(0, 64) || "displayName",
          answers,
        }
      : undefined,
  };
}

function safeParseStoredCss(css: string): string | undefined {
  try {
    return sanitizeCustomCss(css);
  } catch {
    return undefined;
  }
}

export function sanitizeHttpsUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return undefined;
    return url.toString().slice(0, 2048);
  } catch {
    return undefined;
  }
}

/** Allow limited decorative CSS; strip imports and script-like constructs. */
export function sanitizeCustomCss(css: string): string | undefined {
  const trimmed = css.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 8000) {
    throw new Error(
      `customCss가 8000자를 초과합니다 (${trimmed.length}자). 줄이거나 네이티브 필드를 사용하세요.`,
    );
  }
  const blocked =
    /@import|expression\s*\(|javascript:|behavior\s*:|@charset|<\/?script|url\s*\(\s*['"]?\s*javascript/i;
  if (blocked.test(trimmed)) {
    throw new Error(
      "customCss에 @import / javascript / expression 등은 사용할 수 없습니다.",
    );
  }
  return trimmed;
}

export function mergePageDesign(
  current: unknown,
  patch: Partial<PageDesign>,
): PageDesign {
  const base = parsePageDesign(current);
  const next: PageDesign = { ...base, ...patch };
  if (patch.buttonStyle) {
    next.card = buttonStyleToCard(patch.buttonStyle);
  }
  if (patch.wizard) {
    next.wizard = {
      active: patch.wizard.active,
      stepId: patch.wizard.stepId,
      answers: { ...(base.wizard?.answers ?? {}), ...patch.wizard.answers },
    };
  }
  return parsePageDesign(next);
}

export function designAttrs(design: PageDesign) {
  const button =
    design.buttonStyle || cardToButtonStyle(design.card) || "elevated";
  const tokens = design.tokens;
  return {
    layout: design.layout || "stack",
    pattern: design.pattern && design.pattern !== "none" ? design.pattern : undefined,
    motion: design.motion && design.motion !== "none" ? design.motion : undefined,
    effect: design.effect && design.effect !== "none" ? design.effect : undefined,
    card: design.card || buttonStyleToCard(button),
    button,
    shadow:
      design.buttonShadow && design.buttonShadow !== "none"
        ? design.buttonShadow
        : undefined,
    buttonFill: design.buttonFill || tokens?.cardBackground,
    buttonText: design.buttonText || tokens?.cardText,
    featuredFill: design.featuredFill || tokens?.featuredBackground,
    featuredText: design.featuredText || tokens?.featuredText,
    featuredBorder: design.featuredBorder || tokens?.borderColor,
    tokens,
    sections: design.sections,
    proofItems: design.proofItems,
    logoUrl: design.logoUrl || design.logoImageUrl,
    logoImageUrl: design.logoImageUrl || design.logoUrl,
    logoWidth: design.logoWidth,
    logoHeight: design.logoHeight,
    logoAlign: design.logoAlign || "center",
    contentMaxWidth: design.contentMaxWidth,
    headline: design.headline,
    headlineHighlight: design.headlineHighlight,
    headlineSegments: design.headlineSegments,
    headerAlign: design.headerAlign || "center",
    heroGraphic: design.heroGraphic && design.heroGraphic !== "none"
      ? design.heroGraphic
      : undefined,
    heroGraphicUrl: design.heroGraphicUrl || design.heroImageUrl,
    heroImageUrl: design.heroImageUrl || design.heroGraphicUrl,
    heroGraphicSize: design.heroGraphicSize,
    heroGraphicPosition: design.heroGraphicPosition || "right",
    desktopFontSize: design.desktopFontSize,
    mobileFontSize: design.mobileFontSize,
    lineHeight: design.lineHeight,
    letterSpacing: design.letterSpacing,
    headlineFontSize: design.headlineFontSize,
    headlineMobileFontSize: design.headlineMobileFontSize,
    showHandle: design.showHandle !== false,
    showAvatar: design.showAvatar !== false,
    size: design.size,
    radius: design.radius,
    font: design.font,
    effectCard:
      design.effectCard && design.effectCard !== "none"
        ? design.effectCard
        : undefined,
    scrim: design.scrim,
    backgroundImageUrl: design.backgroundImageUrl,
    avatarImageUrl: design.avatarImageUrl,
    customCss: design.customCss,
  };
}

export function parseDesignSection(raw: unknown): DesignSection | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const parsed = parsePageDesign({ sections: [raw] });
  return parsed.sections?.[0] ?? null;
}
