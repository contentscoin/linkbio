import Link from "next/link";
import { ArrowRight, ExternalLink, ShieldCheck, Sparkles, UserRoundPen } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  return (
    <main>
      <SiteNav />
      <section className="shell hero">
        <div className="hero-copy">
          <p className="eyebrow">Separate LinkBio project</p>
          <h1>One clean public link page with a private editor behind it.</h1>
          <p className="lead">
            LinkBio gives a creator or operator a small public profile, ordered
            links, and a login-protected admin screen backed by Postgres.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/signup">
              Create your page
              <ArrowRight size={17} />
            </Link>
            <Link className="button secondary" href="/login">
              Open admin
            </Link>
          </div>
        </div>

        <div className="preview-phone" aria-label="LinkBio preview">
          <div className="preview-screen">
            <div className="avatar">GL</div>
            <div>
              <h2>Golf Luckyball</h2>
              <p>Lesson packages, orders, and member links in one place.</p>
            </div>
            <div className="link-list">
              {[
                "Lesson packages",
                "Kakao consultation",
                "Luckyball order",
                "Team printing",
                "FMGmembers",
              ].map((label) => (
                <span className="bio-link" key={label}>
                  {label}
                  <ExternalLink size={16} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="shell feature-grid">
          <article className="card">
            <ShieldCheck size={22} />
            <h3>Scoped mutations</h3>
            <p>Every edit is checked against the signed session user before it touches a row.</p>
          </article>
          <article className="card">
            <UserRoundPen size={22} />
            <h3>Fast editing</h3>
            <p>Update the profile, publish state, and link order from one compact admin page.</p>
          </article>
          <article className="card">
            <Sparkles size={22} />
            <h3>Seed ready</h3>
            <p>The golf profile seed can recreate the default link set without hardcoded secrets.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
