export type HeadlineSegment = {
  text: string;
  accent?: boolean;
  breakAfter?: boolean;
};

export function highlightHeadline(
  headline: string,
  highlight?: string,
): HeadlineSegment[] {
  const full = headline.trim();
  const needle = highlight?.trim();
  if (!full) return [];
  if (!needle) return [{ text: full }];
  const idx = full.indexOf(needle);
  if (idx < 0) return [{ text: full }];
  const parts: HeadlineSegment[] = [];
  if (idx > 0) parts.push({ text: full.slice(0, idx) });
  parts.push({ text: needle, accent: true });
  if (idx + needle.length < full.length) {
    parts.push({ text: full.slice(idx + needle.length) });
  }
  return parts;
}

export function parseHeadlineSegments(raw: unknown): HeadlineSegment[] {
  if (!Array.isArray(raw)) return [];
  const out: HeadlineSegment[] = [];
  for (const row of raw.slice(0, 24)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const data = row as Record<string, unknown>;
    const text = typeof data.text === "string" ? data.text.slice(0, 120) : "";
    if (!text) continue;
    out.push({
      text,
      accent: data.accent === true,
      breakAfter: data.breakAfter === true || data.break === true,
    });
  }
  return out;
}
