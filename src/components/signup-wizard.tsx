"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { signupAction } from "@/app/signup/actions";

type Step = "email" | "password" | "handle" | "name" | "review";

const steps: Step[] = ["email", "password", "handle", "name", "review"];

export function SignupWizard({ error }: { error?: string }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, startTransition] = useTransition();

  const index = steps.indexOf(step);
  const progress = ((index + 1) / steps.length) * 100;

  const canNext = useMemo(() => {
    if (step === "email") return email.includes("@");
    if (step === "password") return password.length >= 10;
    if (step === "handle") return handle.length >= 3;
    if (step === "name") return displayName.trim().length > 0;
    return true;
  }, [step, email, password, handle, displayName]);

  function goBack() {
    if (index <= 0) return;
    setStep(steps[index - 1]!);
  }

  function goNext() {
    if (!canNext) return;
    if (index >= steps.length - 1) return;
    setStep(steps[index + 1]!);
  }

  return (
    <main className="auth">
      <div className="auth-top">
        {index === 0 ? (
          <Link className="auth-back" href="/" aria-label="처음으로">
            ‹
          </Link>
        ) : (
          <button
            type="button"
            className="auth-back"
            aria-label="이전 단계"
            onClick={goBack}
          >
            ‹
          </button>
        )}
        <div className="auth-progress" aria-hidden="true">
          <div className="auth-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="auth-body">
        {error ? <div className="auth-notice">{error}</div> : null}

        {step === "email" ? (
          <div className="auth-step">
            <h1 className="auth-title">이메일을 알려주세요</h1>
            <p className="auth-sub">
              로그인할 때 씁니다. 광고 메일은 보내지 않습니다.
            </p>
            <input
              className="auth-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        ) : null}

        {step === "password" ? (
          <div className="auth-step">
            <h1 className="auth-title">비밀번호를 정해주세요</h1>
            <p className="auth-sub">10자 이상으로 입력하세요.</p>
            <input
              className="auth-input"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        ) : null}

        {step === "handle" ? (
          <div className="auth-step">
            <h1 className="auth-title">페이지 주소를 정하세요</h1>
            <p className="auth-sub">나중에 바꿀 수 있습니다.</p>
            <div className="auth-prefix">
              <span className="auth-prefix-text">/</span>
              <input
                className="auth-input"
                type="text"
                placeholder="bolbanjang"
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                autoComplete="off"
              />
            </div>
          </div>
        ) : null}

        {step === "name" ? (
          <div className="auth-step">
            <h1 className="auth-title">표시할 이름</h1>
            <p className="auth-sub">프로필 상단에 크게 보입니다.</p>
            <input
              className="auth-input"
              type="text"
              placeholder="Golf Luckyball"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
            />
          </div>
        ) : null}

        {step === "review" ? (
          <div className="auth-step">
            <h1 className="auth-title">이대로 시작할까요?</h1>
            <p className="auth-sub">가입 후 바로 편집할 수 있습니다.</p>
            <ul className="auth-review">
              <li>
                <span>이메일</span>
                <strong>{email}</strong>
              </li>
              <li>
                <span>주소</span>
                <strong>/{handle}</strong>
              </li>
              <li>
                <span>이름</span>
                <strong>{displayName}</strong>
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      <div className="auth-foot">
        {step === "review" ? (
          <form
            action={(fd) => {
              startTransition(() => {
                void signupAction(fd);
              });
            }}
          >
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="password" value={password} />
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="displayName" value={displayName} />
            <button className="auth-btn" type="submit" disabled={pending}>
              {pending ? "만드는 중…" : "무료로 시작하기"}
            </button>
          </form>
        ) : (
          <button
            className="auth-btn"
            type="button"
            disabled={!canNext}
            onClick={goNext}
          >
            다음
          </button>
        )}
        <p className="auth-alt">
          이미 계정이 있나요? <Link href="/login">로그인</Link>
        </p>
      </div>
    </main>
  );
}
