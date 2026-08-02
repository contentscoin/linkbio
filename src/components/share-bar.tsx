"use client";

import { useState } from "react";
import { Check, Copy, Mail, Share2 } from "lucide-react";

type ShareBarProps = {
  handle: string;
  displayName: string;
  contactEmail?: string;
  showShare: boolean;
  showContact: boolean;
  pageUrl: string;
};

export function ShareBar({
  handle,
  displayName,
  contactEmail,
  showShare,
  showContact,
  pageUrl,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} · LinkBio`,
          text: `${displayName} (@${handle})`,
          url: pageUrl,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copyLink();
  }

  if (!showShare && !(showContact && contactEmail)) {
    return null;
  }

  return (
    <div className="share-bar" role="group" aria-label="Share and contact">
      {showShare ? (
        <>
          <button className="action-chip" type="button" onClick={nativeShare}>
            <Share2 size={16} />
            Share
          </button>
          <button className="action-chip" type="button" onClick={copyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </>
      ) : null}
      {showContact && contactEmail ? (
        <a
          className="action-chip"
          href={`mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(`Hello ${displayName}`)}`}
        >
          <Mail size={16} />
          Email
        </a>
      ) : null}
    </div>
  );
}
