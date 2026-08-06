import type { Metadata } from "next";
import NextLink from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { links, pages, type Link } from "@/db/schema";
import { FairwayScene } from "@/components/fairway-scene";
import { highlightHeadline } from "@/lib/headline";
import { linkIconPath } from "@/lib/link-icons";
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

function LinkIcon({
  iconKey,
  iconUrl,
  accent,
}: {
  iconKey: string;
  iconUrl: string;
  accent?: boolean;
}) {
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="bio-link-icon-img" src={iconUrl} alt="" width={28} height={28} />
    );
  }
  const path = linkIconPath(iconKey);
  if (!path) return null;
  return (
    <span
      className={accent ? "bio-link-icon bio-link-icon--accent" : "bio-link-icon"}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

function GolfHeroGraphic() {
  return (
    <svg
      className="bio-hero-graphic"
      viewBox="0 0 120 90"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 72c18-6 34-28 52-34 14-5 28-2 40 8" opacity="0.85" />
      <path d="M18 78c22-4 40-18 58-22" opacity="0.45" />
      <path d="M86 28v34" />
      <path d="M86 28h18l-4 7 4 7H86" />
      <circle cx="86" cy="64" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BioLinkCard({ link }: { link: Link }) {
  const span = link.span >= 2 || link.featured ? 2 : Math.max(1, link.span || 1);
  const isSpotlight = link.variant === "spotlight";
  const variant = link.featured
    ? "featured"
    : isSpotlight
      ? "spotlight"
      : link.variant === "full"
        ? "full"
        : link.variant || "card";
  const role = link.featured ? "cta" : "link";
  const className = [
    "bio-link",
    link.featured ? "bio-link--featured" : "",
    isSpotlight ? "bio-link--spotlight" : "",
    link.iconKey || link.iconUrl ? "bio-link--has-icon" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      className={className}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      data-link-id={link.id}
      data-role={role}
      data-variant={variant}
      data-span={String(span)}
      data-group={link.section || undefined}
      data-section={link.section || undefined}
      data-icon={link.iconKey || undefined}
    >
      {link.badge ? <span className="bio-link-badge">{link.badge}</span> : null}
      <LinkIcon
        iconKey={link.iconKey || ""}
        iconUrl={link.iconUrl || ""}
        accent={link.featured || isSpotlight}
      />
      <span className="bio-link-body">
        <span className="bio-link-title">{link.label}</span>
        {link.sublabel ? (
          <span className="bio-link-sub">{link.sublabel}</span>
        ) : null}
      </span>
      <span className="bio-link-mark" aria-hidden="true">
        {link.featured ? "→" : "›"}
      </span>
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
  if (attrs.buttonFill) stageStyle["--button-fill"] = attrs.buttonFill;
  if (attrs.buttonText) stageStyle["--button-text"] = attrs.buttonText;
  if (attrs.featuredFill) stageStyle["--featured-fill"] = attrs.featuredFill;
  if (attrs.featuredText) stageStyle["--featured-text"] = attrs.featuredText;
  if (attrs.featuredBorder) stageStyle["--featured-border"] = attrs.featuredBorder;
  if (attrs.tokens?.pageBackground) {
    stageStyle["--page-bg"] = attrs.tokens.pageBackground;
  }
  if (attrs.tokens?.cardBackground) {
    stageStyle["--card-bg"] = attrs.tokens.cardBackground;
  }
  if (attrs.tokens?.cardText) stageStyle["--card-fg"] = attrs.tokens.cardText;
  if (attrs.tokens?.mutedText) stageStyle["--muted-fg"] = attrs.tokens.mutedText;
  if (attrs.tokens?.borderColor) {
    stageStyle["--border-color"] = attrs.tokens.borderColor;
  }

  const sectionViews = groupLinksBySections(pageLinks, attrs.sections);
  const hasTokens = Boolean(
    attrs.tokens && Object.values(attrs.tokens).some(Boolean),
  );
  const headline =
    attrs.headline ||
    (page.bio ? page.bio.split("\n").filter(Boolean)[0] : "") ||
    "";
  const headlineRest =
    !attrs.headline && page.bio
      ? page.bio.split("\n").filter(Boolean).slice(1).join("\n")
      : "";
  const headlineParts = highlightHeadline(
    headline,
    attrs.headlineHighlight,
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
      data-header={attrs.headerAlign}
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
        <style dangerouslySetInnerHTML={{ __html: attrs.customCss }} />
      ) : null}

      <main className="bio" data-layout={attrs.layout}>
        <header
          className="bio-head bio-rise"
          data-role="header"
          data-align={attrs.headerAlign}
        >
          {attrs.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="bio-logo"
              src={attrs.logoUrl}
              alt={page.displayName}
              data-role="logo"
            />
          ) : attrs.showAvatar ? (
            <div className="bio-avatar" data-role="avatar">
              {attrs.avatarImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attrs.avatarImageUrl} alt="" width={92} height={92} />
              ) : (
                avatar
              )}
            </div>
          ) : null}

          {!attrs.logoUrl ? (
            <h1 className="bio-name" data-role="name">
              {page.displayName}
            </h1>
          ) : (
            <span className="sr-only">{page.displayName}</span>
          )}

          {attrs.showHandle ? (
            <p className="bio-handle" data-role="handle">
              /{page.handle}
            </p>
          ) : null}

          {headlineParts.length > 0 ? (
            <div className="bio-hero" data-role="hero">
              <p className="bio-headline">
                {headlineParts.map((part, i) =>
                  part.accent ? (
                    <span key={i} className="bio-headline-accent">
                      {part.text}
                    </span>
                  ) : (
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </p>
              {attrs.heroGraphic === "golf" ? <GolfHeroGraphic /> : null}
            </div>
          ) : null}

          {headlineRest ? (
            <p className="bio-desc" data-role="bio">
              {headlineRest}
            </p>
          ) : attrs.headline && page.bio && page.bio !== attrs.headline ? (
            <p className="bio-desc" data-role="bio">
              {page.bio}
            </p>
          ) : null}

          {attrs.proofItems && attrs.proofItems.length > 0 ? (
            <div className="bio-proof" data-role="proof">
              {attrs.proofItems.map((item) => (
                <div key={`${item.value}-${item.label}`} className="bio-proof-item">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
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
