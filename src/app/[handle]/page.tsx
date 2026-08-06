import type { Metadata } from "next";
import NextLink from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { links, pages, type Link } from "@/db/schema";
import { FairwayScene } from "@/components/fairway-scene";
import { groupLinksBySections } from "@/lib/link-sections";
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

function BioLinkCard({ link }: { link: Link }) {
  const span = link.span >= 2 || link.featured ? 2 : link.span;
  const variant =
    link.featured || link.variant === "featured"
      ? "featured"
      : link.variant === "full"
        ? "full"
        : link.variant || "card";
  const role = link.featured ? "cta" : "link";

  return (
    <a
      className={
        link.featured ? "bio-link bio-link--featured" : "bio-link"
      }
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-link-id={link.id}
      data-role={role}
      data-variant={variant}
      data-span={String(span)}
      data-group={link.section || undefined}
      data-section={link.section || undefined}
    >
      <span className="bio-link-body">
        <span className="bio-link-title">{link.label}</span>
        {link.sublabel ? (
          <span className="bio-link-sub">{link.sublabel}</span>
        ) : null}
      </span>
      <span className="bio-link-mark">›</span>
    </a>
  );
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
  if (attrs.buttonFill) {
    stageStyle["--button-fill"] = attrs.buttonFill;
  }
  if (attrs.buttonText) {
    stageStyle["--button-text"] = attrs.buttonText;
  }
  if (attrs.featuredFill) {
    stageStyle["--featured-fill"] = attrs.featuredFill;
  }
  if (attrs.featuredText) {
    stageStyle["--featured-text"] = attrs.featuredText;
  }
  if (attrs.featuredBorder) {
    stageStyle["--featured-border"] = attrs.featuredBorder;
  }
  if (attrs.tokens?.pageBackground) {
    stageStyle["--page-bg"] = attrs.tokens.pageBackground;
  }
  if (attrs.tokens?.cardBackground) {
    stageStyle["--card-bg"] = attrs.tokens.cardBackground;
  }
  if (attrs.tokens?.cardText) {
    stageStyle["--card-fg"] = attrs.tokens.cardText;
  }
  if (attrs.tokens?.mutedText) {
    stageStyle["--muted-fg"] = attrs.tokens.mutedText;
  }
  if (attrs.tokens?.borderColor) {
    stageStyle["--border-color"] = attrs.tokens.borderColor;
  }

  const sectionViews = groupLinksBySections(pageLinks, attrs.sections);
  const hasTokens = Boolean(
    attrs.tokens && Object.values(attrs.tokens).some(Boolean),
  );

  return (
    <div
      className="bio-stage"
      data-theme={theme}
      data-pattern={attrs.pattern}
      data-motion={attrs.motion}
      data-effect={attrs.effect}
      data-card={attrs.card}
      data-button={attrs.button}
      data-shadow={attrs.shadow}
      data-size={attrs.size}
      data-radius={attrs.radius}
      data-font={attrs.font}
      data-effect-card={attrs.effectCard}
      data-featured-style={attrs.featuredFill ? "custom" : undefined}
      data-tokens={hasTokens ? "1" : undefined}
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
        <header className="bio-head bio-rise" data-role="header">
          {attrs.showAvatar ? (
            <div className="bio-avatar" data-role="avatar">
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
          ) : null}
          <h1 className="bio-name" data-role="name">
            {page.displayName}
          </h1>
          {attrs.showHandle ? (
            <p className="bio-handle" data-role="handle">
              /{page.handle}
            </p>
          ) : null}
          {page.bio ? (
            <p className="bio-desc" data-role="bio">
              {page.bio}
            </p>
          ) : null}
        </header>

        {sectionViews.map((section) => (
          <section
            key={section.id}
            className="bio-section bio-rise"
            data-section={section.id}
            data-role="section"
          >
            {section.title ? (
              <div className="bio-section-label">{section.title}</div>
            ) : null}
            <div
              className="bio-links"
              data-columns={String(section.columns)}
              data-group={section.id}
            >
              {section.links.map((link) => (
                <BioLinkCard key={link.id} link={link} />
              ))}
            </div>
          </section>
        ))}

        <footer className="bio-foot bio-rise" data-role="footer">
          <NextLink href="/">OMO Bio로 만든 페이지</NextLink>
        </footer>
      </main>
    </div>
  );
}
