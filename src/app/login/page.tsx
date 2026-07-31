import Link from "next/link";
import { LogIn } from "lucide-react";
import { Message } from "@/components/message";
import { messageFromSearchParams } from "@/lib/messages";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const message = messageFromSearchParams(await searchParams);

  return (
    <main className="form-page">
      <div className="form-shell">
        <form className="form-card" action={loginAction}>
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <LogIn size={18} />
            </span>
            <span>Login</span>
          </Link>
          <Message message={message} />
          <div className="field">
            <label htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="button primary" type="submit">
            <LogIn size={17} />
            Login
          </button>
          <p className="small muted">
            Need a page? <Link href="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
