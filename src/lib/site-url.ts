const CANONICAL_SITE = "https://bio.omo.co.kr";

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function isLocalHost(value: string) {
  return (
    value.includes("127.0.0.1") ||
    value.includes("localhost") ||
    value.startsWith("http://0.0.0.0")
  );
}

function isVercelAppHost(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host.endsWith(".vercel.app") || host === "vercel.app";
  } catch {
    return value.includes(".vercel.app");
  }
}

/**
 * Public site origin for MCP URLs, previews, and assets.
 * Prefer the canonical Bioomo domain — never expose *.vercel.app to clients
 * (ChatGPT/browser filters often block vercel.app preview hosts).
 */
export function siteOrigin() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.LINKBIO_PUBLIC_URL,
  ]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => stripTrailingSlash(v.trim()));

  for (const explicit of candidates) {
    if (isLocalHost(explicit)) continue;
    if (isVercelAppHost(explicit)) continue;
    return explicit;
  }

  // Production / preview on Vercel: always use canonical public domain.
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return CANONICAL_SITE;
  }

  const local = candidates.find((v) => isLocalHost(v));
  return local || "http://localhost:3000";
}

export function canonicalSiteOrigin() {
  return CANONICAL_SITE;
}

export function publicPageUrl(handle: string, base?: string) {
  const origin = stripTrailingSlash(base || siteOrigin());
  return `${origin}/${handle.replace(/^\//, "")}`;
}

export function mcpEndpointUrl(token?: string) {
  const origin = siteOrigin();
  const url = `${origin}/api/mcp`;
  if (!token) return url;
  return `${url}?token=${encodeURIComponent(token)}`;
}
