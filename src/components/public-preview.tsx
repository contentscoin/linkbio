import { ExternalLink, Mail, Share2 } from "lucide-react";
import type { Link, SocialChannel } from "@/db/schema";
import { backgroundStyle, designToCssVars } from "@/lib/design";
import { platformLabel, type SocialPlatform } from "@/lib/social-platforms";
import type { PageDesign } from "@/lib/templates";

type PreviewProps = {
  handle: string;
  displayName: string;
  bio: string;
  avatarInitials: string;
  contactEmail: string;
  showShare: boolean;
  showContact: boolean;
  theme: string;
  design: PageDesign;
  links: Pick<Link, "id" | "label" | "url">[];
  channels: Pick<
    SocialChannel,
    "id" | "platform" | "handle" | "title" | "description" | "imageUrl" | "url"
  >[];
};

export function PublicPreview({
  handle,
  displayName,
  bio,
  avatarInitials,
  contactEmail,
  showShare,
  showContact,
  theme,
  design,
  links,
  channels,
}: PreviewProps) {
  const vars = designToCssVars(design);
  const bg = backgroundStyle(design);

  return (
    <div
      className={`admin-preview theme-${theme} font-${design.fontPair} layout-${design.layout} btn-${design.buttonStyle}`}
      style={{ ...vars, ...bg, color: design.textColor }}
    >
      <div className="admin-preview-inner">
        <div className="avatar public-avatar" style={{ background: design.accentColor }}>
          {avatarInitials}
        </div>
        <p className="public-handle">@{handle}</p>
        <h3 className="public-title">{displayName}</h3>
        {bio ? (
          <p className="public-bio" style={{ color: design.mutedColor }}>
            {bio}
          </p>
        ) : null}

        {(showShare || (showContact && contactEmail)) && (
          <div className="share-bar">
            {showShare ? (
              <span className="action-chip">
                <Share2 size={14} />
                Share
              </span>
            ) : null}
            {showContact && contactEmail ? (
              <span className="action-chip">
                <Mail size={14} />
                Email
              </span>
            ) : null}
          </div>
        )}

        {channels.length > 0 ? (
          <div className="social-strip">
            {channels.slice(0, 2).map((channel) => (
              <div className="social-card" key={channel.id}>
                <span className="social-fallback" aria-hidden="true">
                  {platformLabel(channel.platform as SocialPlatform).slice(0, 2)}
                </span>
                <span className="social-copy">
                  <span className="social-platform">
                    {platformLabel(channel.platform as SocialPlatform)}
                  </span>
                  <strong>{channel.title || channel.handle || channel.url}</strong>
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="link-list">
          {links.length === 0 ? (
            <p className="small" style={{ color: design.mutedColor }}>
              Links will appear here.
            </p>
          ) : (
            links.slice(0, 5).map((link) => (
              <span className="bio-link" key={link.id}>
                {link.label}
                <ExternalLink size={14} />
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
