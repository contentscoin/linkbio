/** Built-in icon keys for link cards (SVG paths, 24x24 viewBox). */
export const LINK_ICON_KEYS = [
  "chat",
  "kakao",
  "golf",
  "ball",
  "members",
  "flag",
  "ads",
  "chart",
  "building",
  "home",
  "portfolio",
  "arrow",
] as const;

export type LinkIconKey = (typeof LINK_ICON_KEYS)[number];

const ICONS: Record<LinkIconKey, string> = {
  chat: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6z",
  kakao:
    "M12 4c-5 0-9 3.1-9 7 0 2.5 1.6 4.7 4.1 6l-.8 3 3.4-1.8c.7.1 1.5.2 2.3.2 5 0 9-3.1 9-7s-4-7-9-7z",
  golf: "M12 3v11M12 14c-3 0-5 1.8-5 4h10c0-2.2-2-4-5-4zM12 3l6 3-6 2",
  ball: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 0c2 2.5 2 11.5 0 16M4.5 9.5c4 1 11 1 15 0M4.5 14.5c4-1 11-1 15 0",
  members:
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6.5-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 19a5.5 5.5 0 0 1 11 0M14 16.5a4.5 4.5 0 0 1 6.5 2.5",
  flag: "M6 21V4m0 0h9l-1.5 3L15 10H6",
  ads: "M4 10v4l8 5V5L4 10zm8-2 7-3v14l-7-3",
  chart: "M4 19h16M7 16V9m5 7V5m5 11v-6",
  building:
    "M4 20h16M6 20V6l6-2 6 2v14M10 10h.01M14 10h.01M10 14h.01M14 14h.01",
  home: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z",
  portfolio: "M4 7h16v12H4V7zm4-3h8l1 3H7l1-3z",
  arrow: "M5 12h12m0 0-5-5m5 5-5 5",
};

export function isLinkIconKey(value: string): value is LinkIconKey {
  return (LINK_ICON_KEYS as readonly string[]).includes(value);
}

export function coerceIconKey(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 32);
  return isLinkIconKey(trimmed) ? trimmed : "";
}

export function linkIconPath(key: string): string | null {
  if (!isLinkIconKey(key)) return null;
  return ICONS[key];
}
