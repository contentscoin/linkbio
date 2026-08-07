/**
 * Origins allowed to embed `/designer`.
 *
 * This single list drives two things that must never drift apart:
 *  - the `frame-ancestors` CSP in `next.config.ts` (who may frame us), and
 *  - the postMessage sender/target checks in the designer client (who may
 *    drive the tool bridge).
 *
 * A host that can frame the designer but is not trusted to speak to it — or
 * the reverse — is a bug, so both consumers read the same constant.
 */
export const EMBED_HOST_ORIGIN_PATTERNS = [
  "https://chatgpt.com",
  "https://*.chatgpt.com",
  "https://chat.openai.com",
  "https://*.oaiusercontent.com",
  "https://claude.ai",
  "https://*.claude.ai",
] as const;

/** `frame-ancestors` value for the /designer CSP. */
export const FRAME_ANCESTORS = ["'self'", ...EMBED_HOST_ORIGIN_PATTERNS].join(
  " ",
);

function matchesOriginPattern(origin: string, pattern: string): boolean {
  if (origin === pattern) return true;

  const WILDCARD = "https://*.";
  if (!pattern.startsWith(WILDCARD)) return false;
  const suffix = pattern.slice(WILDCARD.length).toLowerCase();

  let hostname: string;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    hostname = url.hostname.toLowerCase();
  } catch {
    return false;
  }

  // `.endsWith` alone would accept the bare apex (covered by an exact pattern
  // when intended) and must not accept `claude.ai.evil.com` — requiring a
  // literal dot boundary plus at least one label before it handles both.
  return hostname.length > suffix.length + 1 && hostname.endsWith(`.${suffix}`);
}

/**
 * True when `origin` is a host we accept postMessage traffic from, or our own
 * origin. Pass `selfOrigin` (window.location.origin) so a same-origin embed
 * keeps working without widening the list.
 */
export function isAllowedEmbedHostOrigin(
  origin: string | null | undefined,
  selfOrigin?: string | null,
): boolean {
  if (!origin || origin === "null") return false;
  const normalized = origin.trim().toLowerCase();
  if (!normalized) return false;
  if (selfOrigin && normalized === selfOrigin.trim().toLowerCase()) return true;
  return EMBED_HOST_ORIGIN_PATTERNS.some((pattern) =>
    matchesOriginPattern(normalized, pattern),
  );
}
