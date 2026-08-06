import type { Link } from "@/db/schema";
import type { DesignSection } from "@/lib/page-design";

export type LinkSectionView = {
  id: string;
  title?: string;
  columns: 1 | 2 | 3;
  links: Link[];
};

function resolveLink(
  pageLinks: Link[],
  key: string,
  used: Set<string>,
): Link | undefined {
  const byId = pageLinks.find((l) => l.id === key && !used.has(l.id));
  if (byId) return byId;
  const bySection = pageLinks.find(
    (l) => l.section === key && !used.has(l.id),
  );
  if (bySection) return bySection;
  const byLabel = pageLinks.find(
    (l) =>
      !used.has(l.id) &&
      l.label.replace(/\s+/g, "-").toLowerCase() === key.toLowerCase(),
  );
  return byLabel;
}

/** Group visible links into design sections (or a single default list). */
export function groupLinksBySections(
  pageLinks: Link[],
  sections: DesignSection[] | undefined,
): LinkSectionView[] {
  if (!sections || sections.length === 0) {
    return [
      {
        id: "default",
        columns: 1,
        links: pageLinks,
      },
    ];
  }

  const ordered = [...sections].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const used = new Set<string>();
  const views: LinkSectionView[] = [];

  for (const section of ordered) {
    const columns = section.columns ?? (section.layout === "grid" ? 2 : 1);
    const links: Link[] = [];
    if (section.items && section.items.length > 0) {
      for (const key of section.items) {
        const link = resolveLink(pageLinks, key, used);
        if (link) {
          used.add(link.id);
          links.push(link);
        }
      }
    } else {
      for (const link of pageLinks) {
        if (used.has(link.id)) continue;
        if (link.section === section.id) {
          used.add(link.id);
          links.push(link);
        }
      }
    }
    if (links.length === 0) continue;
    views.push({
      id: section.id,
      title: section.title,
      columns,
      links,
    });
  }

  const rest = pageLinks.filter((l) => !used.has(l.id));
  if (rest.length > 0) {
    views.push({ id: "more", columns: 1, links: rest });
  }
  return views;
}
