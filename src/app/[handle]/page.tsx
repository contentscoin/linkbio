import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getPublicPage } from "@/lib/public-page";
import { isReservedHandle } from "@/lib/reserved";
import { validateHandle } from "@/lib/validation";

export const dynamic = "force-dynamic";

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

  return (
    <main className={`public-page theme-${result.page.theme}`}>
      <section className="public-shell">
        <div className="public-profile">
          <div className="avatar public-avatar">{result.page.avatarInitials}</div>
          <div>
            <h1 className="public-title">{result.page.displayName}</h1>
            {result.page.bio ? <p>{result.page.bio}</p> : null}
          </div>
        </div>
        <div className="link-list">
          {result.links.map((link) => (
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
        <p className="public-footer small muted">Powered by LinkBio</p>
      </section>
    </main>
  );
}
