import { sanitizeCustomCss } from "./design";
import { isReservedHandle } from "./reserved";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "./social-platforms";
import {
  TEMPLATE_IDS,
  type BackgroundKind,
  type ButtonStyle,
  type FontPair,
  type LayoutStyle,
  type PageDesign,
  type TemplateId,
} from "./templates";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const handlePattern = /^[a-z0-9_-]{3,32}$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function validateEmail(value: FormDataEntryValue | null): ValidationResult<string> {
  const email = formValue(value).toLowerCase();
  if (!email || email.length > 320 || !emailPattern.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  return { ok: true, value: email };
}

export function validatePassword(value: FormDataEntryValue | null): ValidationResult<string> {
  const password = typeof value === "string" ? value : "";
  if (password.length < 10) {
    return { ok: false, message: "Password must be at least 10 characters." };
  }
  if (byteLength(password) > 72) {
    return { ok: false, message: "Password must be 72 bytes or fewer." };
  }
  if (!password.trim()) {
    return { ok: false, message: "Password cannot be blank." };
  }
  return { ok: true, value: password };
}

export function validateHandle(value: FormDataEntryValue | null): ValidationResult<string> {
  const rawHandle = formValue(value);
  const handle = rawHandle.toLowerCase();
  if (rawHandle !== handle) {
    return {
      ok: false,
      message: "Handle must use lowercase letters.",
    };
  }
  if (!handlePattern.test(handle)) {
    return {
      ok: false,
      message: "Handle must be 3-32 lowercase letters, numbers, underscores, or hyphens.",
    };
  }
  if (isReservedHandle(handle)) {
    return { ok: false, message: "That handle is reserved." };
  }
  return { ok: true, value: handle };
}

export function validateDisplayName(
  value: FormDataEntryValue | null,
): ValidationResult<string> {
  const displayName = formValue(value);
  if (!displayName || displayName.length > 80) {
    return { ok: false, message: "Display name must be 1-80 characters." };
  }
  return { ok: true, value: displayName };
}

export function validateBio(value: FormDataEntryValue | null): ValidationResult<string> {
  const bio = formValue(value);
  if (bio.length > 280) {
    return { ok: false, message: "Bio must be 280 characters or fewer." };
  }
  return { ok: true, value: bio };
}

export function validateInitials(value: FormDataEntryValue | null): ValidationResult<string> {
  const initials = formValue(value).toUpperCase();
  if (!/^[A-Z0-9]{1,4}$/.test(initials)) {
    return { ok: false, message: "Initials must be 1-4 letters or numbers." };
  }
  return { ok: true, value: initials };
}

export function validateTheme(
  value: FormDataEntryValue | null,
): ValidationResult<TemplateId> {
  const theme = (formValue(value) || "field") as TemplateId;
  if (!(TEMPLATE_IDS as readonly string[]).includes(theme)) {
    return { ok: false, message: "Choose a supported template." };
  }
  return { ok: true, value: theme };
}

export function validateOptionalContactEmail(
  value: FormDataEntryValue | null,
): ValidationResult<string> {
  const email = formValue(value).toLowerCase();
  if (!email) return { ok: true, value: "" };
  if (email.length > 320 || !emailPattern.test(email)) {
    return { ok: false, message: "Enter a valid contact email, or leave blank." };
  }
  return { ok: true, value: email };
}

export function validateHexColor(value: FormDataEntryValue | null): ValidationResult<string> {
  const color = formValue(value);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { ok: false, message: "Accent color must be a hex value like #1a5c45." };
  }
  return { ok: true, value: color.toLowerCase() };
}

export function validateButtonStyle(
  value: FormDataEntryValue | null,
): ValidationResult<ButtonStyle> {
  const style = formValue(value) as ButtonStyle;
  if (!["soft", "solid", "outline", "pill"].includes(style)) {
    return { ok: false, message: "Choose a button style." };
  }
  return { ok: true, value: style };
}

export function validateBackgroundKind(
  value: FormDataEntryValue | null,
): ValidationResult<BackgroundKind> {
  const kind = formValue(value) as BackgroundKind;
  if (!["gradient", "solid", "image", "pattern"].includes(kind)) {
    return { ok: false, message: "Choose a background type." };
  }
  return { ok: true, value: kind };
}

export function validateBackgroundValue(
  kind: BackgroundKind,
  value: FormDataEntryValue | null,
): ValidationResult<string> {
  const raw = formValue(value);
  if (!raw || raw.length > 2048) {
    return { ok: false, message: "Background value must be 1-2048 characters." };
  }
  if (kind === "image") {
    return validateExternalUrl(raw);
  }
  if (kind === "solid" && !/^#[0-9a-fA-F]{6}$/.test(raw) && !/^rgb/i.test(raw)) {
    return { ok: false, message: "Solid background needs a color value." };
  }
  if (/javascript:|expression\(|@import/i.test(raw)) {
    return { ok: false, message: "Background value contains blocked content." };
  }
  return { ok: true, value: raw };
}

export function validateFontPair(
  value: FormDataEntryValue | null,
): ValidationResult<FontPair> {
  const font = formValue(value) as FontPair;
  if (!["editorial", "sport", "minimal", "night"].includes(font)) {
    return { ok: false, message: "Choose a font pair." };
  }
  return { ok: true, value: font };
}

export function validateLayoutStyle(
  value: FormDataEntryValue | null,
): ValidationResult<LayoutStyle> {
  const layout = formValue(value) as LayoutStyle;
  if (!["stack", "compact", "cards"].includes(layout)) {
    return { ok: false, message: "Choose a layout." };
  }
  return { ok: true, value: layout };
}

export function validateCustomCss(
  value: FormDataEntryValue | null,
): ValidationResult<string> {
  const css = sanitizeCustomCss(typeof value === "string" ? value : "");
  return { ok: true, value: css };
}

export function validateDesignForm(formData: FormData): ValidationResult<PageDesign> {
  const buttonStyle = validateButtonStyle(formData.get("buttonStyle"));
  if (!buttonStyle.ok) return buttonStyle;

  const backgroundKind = validateBackgroundKind(formData.get("backgroundKind"));
  if (!backgroundKind.ok) return backgroundKind;

  const backgroundValue = validateBackgroundValue(
    backgroundKind.value,
    formData.get("backgroundValue"),
  );
  if (!backgroundValue.ok) return backgroundValue;

  const accentColor = validateHexColor(formData.get("accentColor"));
  if (!accentColor.ok) return accentColor;

  const textColor = validateHexColor(formData.get("textColor"));
  if (!textColor.ok) return textColor;

  const mutedColor = validateHexColor(formData.get("mutedColor"));
  if (!mutedColor.ok) return mutedColor;

  const fontPair = validateFontPair(formData.get("fontPair"));
  if (!fontPair.ok) return fontPair;

  const layout = validateLayoutStyle(formData.get("layout"));
  if (!layout.ok) return layout;

  const customCss = validateCustomCss(formData.get("customCss"));
  if (!customCss.ok) return customCss;

  return {
    ok: true,
    value: {
      buttonStyle: buttonStyle.value,
      backgroundKind: backgroundKind.value,
      backgroundValue: backgroundValue.value,
      accentColor: accentColor.value,
      textColor: textColor.value,
      mutedColor: mutedColor.value,
      fontPair: fontPair.value,
      layout: layout.value,
      customCss: customCss.value,
    },
  };
}

export function validateSocialPlatform(
  value: FormDataEntryValue | null,
): ValidationResult<SocialPlatform> {
  const platform = formValue(value) as SocialPlatform;
  if (!(SOCIAL_PLATFORMS as readonly string[]).includes(platform)) {
    return { ok: false, message: "Unsupported social platform." };
  }
  return { ok: true, value: platform };
}

export function validateLinkLabel(value: FormDataEntryValue | null): ValidationResult<string> {
  const label = formValue(value);
  if (!label || label.length > 80) {
    return { ok: false, message: "Link label must be 1-80 characters." };
  }
  return { ok: true, value: label };
}

export function validateExternalUrl(
  value: FormDataEntryValue | null,
): ValidationResult<string> {
  const rawUrl = formValue(value);
  if (!rawUrl || rawUrl.length > 2048) {
    return { ok: false, message: "Enter a URL under 2048 characters." };
  }

  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      return { ok: false, message: "Only http and https links are allowed." };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, message: "Enter a complete URL, including https://." };
  }
}

export function validateUuid(value: FormDataEntryValue | null): ValidationResult<string> {
  const id = formValue(value);
  if (!uuidPattern.test(id)) {
    return { ok: false, message: "Invalid link id." };
  }
  return { ok: true, value: id };
}

export function validateSortOrder(value: FormDataEntryValue | null): ValidationResult<number> {
  const parsed = Number.parseInt(formValue(value), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 999) {
    return { ok: false, message: "Sort order must be a number from 0 to 999." };
  }
  return { ok: true, value: parsed };
}

export function validateSessionSecret(value: string | undefined): ValidationResult<string> {
  if (!value || value.length < 32) {
    return {
      ok: false,
      message: "SESSION_SECRET must be at least 32 characters.",
    };
  }
  return { ok: true, value };
}

export function checkboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}
