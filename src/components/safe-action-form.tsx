"use client";

import {
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { unstable_isUnrecognizedActionError } from "next/navigation";

type ServerAction = (formData: FormData) => void | Promise<void>;

/**
 * Wraps admin mutations so a stale Server Action ID after deploy
 * reloads the page instead of crashing with UnrecognizedActionError.
 */
export function SafeActionForm({
  action,
  children,
  className,
}: {
  action: ServerAction;
  children: ReactNode;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (error) {
        if (unstable_isUnrecognizedActionError(error)) {
          setNotice("페이지 버전이 바뀌었습니다. 새로고침합니다…");
          window.location.reload();
          return;
        }
        throw error;
      }
    });
  }

  return (
    <form className={className} onSubmit={onSubmit} action={action}>
      {notice ? <div className="auth-notice">{notice}</div> : null}
      <fieldset
        disabled={pending}
        style={{ border: 0, margin: 0, padding: 0, minInlineSize: 0 }}
      >
        {children}
      </fieldset>
    </form>
  );
}
