export const reservedHandles = new Set([
  "_next",
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "dashboard",
  "favicon.ico",
  "help",
  "legal",
  "link",
  "links",
  "login",
  "logout",
  "mypage",
  "privacy",
  "robots.txt",
  "settings",
  "signup",
  "sitemap.xml",
  "static",
  "terms",
  "vercel",
  "mcp",
]);

export function isReservedHandle(handle: string) {
  const normalized = handle.trim().toLowerCase();
  return normalized.startsWith("_") || reservedHandles.has(normalized);
}
