import Link from "next/link";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth">
      <div className="auth-top">
        <Link className="auth-back" href="/" aria-label="처음으로">
          ‹
        </Link>
        <div className="auth-progress" aria-hidden="true">
          <div className="auth-progress-fill" style={{ width: "100%" }} />
        </div>
      </div>

      <div className="auth-body">
        <h1 className="auth-title">다시 오셨네요</h1>
        <p className="auth-sub">이메일과 비밀번호를 입력하세요.</p>

        {error ? <div className="auth-notice">{error}</div> : null}

        <form action={loginAction}>
          <div className="auth-field" style={{ marginBottom: 22 }}>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="이메일"
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field" style={{ marginBottom: 28 }}>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="비밀번호"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-foot" style={{ position: "static", background: "none", padding: 0 }}>
            <button className="auth-btn" type="submit">
              로그인
            </button>
            <p className="auth-alt">
              계정이 없나요? <Link href="/signup">가입하기</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
