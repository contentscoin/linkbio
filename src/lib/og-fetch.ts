export type OgPreview = {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
};

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeEntities(match[1].trim());
    }
  }
  return "";
}

function absoluteUrl(base: string, value: string) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

export async function fetchOgPreview(rawUrl: string): Promise<OgPreview> {
  const url = new URL(rawUrl).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "LinkBioBot/1.0 (+https://linkbio.local; metadata preview)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Could not fetch channel (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xml")) {
      return {
        url,
        title: new URL(url).hostname,
        description: "",
        imageUrl: "",
        siteName: new URL(url).hostname,
      };
    }

    const html = (await response.text()).slice(0, 250_000);
    const title =
      metaContent(html, ["og:title", "twitter:title"]) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      new URL(url).hostname;
    const description = metaContent(html, [
      "og:description",
      "twitter:description",
      "description",
    ]);
    const imageUrl = absoluteUrl(
      url,
      metaContent(html, ["og:image", "twitter:image", "twitter:image:src"]),
    );
    const siteName =
      metaContent(html, ["og:site_name"]) || new URL(url).hostname;

    return {
      url,
      title: decodeEntities(title).slice(0, 120),
      description: description.slice(0, 280),
      imageUrl: imageUrl.slice(0, 2048),
      siteName: siteName.slice(0, 80),
    };
  } finally {
    clearTimeout(timer);
  }
}
