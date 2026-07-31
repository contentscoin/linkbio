import Link from "next/link";
import { Link2, LogIn, UserPlus } from "lucide-react";

export function SiteNav() {
  return (
    <header className="shell nav">
      <Link className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">
          <Link2 size={18} />
        </span>
        <span>LinkBio</span>
      </Link>
      <nav className="nav-actions" aria-label="Primary">
        <Link className="button secondary" href="/login">
          <LogIn size={17} />
          Login
        </Link>
        <Link className="button primary" href="/signup">
          <UserPlus size={17} />
          Create page
        </Link>
      </nav>
    </header>
  );
}
