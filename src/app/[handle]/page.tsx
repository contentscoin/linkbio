import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { links, pages } from "@/db/schema";
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
          style={{ animationDelay: "0.05s" }}
        >
          <div className="bio-avatar">{avatar}</div>
          <h1 className="bio-name">{page.displayName}</h1>
          <p className="bio-handle">/{page.handle}</p>
          {page.bio ? <p className="bio-desc">{page.bio}</p> : null}
        </header>

        <section
          className="bio-section bio-rise"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="bio-links">
            {pageLinks.map((link, index) => (
              <a
                key={link.id}
                className={
                  link.featured ? "bio-link bio-link--featured" : "bio-link"
                }
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ animationDelay: `${0.22 + index * 0.06}s` }}
              >
                {link.featured ? (
                  <span className="bio-badge">추천</span>
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

        <footer
          className="bio-foot bio-rise"
          style={{ animationDelay: "0.36s" }}
        >
          <Link href="/">OMO Bio로 만든 페이지</Link>
        </footer>
      </main>
    </div>
  );
}
