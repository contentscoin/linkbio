import type { Metadata } from "next";
import NextLink from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getDb } from "@/db";
import { links, pages, type Link } from "@/db/schema";
import { FairwayScene } from "@/components/fairway-scene";
import { highlightHeadline, type HeadlineSegment } from "@/lib/headline";
import { linkIconPath } from "@/lib/link-icons";
import { groupLinksBySections } from "@/lib/link-sections";
import { resolvePublicRender } from "@/lib/schema-render";

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
  iconImageUrl,
  leadingIconUrl,
  iconSize,
  accent,
  objectFit,
}: {
  iconKey: string;
  iconUrl: string;
  iconImageUrl: string;
  leadingIconUrl?: string;
  iconSize: number;
  accent?: boolean;
  objectFit?: "contain" | "cover";
}) {
  const size = Math.min(96, Math.max(12, iconSize || 20));
  const style = {
    "--icon-size": `${size}px`,
    objectFit: objectFit || undefined,
  } as CSSProperties;
  const imageUrl = leadingIconUrl || iconImageUrl || iconUrl;
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="bio-link-icon-img"
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        style={style}
        data-role="link-icon"
        data-object-fit={objectFit}
      />
    );
  }
  const path = linkIconPath(iconKey);
  if (!path) return null;
  return (
    <span
      className={accent ? "bio-link-icon bio-link-icon--accent" : "bio-link-icon"}
      aria-hidden="true"
      style={style}
      data-role="link-icon"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </span>
  );
}

function LinkArrow({
  featured,
  showArrow,
  trailingIcon,
  arrowStyle,
  arrowPosition,
}: {
  featured: boolean;
  showArrow: boolean;
  trailingIcon: string;
  arrowStyle: string;
  arrowPosition: string;
}) {
  if (!showArrow && !trailingIcon) return null;
  const icon = trailingIcon || (featured ? "→" : "›");
  const style = arrowStyle === "circle" ? "circle" : "plain";
  const position =
    arrowPosition === "top-right" || arrowPosition === "end"
      ? arrowPosition
      : "trailing";
  return (
    <span
      className={`bio-link-mark bio-link-mark--${style}`}
      aria-hidden="true"
      data-role="link-arrow"
      data-arrow-style={style}
      data-arrow-position={position}
    >
      {icon}
    </span>
  );
}

function GolfHeroGraphic({ size }: { size?: number }) {
  const w = size || 88;
  const h = Math.round(w * 0.75);
  return (
    <svg
      className="bio-hero-graphic"
      viewBox="0 0 120 90"
      width={w}
      height={h}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-role="hero-graphic"
    >
      <path d="M8 72c18-6 34-28 52-34 14-5 28-2 40 8" opacity="0.85" />
      <path d="M18 78c22-4 40-18 58-22" opacity="0.45" />
      <path d="M86 28v34" />
      <path d="M86 28h18l-4 7 4 7H86" />
      <circle cx="86" cy="64" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HeadlineView({ parts }: { parts: HeadlineSegment[] }) {
  return (
    <p className="bio-headline" data-role="headline">
      {parts.map((part, i) => (
        <span key={i}>
          <span
            className={part.accent ? "bio-headline-accent" : undefined}
            data-role={part.accent ? "headline-highlight" : undefined}
          >
            {part.text}
          </span>
          {part.breakAfter ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

function BioLinkCard({
  link,
  forceCta = false,
}: {
  link: Link;
  forceCta?: boolean;
}) {
  // Expose stored span as-is (1..3); CSS grid clamps to available columns.
  // Never clamp by section columns — a 1-column section with span:2 items
  // must still emit data-span="2" so full-width rules apply under bento.
  const span = Math.min(Math.max(1, link.span || 1), 3);
  const mobileSpan = Math.min(Math.max(1, link.mobileSpan || link.span || 1), 3);
  const rowSpan = Math.min(Math.max(1, link.rowSpan || 1), 3);
  const isSpotlight = link.variant === "spotlight";
  const isCta = forceCta || link.featured;
  const variant = isCta
    ? "featured"
    : isSpotlight
      ? "spotlight"
      : link.variant === "full"
        ? "full"
        : link.variant || "card";
  const role = isCta ? "cta-card" : "card";
  const layout =
    link.layout === "vertical"
      ? "vertical"
      : isCta
        ? "horizontal"
        : "horizontal";
  const iconPlacement =
    link.iconPlacement === "top" || link.iconPlacement === "trailing"
      ? link.iconPlacement
      : "leading";
  const leadingIcon = link.leadingIconUrl || "";
  const hasIcon = Boolean(
    leadingIcon || link.iconImageUrl || link.iconUrl || link.iconKey,
  );
  const showArrow = link.showArrow !== false;
  const showDivider = link.showDivider === true;
  const subtitlePlacement =
    link.subtitlePlacement === "trailing" ? "trailing" : "body";
  const secondary = link.secondaryText || link.sublabel || "";
  const trailingText = link.trailingText || "";
  const arrowStyle = link.arrowStyle === "circle" ? "circle" : "plain";
  const arrowPosition =
    link.arrowPosition === "top-right" || link.arrowPosition === "end"
      ? link.arrowPosition
      : "trailing";
  const objectFit =
    link.objectFit === "contain" || link.objectFit === "cover"
      ? link.objectFit
      : undefined;
  const imagePosition =
    link.imagePosition === "top" ||
    link.imagePosition === "leading" ||
    link.imagePosition === "trailing"
      ? link.imagePosition
      : undefined;
  const iconSize =
    (link.imageSize && link.imageSize > 0 ? link.imageSize : 0) ||
    link.iconSize ||
    (isCta ? 28 : 20);

  const style: CSSProperties & Record<string, string | number> = {};
  if (typeof link.cardMinHeight === "number" && link.cardMinHeight > 0) {
    style.minHeight = `${Math.min(480, link.cardMinHeight)}px`;
  }
  if (typeof link.cardHeight === "number" && link.cardHeight > 0) {
    style.height = `${Math.min(640, link.cardHeight)}px`;
  }
  if (link.aspectRatio) style.aspectRatio = link.aspectRatio;
  if (link.cardPadding) style.padding = link.cardPadding;
  if (typeof link.mobileCardMinHeight === "number" && link.mobileCardMinHeight > 0) {
    style["--card-min-h-mobile"] = `${link.mobileCardMinHeight}px`;
  }
  if (typeof link.mobileCardHeight === "number" && link.mobileCardHeight > 0) {
    style["--card-h-mobile"] = `${link.mobileCardHeight}px`;
  }
  if (link.mobileCardPadding) {
    style["--card-pad-mobile"] = link.mobileCardPadding;
  }

  const className = [
    "bio-link",
    isCta ? "bio-link--featured" : "",
    isSpotlight ? "bio-link--spotlight" : "",
    hasIcon ? "bio-link--has-icon" : "",
    showDivider ? "bio-link--divider" : "",
    layout === "vertical"
      ? "bio-link--layout-vertical"
      : "bio-link--layout-horizontal",
  ]
    .filter(Boolean)
    .join(" ");

  const iconNode = (
    <LinkIcon
      iconKey={link.iconKey || ""}
      iconUrl={link.iconUrl || ""}
      iconImageUrl={link.iconImageUrl || ""}
      leadingIconUrl={leadingIcon}
      iconSize={iconSize}
      accent={isCta || isSpotlight}
      objectFit={objectFit}
    />
  );

  const bodySub =
    subtitlePlacement === "body" && secondary ? (
      <span className="bio-link-sub" data-role="link-sublabel">
        {secondary}
      </span>
    ) : null;

  const trailingSub =
    subtitlePlacement === "trailing" && (trailingText || secondary) ? (
      <span className="bio-link-trailing-text" data-role="link-trailing-text">
        {trailingText || secondary}
      </span>
    ) : trailingText ? (
      <span className="bio-link-trailing-text" data-role="link-trailing-text">
        {trailingText}
      </span>
    ) : null;

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
      data-col-span={String(span)}
      data-mobile-span={String(mobileSpan)}
      data-row-span={String(rowSpan)}
      data-group={link.section || undefined}
      data-section={link.section || undefined}
      data-icon={link.iconKey || undefined}
      data-layout={layout}
      data-card-layout={layout}
      data-icon-placement={iconPlacement}
      data-has-arrow={showArrow ? "1" : "0"}
      data-arrow-style={arrowStyle}
      data-arrow-position={arrowPosition}
      data-show-divider={showDivider ? "1" : "0"}
      data-subtitle-placement={subtitlePlacement}
      data-object-fit={objectFit}
      data-image-position={imagePosition}
      style={style}
    >
      {iconPlacement !== "trailing" ? iconNode : null}
      {showDivider ? (
        <span className="bio-link-divider" data-role="divider" aria-hidden="true" />
      ) : null}
      <span className="bio-link-content" data-role="link-content">
        {link.badge ? (
          <span className="bio-link-badge" data-role="badge">
            {link.badge}
          </span>
        ) : null}
        <span className="bio-link-body" data-role="body">
          <span className="bio-link-title" data-role="link-title">
            {link.label}
          </span>
          {bodySub}
        </span>
      </span>
      {trailingSub}
      {iconPlacement === "trailing" ? iconNode : null}
      <LinkArrow
        featured={isCta}
        showArrow={showArrow}
        trailingIcon={link.trailingIcon || ""}
        arrowStyle={arrowStyle}
        arrowPosition={arrowPosition}
      />
    </a>
  );
}

function CtaLinkCard({ link }: { link: Link }) {
  return <BioLinkCard link={{ ...link, featured: true }} forceCta />;
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
  const resolved = resolvePublicRender({
    designRaw: page.design,
    pageLinks,
    pageTheme: page.theme,
    pageAccent: page.accent,
    displayName: page.displayName,
  });
  const attrs = resolved.attrs;
  const renderLinks = resolved.links;
  const avatar =
    page.avatarInitials || page.avatarText || page.displayName.slice(0, 2);
  const accent = resolved.accent;
  const theme = resolved.theme;
  const logoUrl = attrs.logoImageUrl || attrs.logoUrl;
  const stageStyle: Record<string, string> = {
    ["--accent"]: accent,
  };
  if (attrs.contentMaxWidth) {
    stageStyle["--maxw"] = `${attrs.contentMaxWidth}px`;
  }
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
    stageStyle["--bg"] = attrs.tokens.pageBackground;
  }
  if (attrs.tokens?.cardBackground) {
    stageStyle["--card-bg"] = attrs.tokens.cardBackground;
    stageStyle["--card"] = attrs.tokens.cardBackground;
  }
  if (attrs.tokens?.cardText) {
    stageStyle["--card-fg"] = attrs.tokens.cardText;
    stageStyle["--fg"] = attrs.tokens.cardText;
  }
  if (attrs.tokens?.mutedText) {
    stageStyle["--muted-fg"] = attrs.tokens.mutedText;
    stageStyle["--fg-dim"] = attrs.tokens.mutedText;
  }
  if (attrs.tokens?.borderColor) {
    stageStyle["--border-color"] = attrs.tokens.borderColor;
    stageStyle["--line"] = attrs.tokens.borderColor;
  }
  if (attrs.logoWidth) stageStyle["--logo-w"] = `${attrs.logoWidth}px`;
  if (attrs.logoHeight) stageStyle["--logo-h"] = `${attrs.logoHeight}px`;
  if (attrs.desktopFontSize) {
    stageStyle["--font-size"] = `${attrs.desktopFontSize}px`;
  }
  if (attrs.mobileFontSize) {
    stageStyle["--font-size-mobile"] = `${attrs.mobileFontSize}px`;
  }
  if (attrs.lineHeight) stageStyle["--line-height"] = String(attrs.lineHeight);
  if (attrs.letterSpacing) stageStyle["--letter-spacing"] = attrs.letterSpacing;
  if (attrs.headlineFontSize) {
    stageStyle["--headline-size"] = `${attrs.headlineFontSize}px`;
  }
  if (attrs.headlineMobileFontSize) {
    stageStyle["--headline-size-mobile"] = `${attrs.headlineMobileFontSize}px`;
  }

  const sectionViews = groupLinksBySections(renderLinks, attrs.sections);
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
  const headlineParts: HeadlineSegment[] =
    attrs.headlineSegments && attrs.headlineSegments.length > 0
      ? attrs.headlineSegments
      : highlightHeadline(headline, attrs.headlineHighlight);

  const logoStyle: CSSProperties = {};
  if (attrs.logoWidth) logoStyle.width = attrs.logoWidth;
  if (attrs.logoHeight) logoStyle.height = attrs.logoHeight;
  if (attrs.logoAlign === "left") logoStyle.marginLeft = 0;
  if (attrs.logoAlign === "right") {
    logoStyle.marginLeft = "auto";
    logoStyle.marginRight = 0;
  }

  const heroPos = attrs.heroGraphicPosition || "right";
  const footer = resolved.footer;

  return (
    <div
      className="bio-stage"
      data-role="page-root"
      data-theme={theme}
      data-render-mode={resolved.mode}
      data-template={resolved.schema?.templateId || attrs.templateId || undefined}
      data-schema-version={resolved.schemaVersionId || undefined}
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
      data-content-max={attrs.contentMaxWidth ? String(attrs.contentMaxWidth) : undefined}
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
      ) : resolved.skipFairwayScene || theme === "navy-lime" ? (
        <div className="bio-bg bio-bg--solid" aria-hidden="true" />
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
          data-role="page-custom-css"
          dangerouslySetInnerHTML={{ __html: attrs.customCss }}
        />
      ) : null}

      <main
        className="bio"
        data-role="page-content"
        data-layout={attrs.layout}
        style={
          attrs.contentMaxWidth
            ? ({ ["--maxw"]: `${attrs.contentMaxWidth}px` } as CSSProperties)
            : undefined
        }
      >
        <header
          className="bio-head bio-rise"
          data-role="header"
          data-align={attrs.headerAlign}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="bio-logo"
              src={logoUrl}
              alt={page.displayName}
              data-role="logo"
              style={logoStyle}
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

          {!logoUrl ? (
            <h1 className="bio-name" data-role="display-name">
              {page.displayName}
            </h1>
          ) : (
            <span className="sr-only" data-role="display-name">
              {page.displayName}
            </span>
          )}

          {attrs.showHandle ? (
            <p className="bio-handle" data-role="handle">
              /{page.handle}
            </p>
          ) : null}

          {headlineParts.length > 0 ? (
            <div
              className="bio-hero"
              data-role="hero"
              data-hero-position={heroPos}
            >
              {heroPos === "above" ? (
                attrs.heroGraphicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="bio-hero-graphic-img"
                    src={attrs.heroGraphicUrl}
                    alt=""
                    data-role="hero-graphic"
                    style={{
                      width: attrs.heroGraphicSize || 88,
                      height: "auto",
                    }}
                  />
                ) : attrs.heroGraphic === "golf" ? (
                  <GolfHeroGraphic size={attrs.heroGraphicSize} />
                ) : null
              ) : null}
              <HeadlineView parts={headlineParts} />
              {heroPos === "right" || heroPos === "left" ? (
                attrs.heroGraphicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="bio-hero-graphic-img"
                    src={attrs.heroGraphicUrl}
                    alt=""
                    data-role="hero-graphic"
                    style={{
                      width: attrs.heroGraphicSize || 88,
                      height: "auto",
                    }}
                  />
                ) : attrs.heroGraphic === "golf" ? (
                  <GolfHeroGraphic size={attrs.heroGraphicSize} />
                ) : null
              ) : null}
              {heroPos === "below" ? (
                attrs.heroGraphicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="bio-hero-graphic-img"
                    src={attrs.heroGraphicUrl}
                    alt=""
                    data-role="hero-graphic"
                    style={{
                      width: attrs.heroGraphicSize || 88,
                      height: "auto",
                    }}
                  />
                ) : attrs.heroGraphic === "golf" ? (
                  <GolfHeroGraphic size={attrs.heroGraphicSize} />
                ) : null
              ) : null}
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
            <div className="bio-proof" data-role="proof-strip">
              {attrs.proofItems.map((item) => (
                <div
                  key={`${item.value}-${item.label}`}
                  className="bio-proof-item"
                  data-role="proof-item"
                >
                  <strong data-role="proof-value">{item.value}</strong>
                  <span data-role="proof-label">{item.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </header>

        {sectionViews.map((section) => {
          const sectionStyle: CSSProperties & Record<string, string> = {};
          if (typeof section.gap === "number") {
            sectionStyle["--section-gap"] = `${section.gap}px`;
          }
          if (typeof section.rowGap === "number") {
            sectionStyle["--section-row-gap"] = `${section.rowGap}px`;
          }
          if (typeof section.columnGap === "number") {
            sectionStyle["--section-col-gap"] = `${section.columnGap}px`;
          }
          if (typeof section.mobileGap === "number") {
            sectionStyle["--section-mobile-gap"] = `${section.mobileGap}px`;
          }
          return (
          <section
            key={section.id}
            className="bio-section bio-rise"
            data-section={section.id}
            data-section-id={section.id}
            data-role="section"
          >
            {section.title ? (
              <div className="bio-section-label" data-role="section-title">
                {section.title}
              </div>
            ) : null}
            <div
              className="bio-links"
              data-role="section-items"
              data-columns={String(section.columns)}
              data-mobile-columns={String(section.mobileColumns)}
              data-group={section.id}
              style={sectionStyle}
            >
              {section.links.map((link) =>
                link.featured ? (
                  <CtaLinkCard key={link.id} link={link} />
                ) : (
                  <BioLinkCard key={link.id} link={link} />
                ),
              )}
            </div>
          </section>
          );
        })}

        {footer.style !== "none" ? (
          <footer
            className={`bio-foot bio-rise bio-foot--${footer.style}`}
            data-role="footer"
            data-footer-style={footer.style}
          >
            {footer.url.startsWith("/") ? (
              <NextLink href={footer.url}>{footer.label}</NextLink>
            ) : (
              <a href={footer.url} target="_blank" rel="noopener noreferrer">
                {footer.label}
              </a>
            )}
          </footer>
        ) : null}
      </main>
    </div>
  );
}
