export function siteOrigin() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.LINKBIO_PUBLIC_URL?.replace(/\/$/, "");
  if (explicit && !explicit.includes("127.0.0.1") && !explicit.includes("localhost")) {
    return explicit;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return explicit || "http://localhost:3000";
}

export function publicPageUrl(handle: string, base?: string) {
  const origin = (base || siteOrigin()).replace(/\/$/, "");
  return `${origin}/${handle.replace(/^\//, "")}`;
}
