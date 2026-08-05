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
  /** Optional button background override (css color) */
  buttonFill?: string;
  /** Optional button label color override */
  buttonText?: string;
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

  return {
    templateId: asString(data.templateId).slice(0, 64) || undefined,
    layout: pickEnum(data.layout, LAYOUTS),
    pattern: pickEnum(data.pattern, PATTERNS),
    motion: pickEnum(data.motion, MOTIONS),
    effect: pickEnum(data.effect, EFFECTS),
    card: card ?? buttonStyleToCard(buttonStyle),
    buttonStyle,
    buttonShadow: pickEnum(data.buttonShadow, BUTTON_SHADOWS),
    buttonFill: sanitizeCssColor(asString(data.buttonFill)),
    buttonText: sanitizeCssColor(asString(data.buttonText)),
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
  const trimmed = css.trim().slice(0, 8000);
  if (!trimmed) return undefined;
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
    buttonFill: design.buttonFill,
    buttonText: design.buttonText,
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
