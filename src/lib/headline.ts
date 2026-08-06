export function highlightHeadline(
  headline: string,
  highlight?: string,
): Array<{ text: string; accent?: boolean }> {
  const full = headline.trim();
  const needle = highlight?.trim();
  if (!full) return [];
  if (!needle) return [{ text: full }];
  const idx = full.indexOf(needle);
  if (idx < 0) return [{ text: full }];
  const parts: Array<{ text: string; accent?: boolean }> = [];
  if (idx > 0) parts.push({ text: full.slice(0, idx) });
  parts.push({ text: needle, accent: true });
  if (idx + needle.length < full.length) {
    parts.push({ text: full.slice(idx + needle.length) });
  }
  return parts;
}
