import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ShareBar } from "@/components/share-bar";
import { SocialStrip } from "@/components/social-strip";
import { backgroundStyle, designToCssVars } from "@/lib/design";
import { getPublicPage } from "@/lib/public-page";
import { isReservedHandle } from "@/lib/reserved";
import { validateHandle } from "@/lib/validation";

export const dynamic = "force-dynamic";

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const validHandle = validateHandle(handle);
  if (!validHandle.ok || isReservedHandle(validHandle.value)) {
    notFound();
  }

  const result = await getPublicPage(validHandle.value);
  if (!result) {
    notFound();
  }

  const { page, links, channels, design } = result;
  const pageUrl = `${siteOrigin()}/${page.handle}`;
  const vars = designToCssVars(design);
  const bg = backgroundStyle(design);

  return (
    <main
      className={`public-page theme-${page.theme} font-${design.fontPair} layout-${design.layout} btn-${design.buttonStyle}`}
      style={{
        ...vars,
        ...bg,
        color: design.textColor,
      }}
    >
      {design.customCss ? (
        <style dangerouslySetInnerHTML={{ __html: design.customCss }} />
      ) : null}
      <section className="public-shell">
        <div className="public-profile public-reveal">
          <div className="avatar public-avatar" style={{ background: design.accentColor }}>
            {page.avatarInitials}
          </div>
          <div>
            <p className="public-handle">@{page.handle}</p>
            <h1 className="public-title">{page.displayName}</h1>
            {page.bio ? (
              <p className="public-bio" style={{ color: design.mutedColor }}>
                {page.bio}
              </p>
            ) : null}
          </div>
        </div>

        <ShareBar
          contactEmail={page.contactEmail}
          displayName={page.displayName}
          handle={page.handle}
          pageUrl={pageUrl}
          showContact={page.showContact}
          showShare={page.showShare}
        />

        <SocialStrip channels={channels} />

        <div className="link-list public-reveal-delay">
          {links.map((link) => (
            <a
              className="bio-link"
              href={link.url}
              key={link.id}
              rel="noopener noreferrer nofollow"
              target="_blank"
            >
              {link.label}
              <ExternalLink size={16} />
            </a>
          ))}
        </div>
        <p className="public-footer small" style={{ color: design.mutedColor }}>
          Powered by LinkBio
        </p>
      </section>
    </main>
  );
}
