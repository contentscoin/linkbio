export const SOCIAL_PLATFORMS = [
  "youtube",
  "instagram",
  "threads",
  "x",
  "facebook",
  "linkedin",
  "tiktok",
  "github",
  "kakao",
  "naver",
  "website",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const hostMap: Array<{ match: RegExp; platform: SocialPlatform }> = [
  { match: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, platform: "youtube" },
  { match: /(^|\.)instagram\.com$/i, platform: "instagram" },
  { match: /(^|\.)threads\.net$/i, platform: "threads" },
  { match: /(^|\.)x\.com$|(^|\.)twitter\.com$/i, platform: "x" },
  { match: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i, platform: "facebook" },
  { match: /(^|\.)linkedin\.com$/i, platform: "linkedin" },
  { match: /(^|\.)tiktok\.com$/i, platform: "tiktok" },
  { match: /(^|\.)github\.com$/i, platform: "github" },
  { match: /(^|\.)kakao\.com$|(^|\.)open\.kakao\.com$/i, platform: "kakao" },
  { match: /(^|\.)naver\.com$|(^|\.)blog\.naver\.com$/i, platform: "naver" },
];

export function detectPlatform(url: string): SocialPlatform {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const entry of hostMap) {
      if (entry.match.test(host)) return entry.platform;
    }
  } catch {
    return "website";
  }
  return "website";
}

export function platformLabel(platform: SocialPlatform): string {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "instagram":
      return "Instagram";
    case "threads":
      return "Threads";
    case "x":
      return "X";
    case "facebook":
      return "Facebook";
    case "linkedin":
      return "LinkedIn";
    case "tiktok":
      return "TikTok";
    case "github":
      return "GitHub";
    case "kakao":
      return "Kakao";
    case "naver":
      return "Naver";
    case "website":
      return "Website";
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
}

export function extractHandleHint(url: string, platform: SocialPlatform): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (platform === "youtube" && parts[0] === "channel") {
      return parts[1] ?? "";
    }
    if (platform === "youtube" && parts[0]?.startsWith("@")) {
      return parts[0];
    }
    if (parts[0]?.startsWith("@")) return parts[0];
    return parts[0] ?? parsed.hostname;
  } catch {
    return "";
  }
}
