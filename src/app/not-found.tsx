import Link from "next/link";

export default function NotFound() {
  return (
    <main className="form-page">
      <section className="form-shell">
        <div className="form-card">
          <p className="eyebrow">404</p>
          <h1 className="compact-title">Page not found</h1>
          <p>The LinkBio page is private, missing, or no longer published.</p>
          <Link className="button primary" href="/">
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
