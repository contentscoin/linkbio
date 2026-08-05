import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { links, pages, type Link as PageLink } from "@/db/schema";
import { AuroraScene } from "@/components/aurora-scene";
import { FairwayScene } from "@/components/fairway-scene";

export const dynamic = "force-dynamic";

type PageDesign = {
  layout?: string;
  pattern?: string;
  motion?: string;
  effect?: string;
  card?: string;
  size?: string;
  radius?: string;
  font?: string;
  effectCard?: string;
};

async function loadPage(handle: string) {
  const db = getDb();
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.handle, handle.toLowerCase()))
    .limit(1);

  if (!page) return null;
  const published = page.published || page.isPublished;
  if (!published) return null;

  const pageLinks = await db
    .select()
    .from(links)
    .where(
      and(
        eq(links.pageId, page.id),
        eq(links.visible, true),
        eq(links.isVisible, true),
      ),
    )
    .orderBy(asc(links.sortOrder), asc(links.createdAt));

  return { page, pageLinks };
}

function readDesign(raw: unknown): PageDesign {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as PageDesign;
}

function groupLinks(pageLinks: PageLink[]) {
  const featured = pageLinks.filter((link) => link.featured);
  const rest = pageLinks.filter((link) => !link.featured);
  const sections: { key: string; label: string | null; items: PageLink[] }[] =
    [];

  if (featured.length > 0) {
    sections.push({ key: "__featured", label: null, items: featured });
  }

  const order: string[] = [];
  const map = new Map<string, PageLink[]>();
  for (const link of rest) {
    const key = (link.section || "").trim() || "__default";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(link);
  }

  for (const key of order) {
    sections.push({
      key,
      label: key === "__default" ? null : key,
      items: map.get(key)!,
    });
  }

  return sections;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const data = await loadPage(handle);
  if (!data) {
    return { title: "페이지 없음 · OMO Bio" };
  }
  return {
    title: `${data.page.displayName} · OMO Bio`,
    description: data.page.bio || undefined,
  };
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await loadPage(handle);
  if (!data) notFound();

  const { page, pageLinks } = data;
  const avatar =
    page.avatarInitials ||
    page.avatarText ||
    page.displayName.slice(0, 2);
  const accent = page.accent || "#2d6a4f";
  const theme = page.theme || "fairway";
  const design = readDesign(page.design);
  const layout =
    design.layout === "bento" || design.layout === "list"
      ? design.layout
      : "stack";
  const sections = groupLinks(pageLinks);
  let riseIndex = 0;

  return (
    <div
      className="bio-stage"
      data-theme={theme}
      data-pattern={design.pattern || undefined}
      data-motion={design.motion || undefined}
      data-effect={design.effect || undefined}
      data-card={design.card || undefined}
      data-size={design.size || undefined}
      data-radius={design.radius || undefined}
      data-font={design.font || undefined}
      data-effect-card={design.effectCard || undefined}
      style={{ ["--accent" as string]: accent }}
    >
      {theme === "fairway" ? <FairwayScene /> : null}
      {theme === "aurora" ? <AuroraScene /> : null}

      {design.pattern ? (
        <div className="bio-bg" aria-hidden="true">
          <div className="bio-pattern" />
        </div>
      ) : null}
      {design.effect ? <div className="bio-fx" aria-hidden="true" /> : null}

      <main className="bio" data-layout={layout}>
        <header
          className="bio-head bio-rise"
          style={{ animationDelay: "0.04s" }}
        >
          <div className="bio-avatar" aria-hidden="true">
            {avatar}
          </div>
          <p className="bio-kicker">/{page.handle}</p>
          <h1 className="bio-name">{page.displayName}</h1>
          <span className="bio-rule" aria-hidden="true" />
          {page.bio ? <p className="bio-desc">{page.bio}</p> : null}
        </header>

        {sections.map((section) => {
          riseIndex += 1;
          const sectionDelay = 0.12 + riseIndex * 0.05;
          return (
            <section
              key={section.key}
              className="bio-section bio-rise"
              style={{ animationDelay: `${sectionDelay}s` }}
            >
              {section.label ? (
                <h2 className="bio-section-label">{section.label}</h2>
              ) : null}
              <div className="bio-links">
                {section.items.map((link, index) => (
                  <a
                    key={link.id}
                    className={
                      link.featured
                        ? "bio-link bio-link--featured bio-rise"
                        : "bio-link bio-rise"
                    }
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    style={{
                      animationDelay: `${sectionDelay + 0.06 + index * 0.05}s`,
                    }}
                  >
                    {link.featured ? (
                      <span className="bio-badge">공식</span>
                    ) : null}
                    <span className="bio-link-body">
                      <span className="bio-link-title">{link.label}</span>
                      {link.sublabel ? (
                        <span className="bio-link-sub">{link.sublabel}</span>
                      ) : null}
                    </span>
                    <span className="bio-link-mark" aria-hidden="true">
                      ›
                    </span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}

        <footer
          className="bio-foot bio-rise"
          style={{ animationDelay: "0.55s" }}
        >
          <Link href="/">OMO Bio로 만든 페이지</Link>
        </footer>
      </main>
    </div>
  );
}
