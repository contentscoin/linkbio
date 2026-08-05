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
  | "press";

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
  card?: BioCard;
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
]);

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function pickEnum<T extends string>(value: unknown, allowed: Set<T>) {
  const raw = asString(value);
  return allowed.has(raw as T) ? (raw as T) : undefined;
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

  return {
    templateId: asString(data.templateId).slice(0, 64) || undefined,
    layout: pickEnum(data.layout, LAYOUTS),
    pattern: pickEnum(data.pattern, PATTERNS),
    motion: pickEnum(data.motion, MOTIONS),
    effect: pickEnum(data.effect, EFFECTS),
    card: pickEnum(data.card, CARDS),
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
  return {
    layout: design.layout || "stack",
    pattern: design.pattern && design.pattern !== "none" ? design.pattern : undefined,
    motion: design.motion && design.motion !== "none" ? design.motion : undefined,
    effect: design.effect && design.effect !== "none" ? design.effect : undefined,
    card: design.card,
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
