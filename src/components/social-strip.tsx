import { ExternalLink } from "lucide-react";
import type { SocialChannel } from "@/db/schema";
import { platformLabel, type SocialPlatform } from "@/lib/social-platforms";

export function SocialStrip({ channels }: { channels: SocialChannel[] }) {
  if (channels.length === 0) return null;

  return (
    <div className="social-strip">
      {channels.map((channel) => (
        <a
          className="social-card"
          href={channel.url}
          key={channel.id}
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          {channel.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="social-thumb"
              height={52}
              src={channel.imageUrl}
              width={52}
            />
          ) : (
            <span className="social-fallback" aria-hidden="true">
              {platformLabel(channel.platform as SocialPlatform).slice(0, 2)}
            </span>
          )}
          <span className="social-copy">
            <span className="social-platform">
              {platformLabel(channel.platform as SocialPlatform)}
              {channel.handle ? ` · ${channel.handle}` : ""}
            </span>
            <strong>{channel.title || channel.siteName || channel.url}</strong>
            {channel.description ? <em>{channel.description}</em> : null}
          </span>
          <ExternalLink size={15} />
        </a>
      ))}
    </div>
  );
}
