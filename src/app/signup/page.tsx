import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Message } from "@/components/message";
import { messageFromSearchParams } from "@/lib/messages";
import { signupAction } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const message = messageFromSearchParams(await searchParams);

  return (
    <main className="form-page">
      <div className="form-shell">
        <form className="form-card" action={signupAction}>
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <UserPlus size={18} />
            </span>
            <span>Create LinkBio</span>
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
              autoComplete="new-password"
              minLength={10}
              required
            />
          </div>
          <div className="split-fields">
            <div className="field">
              <label htmlFor="displayName">Display name</label>
              <input className="input" id="displayName" name="displayName" maxLength={80} required />
            </div>
            <div className="field">
              <label htmlFor="handle">Handle</label>
              <input
                className="input"
                id="handle"
                name="handle"
                pattern="[a-z0-9_-]{3,32}"
                placeholder="bolbanjang"
                required
              />
            </div>
          </div>
          <button className="button primary" type="submit">
            <UserPlus size={17} />
            Create page
          </button>
          <p className="small muted">
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
