import type { PageDesign } from "./templates";

const blockedCssPatterns = [
  /@import/gi,
  /@charset/gi,
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /-moz-binding/gi,
  /url\s*\(\s*["']?\s*data:/gi,
  /url\s*\(\s*["']?\s*javascript:/gi,
  /<\/?script/gi,
];

export function sanitizeCustomCss(raw: string): string {
  let css = raw.slice(0, 8000);
  for (const pattern of blockedCssPatterns) {
    css = css.replace(pattern, "/* blocked */");
  }
  return css.trim();
}

export function designToCssVars(design: PageDesign): Record<string, string> {
  return {
    "--page-accent": design.accentColor,
    "--page-ink": design.textColor,
    "--page-muted": design.mutedColor,
  };
}

export function backgroundStyle(design: PageDesign): {
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundSize?: string;
} {
  switch (design.backgroundKind) {
    case "solid":
      return { backgroundColor: design.backgroundValue || "#e8f0ea" };
    case "image": {
      const safeUrl = design.backgroundValue.replace(/["'\\]/g, "");
      return {
        backgroundImage: `linear-gradient(180deg, rgba(10, 24, 18, 0.35), rgba(10, 24, 18, 0.55)), url("${safeUrl}")`,
        backgroundSize: "cover",
      };
    }
    case "pattern":
      if (design.backgroundValue === "fairway") {
        return {
          backgroundColor: "#dce8df",
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(26, 92, 69, 0.05) 0 2px, transparent 2px 28px), radial-gradient(circle at 20% 0%, rgba(230, 184, 76, 0.2), transparent 40%)",
        };
      }
      return {
        backgroundColor: "#e8f0ea",
        backgroundImage:
          "radial-gradient(rgba(26, 92, 69, 0.12) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      };
    case "gradient":
    default:
      return { backgroundImage: design.backgroundValue };
  }
}

export function parseDesignJson(value: unknown): Partial<PageDesign> | null {
  if (!value || typeof value !== "object") return null;
  return value as Partial<PageDesign>;
}
