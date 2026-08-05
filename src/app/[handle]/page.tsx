import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { links, pages } from "@/db/schema";
import { FairwayScene } from "@/components/fairway-scene";
import { designAttrs, parsePageDesign } from "@/lib/page-design";

export const dynamic = "force-dynamic";

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
  const design = parsePageDesign(page.design);
  const attrs = designAttrs(design);
  const avatar =
    page.avatarInitials ||
    page.avatarText ||
    page.displayName.slice(0, 2);
  const accent = page.accent || "#2d6a4f";
  const theme = page.theme || "fairway";
  const stageStyle: Record<string, string> = {
    ["--accent"]: accent,
  };
  if (attrs.backgroundImageUrl) {
    stageStyle["--bg-image"] = `url(${JSON.stringify(attrs.backgroundImageUrl)})`;
  }
  if (typeof attrs.scrim === "number") {
    stageStyle["--scrim"] = String(attrs.scrim);
  }

  return (
    <div
      className="bio-stage"
      data-theme={theme}
      data-pattern={attrs.pattern}
      data-motion={attrs.motion}
      data-effect={attrs.effect}
      data-card={attrs.card}
      data-size={attrs.size}
      data-radius={attrs.radius}
      data-font={attrs.font}
      data-effect-card={attrs.effectCard}
      style={stageStyle}
    >
      {attrs.backgroundImageUrl ? (
        <>
          <div className="bio-bg" aria-hidden="true">
            <div className="bio-bg-image" />
          </div>
          <div className="bio-scrim" aria-hidden="true" />
          <div className="bio-fx" aria-hidden="true" />
        </>
      ) : theme === "fairway" || !page.theme ? (
        <FairwayScene />
      ) : theme === "aurora" ? (
        <div className="aurora" aria-hidden="true">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
          <div className="aurora-grain" />
        </div>
      ) : attrs.pattern ? (
        <div className="bio-bg" aria-hidden="true">
          <div className="bio-pattern" />
        </div>
      ) : null}

      {attrs.customCss ? (
        <style
          dangerouslySetInnerHTML={{
            __html: attrs.customCss,
          }}
        />
      ) : null}

      <main className="bio" data-layout={attrs.layout}>
        <header className="bio-head bio-rise">
          <div className="bio-avatar">
            {attrs.avatarImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attrs.avatarImageUrl}
                alt=""
                width={92}
                height={92}
              />
            ) : (
              avatar
            )}
          </div>
          <h1 className="bio-name">{page.displayName}</h1>
          <p className="bio-handle">/{page.handle}</p>
          {page.bio ? <p className="bio-desc">{page.bio}</p> : null}
        </header>

        <section className="bio-section bio-rise">
          <div className="bio-links">
            {pageLinks.map((link) => (
              <a
                key={link.id}
                className={
                  link.featured ? "bio-link bio-link--featured" : "bio-link"
                }
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <span className="bio-link-body">
                  <span className="bio-link-title">{link.label}</span>
                  {link.sublabel ? (
                    <span className="bio-link-sub">{link.sublabel}</span>
                  ) : null}
                </span>
                <span className="bio-link-mark">›</span>
              </a>
            ))}
          </div>
        </section>

        <footer className="bio-foot bio-rise">
          <Link href="/">OMO Bio로 만든 페이지</Link>
        </footer>
      </main>
    </div>
  );
}
