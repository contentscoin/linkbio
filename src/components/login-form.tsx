"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <form
      action="/api/auth/login"
      method="post"
      className="auth"
      noValidate
      onSubmit={() => {
        if (canSubmit) setPending(true);
      }}
    >
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

        {error ? (
          <p className="auth-notice" role="alert">
            {error}
          </p>
        ) : null}

        <div className="auth-field">
          <input
            ref={emailRef}
            className="auth-input"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            aria-label="이메일"
            aria-invalid={Boolean(error)}
            required
          />
        </div>

        <div className="auth-field" style={{ marginTop: 26 }}>
          <input
            className="auth-input"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="비밀번호"
            aria-invalid={Boolean(error)}
            required
          />
        </div>
      </div>

      <div className="auth-foot">
        <button
          className="auth-btn"
          type="submit"
          disabled={pending || !canSubmit}
        >
          {pending ? (
            <span className="auth-spin" aria-label="확인 중" />
          ) : (
            "로그인"
          )}
        </button>
        <p className="auth-alt">
          계정이 없나요? <Link href="/signup">가입하기</Link>
        </p>
      </div>
    </form>
  );
}
